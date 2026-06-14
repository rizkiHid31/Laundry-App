import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { getActiveEmployee, hasActiveShift } from '../utils/employee.js';

const getStationForWorker = (stationId: string, workerId: string) =>
  prisma.orderStation.findFirst({
    where: { id: stationId, workerId, status: 'IN_PROGRESS' },
    include: {
      stationItems: true,
      bypassRequests: true,
      order: { include: { orderItems: true, payment: true, pickupRequest: { select: { customerId: true, addressId: true } } } },
    },
  });

const getReferenceItems = async (station: any) => {
  if (station.station === 'WASHING') {
    return station.order.orderItems.map((i: any) => ({ laundryItemId: i.laundryItemId, qty: i.quantity }));
  }
  const prev = station.station === 'IRONING' ? 'WASHING' : 'IRONING';
  const prevStation = await prisma.orderStation.findUnique({
    where: { orderId_station: { orderId: station.orderId, station: prev } },
    include: { stationItems: true },
  });
  return prevStation?.stationItems.map((si: any) => ({ laundryItemId: si.laundryItemId, qty: si.quantityInput })) ?? [];
};

const quantitiesMatch = (stationItems: any[], refItems: any[]) => {
  if (stationItems.length !== refItems.length) return false;
  return refItems.every((ref) => {
    const match = stationItems.find((s) => s.laundryItemId === ref.laundryItemId);
    return match && match.quantityInput === ref.qty;
  });
};

const createDeliveryReq = (order: any) =>
  prisma.deliveryRequest.create({
    data: { orderId: order.id, outletId: order.outletId, addressId: order.pickupRequest.addressId },
  });

const handlePackingComplete = async (order: any) => {
  const isPaid = order.payment?.status === 'PAID';
  const newStatus = isPaid ? 'READY_TO_DELIVER' as const : 'WAITING_PAYMENT' as const;
  await prisma.order.update({ where: { id: order.id }, data: { status: newStatus } });
  if (isPaid) await createDeliveryReq(order);
};

const transitionOrder = async (station: any) => {
  const { station: name, orderId, order } = station;
  if (name === 'WASHING') await prisma.order.update({ where: { id: orderId }, data: { status: 'IRONING' } });
  else if (name === 'IRONING') await prisma.order.update({ where: { id: orderId }, data: { status: 'PACKING' } });
  else await handlePackingComplete(order);
};

export const startStation = async (req: AuthRequest, res: Response) => {
  try {
    const employee = await getActiveEmployee(req.user!.userId);
    if (!employee) return res.status(403).json({ success: false, message: 'Not an employee' });
    if (!await hasActiveShift(employee.id)) return res.status(403).json({ success: false, message: 'Check in first' });

    const station = await prisma.orderStation.findFirst({
      where: { id: req.params['stationId'] as string, status: 'PENDING', order: { outletId: employee.outletId } },
    });
    if (!station) return res.status(404).json({ success: false, message: 'Station not found' });

    const updated = await prisma.orderStation.update({
      where: { id: station.id },
      data: { workerId: employee.id, status: 'IN_PROGRESS', startedAt: new Date() },
    });
    if (station.station === 'WASHING') {
      await prisma.order.update({ where: { id: station.orderId }, data: { status: 'WASHING' } });
    }
    return res.json({ success: true, data: updated });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to start station' });
  }
};

export const submitStationItems = async (req: AuthRequest, res: Response) => {
  try {
    const employee = await getActiveEmployee(req.user!.userId);
    if (!employee) return res.status(403).json({ success: false, message: 'Not an employee' });

    const station = await prisma.orderStation.findFirst({
      where: { id: req.params['stationId'] as string, workerId: employee.id, status: 'IN_PROGRESS' },
    });
    if (!station) return res.status(404).json({ success: false, message: 'Station not found' });

    const items = req.body.items as { laundryItemId: string; quantityInput: number }[];
    if (!items?.length) return res.status(400).json({ success: false, message: 'Items are required' });

    await prisma.$transaction([
      prisma.stationItem.deleteMany({ where: { stationId: station.id } }),
      prisma.stationItem.createMany({ data: items.map((i) => ({ stationId: station.id, ...i })) }),
    ]);
    return res.json({ success: true, message: 'Items submitted' });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to submit items' });
  }
};

export const completeStation = async (req: AuthRequest, res: Response) => {
  try {
    const employee = await getActiveEmployee(req.user!.userId);
    if (!employee) return res.status(403).json({ success: false, message: 'Not an employee' });

    const station = await getStationForWorker(req.params['stationId'] as string, employee.id);
    if (!station) return res.status(404).json({ success: false, message: 'Station not found' });

    const approvedBypass = station.bypassRequests.find((b: any) => b.status === 'APPROVED');
    if (!approvedBypass) {
      const refItems = await getReferenceItems(station);
      if (!quantitiesMatch(station.stationItems, refItems)) {
        return res.status(400).json({ success: false, message: 'Quantities do not match. Submit a bypass request.' });
      }
    }

    const completedStatus = approvedBypass ? 'BYPASSED' as const : 'COMPLETED' as const;
    await prisma.orderStation.update({ where: { id: station.id }, data: { status: completedStatus, completedAt: new Date() } });
    await transitionOrder(station);
    return res.json({ success: true, message: 'Station completed' });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to complete station' });
  }
};

export const requestBypass = async (req: AuthRequest, res: Response) => {
  try {
    const employee = await getActiveEmployee(req.user!.userId);
    if (!employee) return res.status(403).json({ success: false, message: 'Not an employee' });

    const station = await prisma.orderStation.findFirst({
      where: { id: req.params['stationId'] as string, workerId: employee.id, status: 'IN_PROGRESS' },
    });
    if (!station) return res.status(404).json({ success: false, message: 'Station not found' });

    const { reason } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: 'Reason is required' });

    const pending = await prisma.bypassRequest.findFirst({ where: { stationId: station.id, status: 'PENDING' } });
    if (pending) return res.status(400).json({ success: false, message: 'Bypass already pending' });

    const bypass = await prisma.bypassRequest.create({ data: { stationId: station.id, reason } });
    return res.status(201).json({ success: true, data: bypass });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to request bypass' });
  }
};
