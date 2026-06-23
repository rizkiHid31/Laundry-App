import { PickupStatus, DeliveryStatus, OrderStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { getPagination } from '../utils/pagination';

const hasActiveOrder = async (driverId: string): Promise<boolean> => {
  const [activePickup, activeDelivery] = await prisma.$transaction([
    prisma.pickupRequest.count({ where: { driverId, status: PickupStatus.ON_THE_WAY } }),
    prisma.deliveryRequest.count({ where: { driverId, status: DeliveryStatus.ON_THE_WAY } }),
  ]);
  return activePickup > 0 || activeDelivery > 0;
};

// ─── PICKUP ────────────────────────────────────────────────────────────────────

export const getAvailablePickups = async (outletId: string, query: Record<string, unknown>) => {
  const { page, limit, skip } = getPagination(query);
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

  return { pickups, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const acceptPickup = async (driverId: string, pickupId: string) => {
  if (await hasActiveOrder(driverId)) {
    throw Object.assign(new Error('Masih ada order aktif, selesaikan terlebih dahulu'), { status: 400 });
  }

  const pickup = await prisma.pickupRequest.findUnique({ where: { id: pickupId } });
  if (!pickup || pickup.status !== PickupStatus.WAITING_DRIVER || pickup.driverId) {
    throw Object.assign(new Error('Pickup tidak tersedia'), { status: 400 });
  }

  return prisma.pickupRequest.update({
    where: { id: pickupId },
    data: { driverId, status: PickupStatus.ON_THE_WAY, pickedUpAt: new Date() },
  });
};

export const arriveAtOutlet = async (driverId: string, pickupId: string) => {
  const pickup = await prisma.pickupRequest.findUnique({ where: { id: pickupId } });
  if (!pickup || pickup.driverId !== driverId || pickup.status !== PickupStatus.ON_THE_WAY) {
    throw Object.assign(new Error('Pickup tidak valid'), { status: 400 });
  }

  return prisma.pickupRequest.update({
    where: { id: pickupId },
    data: { status: PickupStatus.ARRIVED_AT_OUTLET, arrivedAtOutlet: new Date() },
  });
};

export const getActivePickup = async (driverId: string) => {
  return prisma.pickupRequest.findFirst({
    where: { driverId, status: PickupStatus.ON_THE_WAY },
    include: {
      customer: { select: { name: true } },
      address: { select: { label: true, fullAddress: true, latitude: true, longitude: true } },
    },
  });
};

export const getPickupHistory = async (driverId: string, query: Record<string, unknown>) => {
  const { page, limit, skip } = getPagination(query);
  const where = { driverId, status: PickupStatus.ARRIVED_AT_OUTLET };

  const [pickups, total] = await prisma.$transaction([
    prisma.pickupRequest.findMany({
      where,
      include: {
        customer: { select: { name: true } },
        address: { select: { label: true, fullAddress: true } },
      },
      orderBy: { arrivedAtOutlet: 'desc' },
      skip,
      take: limit,
    }),
    prisma.pickupRequest.count({ where }),
  ]);

  return { pickups, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

// ─── DELIVERY ──────────────────────────────────────────────────────────────────

export const getAvailableDeliveries = async (outletId: string, query: Record<string, unknown>) => {
  const { page, limit, skip } = getPagination(query);
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

  return { deliveries, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const acceptDelivery = async (driverId: string, deliveryId: string) => {
  if (await hasActiveOrder(driverId)) {
    throw Object.assign(new Error('Masih ada order aktif, selesaikan terlebih dahulu'), { status: 400 });
  }

  const delivery = await prisma.deliveryRequest.findUnique({ where: { id: deliveryId } });
  if (!delivery || delivery.status !== DeliveryStatus.WAITING_DRIVER || delivery.driverId) {
    throw Object.assign(new Error('Delivery tidak tersedia'), { status: 400 });
  }

  return prisma.deliveryRequest.update({
    where: { id: deliveryId },
    data: { driverId, status: DeliveryStatus.ON_THE_WAY, pickedUpAt: new Date() },
  });
};

export const completeDelivery = async (driverId: string, deliveryId: string) => {
  const delivery = await prisma.deliveryRequest.findUnique({ where: { id: deliveryId } });
  if (!delivery || delivery.driverId !== driverId || delivery.status !== DeliveryStatus.ON_THE_WAY) {
    throw Object.assign(new Error('Delivery tidak valid'), { status: 400 });
  }

  await prisma.$transaction([
    prisma.deliveryRequest.update({
      where: { id: deliveryId },
      data: { status: DeliveryStatus.DELIVERED, deliveredAt: new Date() },
    }),
    prisma.order.update({
      where: { id: delivery.orderId },
      data: { status: OrderStatus.DELIVERED },
    }),
  ]);
};

export const getActiveDelivery = async (driverId: string) => {
  return prisma.deliveryRequest.findFirst({
    where: { driverId, status: DeliveryStatus.ON_THE_WAY },
    include: {
      order: { select: { invoiceNumber: true, totalPrice: true } },
      address: { select: { label: true, fullAddress: true, latitude: true, longitude: true } },
    },
  });
};

export const getDeliveryHistory = async (driverId: string, query: Record<string, unknown>) => {
  const { page, limit, skip } = getPagination(query);
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

  return { deliveries, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};
