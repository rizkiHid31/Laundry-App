import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { getActiveEmployee, hasActiveShift, createNotification } from '../utils/employee.js';

const paginate = (page: number, limit: number) => ({ skip: (page - 1) * limit, take: limit });

const meta = (page: number, limit: number, total: number) => ({
  page, limit, total, totalPages: Math.ceil(total / limit),
});

const hasActiveOrder = async (driverId: string) => {
  const [pickup, delivery] = await Promise.all([
    prisma.pickupRequest.findFirst({ where: { driverId, status: 'ON_THE_WAY' } }),
    prisma.deliveryRequest.findFirst({ where: { driverId, status: 'ON_THE_WAY' } }),
  ]);
  return !!(pickup || delivery);
};

export const getAvailablePickups = async (req: AuthRequest, res: Response) => {
  try {
    const employee = await getActiveEmployee(req.user!.userId);
    if (!employee) return res.status(403).json({ success: false, message: 'Not an employee' });
    if (!await hasActiveShift(employee.id)) return res.status(403).json({ success: false, message: 'Check in first' });

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const where = { outletId: employee.outletId, status: 'WAITING_DRIVER' as const };

    const [data, total] = await Promise.all([
      prisma.pickupRequest.findMany({
        where,
        include: { customer: { select: { name: true } }, address: true },
        orderBy: { createdAt: 'asc' },
        ...paginate(page, limit),
      }),
      prisma.pickupRequest.count({ where }),
    ]);
    return res.json({ success: true, data, meta: meta(page, limit, total) });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to fetch pickups' });
  }
};

export const acceptPickup = async (req: AuthRequest, res: Response) => {
  try {
    const employee = await getActiveEmployee(req.user!.userId);
    if (!employee) return res.status(403).json({ success: false, message: 'Not an employee' });
    if (!await hasActiveShift(employee.id)) return res.status(403).json({ success: false, message: 'Check in first' });
    if (await hasActiveOrder(employee.id)) return res.status(400).json({ success: false, message: 'Already has an active order' });

    const pickup = await prisma.pickupRequest.findFirst({
      where: { id: req.params['id'] as string, outletId: employee.outletId, status: 'WAITING_DRIVER' },
    });
    if (!pickup) return res.status(404).json({ success: false, message: 'Pickup not found' });

    const updated = await prisma.pickupRequest.update({
      where: { id: pickup.id },
      data: { driverId: employee.id, status: 'ON_THE_WAY', pickedUpAt: new Date() },
    });
    await createNotification(pickup.customerId, 'PICKUP_ACCEPTED', 'Driver sedang menuju ke lokasi Anda');
    return res.json({ success: true, data: updated });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to accept pickup' });
  }
};

export const arrivedAtOutlet = async (req: AuthRequest, res: Response) => {
  try {
    const employee = await getActiveEmployee(req.user!.userId);
    if (!employee) return res.status(403).json({ success: false, message: 'Not an employee' });

    const pickup = await prisma.pickupRequest.findFirst({
      where: { id: req.params['id'] as string, driverId: employee.id, status: 'ON_THE_WAY' },
    });
    if (!pickup) return res.status(404).json({ success: false, message: 'Pickup not found' });

    const updated = await prisma.pickupRequest.update({
      where: { id: pickup.id },
      data: { status: 'ARRIVED_AT_OUTLET', arrivedAtOutlet: new Date() },
    });
    return res.json({ success: true, data: updated });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to update pickup status' });
  }
};

export const getAvailableDeliveries = async (req: AuthRequest, res: Response) => {
  try {
    const employee = await getActiveEmployee(req.user!.userId);
    if (!employee) return res.status(403).json({ success: false, message: 'Not an employee' });
    if (!await hasActiveShift(employee.id)) return res.status(403).json({ success: false, message: 'Check in first' });

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const where = { outletId: employee.outletId, status: 'WAITING_DRIVER' as const };

    const [data, total] = await Promise.all([
      prisma.deliveryRequest.findMany({
        where,
        include: { order: { select: { invoiceNumber: true, totalPrice: true } }, address: true },
        orderBy: { createdAt: 'asc' },
        ...paginate(page, limit),
      }),
      prisma.deliveryRequest.count({ where }),
    ]);
    return res.json({ success: true, data, meta: meta(page, limit, total) });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to fetch deliveries' });
  }
};

export const acceptDelivery = async (req: AuthRequest, res: Response) => {
  try {
    const employee = await getActiveEmployee(req.user!.userId);
    if (!employee) return res.status(403).json({ success: false, message: 'Not an employee' });
    if (!await hasActiveShift(employee.id)) return res.status(403).json({ success: false, message: 'Check in first' });
    if (await hasActiveOrder(employee.id)) return res.status(400).json({ success: false, message: 'Already has an active order' });

    const delivery = await prisma.deliveryRequest.findFirst({
      where: { id: req.params['id'] as string, outletId: employee.outletId, status: 'WAITING_DRIVER' },
      include: { order: { include: { pickupRequest: { select: { customerId: true } } } } },
    });
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found' });

    await prisma.$transaction([
      prisma.deliveryRequest.update({ where: { id: delivery.id }, data: { driverId: employee.id, status: 'ON_THE_WAY', pickedUpAt: new Date() } }),
      prisma.order.update({ where: { id: delivery.orderId }, data: { status: 'ON_DELIVERY' } }),
    ]);
    await createNotification(delivery.order.pickupRequest.customerId, 'DELIVERY_STARTED', 'Laundry Anda sedang dalam perjalanan');
    return res.json({ success: true, message: 'Delivery accepted' });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to accept delivery' });
  }
};

export const deliveredOrder = async (req: AuthRequest, res: Response) => {
  try {
    const employee = await getActiveEmployee(req.user!.userId);
    if (!employee) return res.status(403).json({ success: false, message: 'Not an employee' });

    const delivery = await prisma.deliveryRequest.findFirst({
      where: { id: req.params['id'] as string, driverId: employee.id, status: 'ON_THE_WAY' },
      include: { order: { include: { pickupRequest: { select: { customerId: true } } } } },
    });
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found' });

    const autoConfirmAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    await prisma.$transaction([
      prisma.deliveryRequest.update({ where: { id: delivery.id }, data: { status: 'DELIVERED', deliveredAt: new Date() } }),
      prisma.order.update({ where: { id: delivery.orderId }, data: { status: 'DELIVERED', autoConfirmAt } }),
    ]);
    await createNotification(delivery.order.pickupRequest.customerId, 'ORDER_DELIVERED', 'Laundry Anda telah tiba');
    return res.json({ success: true, message: 'Order delivered' });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to update delivery' });
  }
};

export const getDriverHistory = async (req: AuthRequest, res: Response) => {
  try {
    const employee = await getActiveEmployee(req.user!.userId);
    if (!employee) return res.status(403).json({ success: false, message: 'Not an employee' });

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const [pickups, deliveries] = await Promise.all([
      prisma.pickupRequest.findMany({
        where: { driverId: employee.id, status: 'ARRIVED_AT_OUTLET' },
        include: { address: true, customer: { select: { name: true } } },
        orderBy: { arrivedAtOutlet: 'desc' },
        ...paginate(page, limit),
      }),
      prisma.deliveryRequest.findMany({
        where: { driverId: employee.id, status: 'DELIVERED' },
        include: { address: true, order: { select: { invoiceNumber: true } } },
        orderBy: { deliveredAt: 'desc' },
        ...paginate(page, limit),
      }),
    ]);
    return res.json({ success: true, data: { pickups, deliveries } });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to fetch history' });
  }
};
