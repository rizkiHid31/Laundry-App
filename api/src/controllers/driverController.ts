import { Response } from 'express';
import { PickupStatus, DeliveryStatus, OrderStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { EmployeeRequest } from '../middleware/employeeGuard';

const getPagination = (query: Record<string, unknown>) => {
  const page = Math.max(1, parseInt(query['page'] as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query['limit'] as string) || 10));
  return { page, limit, skip: (page - 1) * limit };
};

const hasActiveOrder = async (driverId: string): Promise<boolean> => {
  const [activePickup, activeDelivery] = await prisma.$transaction([
    prisma.pickupRequest.count({ where: { driverId, status: PickupStatus.ON_THE_WAY } }),
    prisma.deliveryRequest.count({ where: { driverId, status: DeliveryStatus.ON_THE_WAY } }),
  ]);
  return activePickup > 0 || activeDelivery > 0;
};

// ─── PICKUP ────────────────────────────────────────────────────────────────────

export const getAvailablePickups = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { outletId } = req.employee!;
    const { page, limit, skip } = getPagination(req.query as Record<string, unknown>);

    const where = { outletId, status: PickupStatus.WAITING_DRIVER, driverId: null };
    const [pickups, total] = await prisma.$transaction([
      prisma.pickupRequest.findMany({
        where,
        include: {
          customer: { select: { name: true } },
          address: { select: { label: true, fullAddress: true, latitude: true, longitude: true } },
        },
        orderBy: { scheduledAt: 'asc' },
        skip,
        take: limit,
      }),
      prisma.pickupRequest.count({ where }),
    ]);

    res.json({ success: true, data: pickups, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('getAvailablePickups error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data' });
  }
};

export const acceptPickup = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { id: driverId } = req.employee!;
    const { id } = req.params as { id: string };

    if (await hasActiveOrder(driverId)) {
      res.status(400).json({ success: false, message: 'Masih ada order aktif, selesaikan terlebih dahulu' });
      return;
    }

    const pickup = await prisma.pickupRequest.findUnique({ where: { id } });
    if (!pickup || pickup.status !== PickupStatus.WAITING_DRIVER || pickup.driverId) {
      res.status(400).json({ success: false, message: 'Pickup tidak tersedia' });
      return;
    }

    const updated = await prisma.pickupRequest.update({
      where: { id },
      data: { driverId, status: PickupStatus.ON_THE_WAY, pickedUpAt: new Date() },
    });

    res.json({ success: true, message: 'Pickup diterima', data: updated });
  } catch (error) {
    console.error('acceptPickup error:', error);
    res.status(500).json({ success: false, message: 'Gagal menerima pickup' });
  }
};

export const arriveAtOutlet = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { id: driverId } = req.employee!;
    const { id } = req.params as { id: string };

    const pickup = await prisma.pickupRequest.findUnique({ where: { id } });
    if (!pickup || pickup.driverId !== driverId || pickup.status !== PickupStatus.ON_THE_WAY) {
      res.status(400).json({ success: false, message: 'Pickup tidak valid' });
      return;
    }

    const updated = await prisma.pickupRequest.update({
      where: { id },
      data: { status: PickupStatus.ARRIVED_AT_OUTLET, arrivedAtOutlet: new Date() },
    });

    res.json({ success: true, message: 'Tiba di outlet', data: updated });
  } catch (error) {
    console.error('arriveAtOutlet error:', error);
    res.status(500).json({ success: false, message: 'Gagal update status' });
  }
};

export const getActivePickup = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { id: driverId } = req.employee!;
    const pickup = await prisma.pickupRequest.findFirst({
      where: { driverId, status: PickupStatus.ON_THE_WAY },
      include: {
        customer: { select: { name: true } },
        address: { select: { label: true, fullAddress: true, latitude: true, longitude: true } },
      },
    });
    res.json({ success: true, data: pickup });
  } catch (error) {
    console.error('getActivePickup error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data' });
  }
};

