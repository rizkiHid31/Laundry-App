import { Prisma, PickupStatus, DeliveryStatus, OrderStatus } from '@prisma/client';
import { prisma, runSerializable } from '../lib/prisma';
import { getPagination, buildMeta } from '../utils/pagination';

const hasActiveOrder = async (tx: Prisma.TransactionClient, driverId: string): Promise<boolean> => {
  const [activePickup, activeDelivery] = await Promise.all([
    tx.pickupRequest.count({ where: { driverId, status: PickupStatus.ON_THE_WAY } }),
    tx.deliveryRequest.count({ where: { driverId, status: DeliveryStatus.ON_THE_WAY } }),
  ]);
  return activePickup > 0 || activeDelivery > 0;
};

const ensureNoActiveOrder = async (tx: Prisma.TransactionClient, driverId: string) => {
  if (await hasActiveOrder(tx, driverId)) {
    throw Object.assign(new Error('Masih ada order aktif, selesaikan terlebih dahulu'), { status: 400 });
  }
};

// ─── PICKUP ────────────────────────────────────────────────────────────────────

const pickupListInclude = {
  customer: { select: { name: true } },
  address: { select: { label: true, fullAddress: true, latitude: true, longitude: true } },
};

const pickupHistoryInclude = {
  customer: { select: { name: true } },
  address: { select: { label: true, fullAddress: true } },
};

export const getAvailablePickups = async (outletId: string, query: Record<string, unknown>) => {
  const { page, limit, skip } = getPagination(query);
  const where = { outletId, status: PickupStatus.WAITING_DRIVER, driverId: null };

  const [pickups, total] = await prisma.$transaction([
    prisma.pickupRequest.findMany({
      where, include: pickupListInclude, orderBy: { scheduledAt: 'asc' }, skip, take: limit,
    }),
    prisma.pickupRequest.count({ where }),
  ]);

  return { pickups, meta: buildMeta(page, limit, total) };
};

export const acceptPickup = async (driverId: string, pickupId: string) => {
  return runSerializable(async (tx) => {
    await ensureNoActiveOrder(tx, driverId);

    const pickup = await tx.pickupRequest.findUnique({ where: { id: pickupId } });
    if (!pickup || pickup.status !== PickupStatus.WAITING_DRIVER || pickup.driverId) {
      throw Object.assign(new Error('Pickup tidak tersedia'), { status: 400 });
    }

    return tx.pickupRequest.update({
      where: { id: pickupId },
      data: { driverId, status: PickupStatus.ON_THE_WAY, pickedUpAt: new Date() },
    });
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
    include: pickupListInclude,
  });
};

export const getPickupHistory = async (driverId: string, query: Record<string, unknown>) => {
  const { page, limit, skip } = getPagination(query);
  const where = { driverId, status: PickupStatus.ARRIVED_AT_OUTLET };

  const [pickups, total] = await prisma.$transaction([
    prisma.pickupRequest.findMany({
      where, include: pickupHistoryInclude, orderBy: { arrivedAtOutlet: 'desc' }, skip, take: limit,
    }),
    prisma.pickupRequest.count({ where }),
  ]);

  return { pickups, meta: buildMeta(page, limit, total) };
};

// ─── DELIVERY ──────────────────────────────────────────────────────────────────

const deliveryListInclude = {
  order: { select: { invoiceNumber: true, totalPrice: true } },
  address: { select: { label: true, fullAddress: true, latitude: true, longitude: true } },
};

const deliveryHistoryInclude = {
  order: { select: { invoiceNumber: true, totalPrice: true } },
  address: { select: { label: true, fullAddress: true } },
};

export const getAvailableDeliveries = async (outletId: string, query: Record<string, unknown>) => {
  const { page, limit, skip } = getPagination(query);
  const where = { outletId, status: DeliveryStatus.WAITING_DRIVER, driverId: null };

  const [deliveries, total] = await prisma.$transaction([
    prisma.deliveryRequest.findMany({
      where, include: deliveryListInclude, orderBy: { createdAt: 'asc' }, skip, take: limit,
    }),
    prisma.deliveryRequest.count({ where }),
  ]);

  return { deliveries, meta: buildMeta(page, limit, total) };
};

export const acceptDelivery = async (driverId: string, deliveryId: string) => {
  return runSerializable(async (tx) => {
    await ensureNoActiveOrder(tx, driverId);

    const delivery = await tx.deliveryRequest.findUnique({ where: { id: deliveryId } });
    if (!delivery || delivery.status !== DeliveryStatus.WAITING_DRIVER || delivery.driverId) {
      throw Object.assign(new Error('Delivery tidak tersedia'), { status: 400 });
    }

    return tx.deliveryRequest.update({
      where: { id: deliveryId },
      data: { driverId, status: DeliveryStatus.ON_THE_WAY, pickedUpAt: new Date() },
    });
  });
};

const ensureCanCompleteDelivery = (
  delivery: { driverId: string | null; status: DeliveryStatus } | null,
  driverId: string,
) => {
  if (!delivery || delivery.driverId !== driverId || delivery.status !== DeliveryStatus.ON_THE_WAY) {
    throw Object.assign(new Error('Delivery tidak valid'), { status: 400 });
  }
};

export const completeDelivery = async (driverId: string, deliveryId: string) => {
  const delivery = await prisma.deliveryRequest.findUnique({ where: { id: deliveryId } });
  ensureCanCompleteDelivery(delivery, driverId);

  await prisma.$transaction([
    prisma.deliveryRequest.update({
      where: { id: deliveryId },
      data: { status: DeliveryStatus.DELIVERED, deliveredAt: new Date() },
    }),
    prisma.order.update({ where: { id: delivery!.orderId }, data: { status: OrderStatus.DELIVERED } }),
  ]);
};

export const getActiveDelivery = async (driverId: string) => {
  return prisma.deliveryRequest.findFirst({
    where: { driverId, status: DeliveryStatus.ON_THE_WAY },
    include: deliveryListInclude,
  });
};

export const getDeliveryHistory = async (driverId: string, query: Record<string, unknown>) => {
  const { page, limit, skip } = getPagination(query);
  const where = { driverId, status: DeliveryStatus.DELIVERED };

  const [deliveries, total] = await prisma.$transaction([
    prisma.deliveryRequest.findMany({
      where, include: deliveryHistoryInclude, orderBy: { deliveredAt: 'desc' }, skip, take: limit,
    }),
    prisma.deliveryRequest.count({ where }),
  ]);

  return { deliveries, meta: buildMeta(page, limit, total) };
};
