import { prisma } from '../lib/prisma';
import { ORDER_STATUS, PRICE_PER_KG, STATION_FLOW } from '../constants/orderStatus';
import { AuthValidationError } from './authValidation';
import { buildPaginated, parsePagination } from '../utils/pagination';

const orderInclude = {
  items: true,
  outlet: true,
  payments: true,
  stationLogs: true,
  pickupRequest: { include: { driver: { include: { user: true } } } },
};

export const orderService = {
  async createFromPickup(adminUserId: string, data: Record<string, unknown>) {
    const admin = await prisma.user.findUnique({ where: { id: adminUserId } });
    if (!admin?.outletId) throw new AuthValidationError(403, 'Admin outlet tidak valid');
    const order = await prisma.order.findFirst({
      where: {
        id: String(data.orderId),
        outletId: admin.outletId,
        status: ORDER_STATUS.ARRIVED_AT_OUTLET,
      },
    });
    if (!order) throw new AuthValidationError(404, 'Order tidak ditemukan');
    const items = data.items as Array<{ itemType: string; quantity: number }>;
    const totalKilo = Number(data.totalKilo);
    const totalPrice = totalKilo * PRICE_PER_KG;
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    await prisma.orderItem.createMany({
      data: items.map((item) => ({
        orderId: order.id,
        itemType: item.itemType,
        quantity: item.quantity,
        price: PRICE_PER_KG,
      })),
    });
    return prisma.order.update({
      where: { id: order.id },
      data: {
        totalKilo,
        totalPrice,
        status: ORDER_STATUS.WASHING,
        paymentDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        notes: data.notes ? String(data.notes) : null,
      },
      include: orderInclude,
    });
  },

  async listForCustomer(userId: string, query: Record<string, string>) {
    const { page, limit, skip, sortBy, sortOrder } = parsePagination(query, [
      'createdAt',
      'invoiceNumber',
      'status',
    ]);
    const where: Record<string, unknown> = { userId };
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { invoiceNumber: { contains: query.search } },
      ];
    }
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {
        ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
        ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
      };
    }
    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: orderInclude,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.order.count({ where }),
    ]);
    return buildPaginated(items, total, page, limit);
  },

  async getById(userId: string, role: string, orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: orderInclude,
    });
    if (!order) throw new AuthValidationError(404, 'Order tidak ditemukan');
    const isOwner = order.userId === userId;
    const isStaff = ['SUPER_ADMIN', 'OUTLET_ADMIN', 'WORKER', 'DRIVER'].includes(role);
    if (!isOwner && !isStaff) throw new AuthValidationError(403, 'Akses ditolak');
    return order;
  },

  async listForOutlet(outletId: string, query: Record<string, string>) {
    const { page, limit, skip, sortBy, sortOrder } = parsePagination(query, [
      'createdAt',
      'status',
    ]);
    const where = { outletId, ...(query.status ? { status: query.status } : {}) };
    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: orderInclude,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.order.count({ where }),
    ]);
    return buildPaginated(items, total, page, limit);
  },

  async confirmReceived(userId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId, status: ORDER_STATUS.DELIVERED },
    });
    if (!order) throw new AuthValidationError(404, 'Order tidak dapat dikonfirmasi');
    return prisma.order.update({
      where: { id: orderId },
      data: { status: ORDER_STATUS.COMPLETED, confirmedAt: new Date() },
    });
  },

  getNextStation(current: string): string | null {
    const idx = STATION_FLOW.indexOf(current as (typeof STATION_FLOW)[number]);
    if (idx < 0 || idx >= STATION_FLOW.length - 1) return null;
    return STATION_FLOW[idx + 1] ?? null;
  },
};