export const getPickupHistory = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { id: driverId } = req.employee!;
    const { page, limit, skip } = getPagination(req.query as Record<string, unknown>);

    const where = { driverId, status: PickupStatus.ARRIVED_AT_OUTLET };
    const [pickups, total] = await prisma.$transaction([
      prisma.pickupRequest.findMany({
        where,
        include: { customer: { select: { name: true } }, address: { select: { label: true, fullAddress: true } } },
        orderBy: { arrivedAtOutlet: 'desc' },
        skip,
        take: limit,
      }),
      prisma.pickupRequest.count({ where }),
    ]);

    res.json({ success: true, data: pickups, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('getPickupHistory error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil history' });
  }
};

// ─── DELIVERY ──────────────────────────────────────────────────────────────────

export const getAvailableDeliveries = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { outletId } = req.employee!;
    const { page, limit, skip } = getPagination(req.query as Record<string, unknown>);

    const where = { outletId, status: DeliveryStatus.WAITING_DRIVER, driverId: null };
    const [deliveries, total] = await prisma.$transaction([
      prisma.deliveryRequest.findMany({
        where,
        include: {
          order: { select: { invoiceNumber: true, totalPrice: true } },
          address: { select: { label: true, fullAddress: true, latitude: true, longitude: true } },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      prisma.deliveryRequest.count({ where }),
    ]);

    res.json({ success: true, data: deliveries, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('getAvailableDeliveries error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data' });
  }
};

export const acceptDelivery = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { id: driverId } = req.employee!;
    const { id } = req.params as { id: string };

    if (await hasActiveOrder(driverId)) {
      res.status(400).json({ success: false, message: 'Masih ada order aktif, selesaikan terlebih dahulu' });
      return;
    }

    const delivery = await prisma.deliveryRequest.findUnique({ where: { id } });
    if (!delivery || delivery.status !== DeliveryStatus.WAITING_DRIVER || delivery.driverId) {
      res.status(400).json({ success: false, message: 'Delivery tidak tersedia' });
      return;
    }

    const updated = await prisma.deliveryRequest.update({
      where: { id },
      data: { driverId, status: DeliveryStatus.ON_THE_WAY, pickedUpAt: new Date() },
    });

    res.json({ success: true, message: 'Delivery diterima', data: updated });
  } catch (error) {
    console.error('acceptDelivery error:', error);
    res.status(500).json({ success: false, message: 'Gagal menerima delivery' });
  }
};

export const completeDelivery = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { id: driverId } = req.employee!;
    const { id } = req.params as { id: string };

    const delivery = await prisma.deliveryRequest.findUnique({ where: { id } });
    if (!delivery || delivery.driverId !== driverId || delivery.status !== DeliveryStatus.ON_THE_WAY) {
      res.status(400).json({ success: false, message: 'Delivery tidak valid' });
      return;
    }

    await prisma.$transaction([
      prisma.deliveryRequest.update({
        where: { id },
        data: { status: DeliveryStatus.DELIVERED, deliveredAt: new Date() },
      }),
      prisma.order.update({
        where: { id: delivery.orderId },
        data: { status: OrderStatus.DELIVERED },
      }),
    ]);

    res.json({ success: true, message: 'Delivery selesai' });
  } catch (error) {
    console.error('completeDelivery error:', error);
    res.status(500).json({ success: false, message: 'Gagal menyelesaikan delivery' });
  }
};

export const getActiveDelivery = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { id: driverId } = req.employee!;
    const delivery = await prisma.deliveryRequest.findFirst({
      where: { driverId, status: DeliveryStatus.ON_THE_WAY },
      include: {
        order: { select: { invoiceNumber: true, totalPrice: true } },
        address: { select: { label: true, fullAddress: true, latitude: true, longitude: true } },
      },
    });
    res.json({ success: true, data: delivery });
  } catch (error) {
    console.error('getActiveDelivery error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data' });
  }
};

export const getDeliveryHistory = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { id: driverId } = req.employee!;
    const { page, limit, skip } = getPagination(req.query as Record<string, unknown>);

    const where = { driverId, status: DeliveryStatus.DELIVERED };
    const [deliveries, total] = await prisma.$transaction([
      prisma.deliveryRequest.findMany({
        where,
        include: {
          order: { select: { invoiceNumber: true, totalPrice: true } },
          address: { select: { label: true, fullAddress: true } },
        },
        orderBy: { deliveredAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.deliveryRequest.count({ where }),
    ]);

    res.json({ success: true, data: deliveries, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('getDeliveryHistory error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil history' });
  }
};
