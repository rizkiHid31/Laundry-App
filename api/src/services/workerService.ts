import { prisma } from '../lib/prisma';
import { ORDER_STATUS } from '../constants/orderStatus';
import { AuthValidationError } from './authValidation';
import { orderService } from './orderService';

const getExpectedQty = async (orderId: string, stationType: string) => {
  const flow = ['WASHING', 'IRONING', 'PACKING'];
  const idx = flow.indexOf(stationType);
  if (idx <= 0) {
    const items = await prisma.orderItem.findMany({ where: { orderId } });
    return items.map((i) => ({ itemType: i.itemType, quantity: i.quantity }));
  }
  const prev = flow[idx - 1]!;
  const logs = await prisma.stationItemLog.findMany({
    where: { orderId, stationType: prev },
  });
  return logs.map((l) => ({ itemType: l.itemType, quantity: l.quantity }));
};

const qtyMatches = (
  expected: Array<{ itemType: string; quantity: number }>,
  actual: Array<{ itemType: string; quantity: number }>
) => {
  const map = new Map(expected.map((e) => [e.itemType, e.quantity]));
  return actual.every((a) => map.get(a.itemType) === a.quantity);
};

export const workerService = {
  async getActiveShift(workerId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return prisma.shift.findFirst({
      where: {
        workerId,
        shiftDate: { gte: today },
        status: 'PRESENT',
      },
      include: { station: true },
    });
  },

  async listOrders(workerId: string, workerType: string) {
    const worker = await prisma.user.findUnique({ where: { id: workerId } });
    if (!worker?.outletId) throw new AuthValidationError(403, 'Worker tidak terdaftar di outlet');
    const statusMap: Record<string, string> = {
      WASHING: ORDER_STATUS.WASHING,
      IRONING: ORDER_STATUS.IRONING,
      PACKING: ORDER_STATUS.PACKING,
    };
    const status = statusMap[workerType];
    if (!status) throw new AuthValidationError(400, 'Invalid worker type');
    return prisma.order.findMany({
      where: { outletId: worker.outletId, status },
      include: { items: true, stationLogs: true, bypassRequests: true },
      orderBy: { createdAt: 'asc' },
    });
  },

  async processStation(workerId: string, workerType: string, data: Record<string, unknown>) {
    const shift = await this.getActiveShift(workerId);
    if (!shift) throw new AuthValidationError(403, 'Anda tidak sedang shift');
    const orderId = String(data.orderId);
    const items = data.items as Array<{ itemType: string; quantity: number }>;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new AuthValidationError(404, 'Order tidak ditemukan');
    const expected = await getExpectedQty(orderId, workerType);
    const approvedBypass = await prisma.bypassRequest.findFirst({
      where: { orderId, workerId, stationType: workerType, status: 'APPROVED' },
    });
    if (!approvedBypass && !qtyMatches(expected, items)) {
      throw new AuthValidationError(
        409,
        'Quantity tidak sesuai. Ajukan bypass ke outlet admin.'
      );
    }
    await prisma.stationItemLog.deleteMany({
      where: { orderId, stationType: workerType },
    });
    await prisma.stationItemLog.createMany({
      data: items.map((item) => ({
        orderId,
        workerId,
        stationType: workerType,
        itemType: item.itemType,
        quantity: item.quantity,
      })),
    });
    if (approvedBypass) {
      await prisma.bypassRequest.update({
        where: { id: approvedBypass.id },
        data: { status: 'USED' },
      });
    }
    const next = orderService.getNextStation(workerType);
    const newStatus = next
      ? ORDER_STATUS[next as keyof typeof ORDER_STATUS]
      : ORDER_STATUS.WAITING_PAYMENT;
    return prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
      include: { items: true, stationLogs: true },
    });
  },

  async requestBypass(workerId: string, workerType: string, data: Record<string, unknown>) {
    return prisma.bypassRequest.create({
      data: {
        orderId: String(data.orderId),
        workerId,
        stationType: workerType,
        reason: String(data.reason),
        status: 'PENDING',
      },
    });
  },

  async approveBypass(adminId: string, bypassId: string, data: Record<string, unknown>) {
    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!admin?.outletId) throw new AuthValidationError(403, 'Akses ditolak');
    const bypass = await prisma.bypassRequest.findUnique({
      where: { id: bypassId },
      include: { order: true },
    });
    if (!bypass || bypass.order.outletId !== admin.outletId) {
      throw new AuthValidationError(404, 'Bypass request tidak ditemukan');
    }
    if (!data.adminNotes && !data.problem) {
      throw new AuthValidationError(400, 'Keterangan problem wajib diisi');
    }
    return prisma.bypassRequest.update({
      where: { id: bypassId },
      data: {
        status: 'APPROVED',
        adminNotes: String(data.adminNotes || data.problem),
        approvedById: adminId,
        approvedAt: new Date(),
      },
    });
  },

  async listPendingBypass(outletId: string) {
    return prisma.bypassRequest.findMany({
      where: { status: 'PENDING', order: { outletId } },
      include: {
        order: { select: { invoiceNumber: true } },
        worker: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },
};
