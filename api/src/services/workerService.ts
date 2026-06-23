import { StationStatus, StationName, OrderStatus, BypassStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { getPagination } from '../utils/pagination';

const stationOrderStatus: Record<StationName, OrderStatus> = {
  WASHING: OrderStatus.WASHING,
  IRONING: OrderStatus.IRONING,
  PACKING: OrderStatus.PACKING,
};

const nextStation: Partial<Record<StationName, StationName>> = {
  WASHING: StationName.IRONING,
  IRONING: StationName.PACKING,
};

type ItemInput = { laundryItemId: string; quantityInput: number };

const checkMismatch = (inputs: ItemInput[], references: ItemInput[]) => {
  return references.filter((ref) => {
    const found = inputs.find((i) => i.laundryItemId === ref.laundryItemId);
    return !found || found.quantityInput !== ref.quantityInput;
  });
};

export const getMyOrders = async (
  outletId: string,
  query: Record<string, unknown>,
  station?: StationName,
) => {
  const { page, limit, skip } = getPagination(query);

  const where = {
    order: { outletId },
    status: { in: [StationStatus.PENDING, StationStatus.IN_PROGRESS] as StationStatus[] },
    ...(station ? { station } : {}),
  };

  const [stations, total] = await prisma.$transaction([
    prisma.orderStation.findMany({
      where,
      include: {
        order: {
          include: {
            orderItems: { include: { laundryItem: { select: { name: true, unit: true } } } },
            pickupRequest: { select: { scheduledAt: true, customer: { select: { name: true } } } },
          },
        },
        worker: { select: { user: { select: { name: true } } } },
      },
      orderBy: { order: { createdAt: 'asc' } },
      skip,
      take: limit,
    }),
    prisma.orderStation.count({ where }),
  ]);

  return { stations, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const startStation = async (workerId: string, stationId: string) => {
  const station = await prisma.orderStation.findUnique({ where: { id: stationId } });
  if (!station || station.status !== StationStatus.PENDING) {
    throw Object.assign(new Error('Station tidak tersedia'), { status: 400 });
  }

  return prisma.orderStation.update({
    where: { id: stationId },
    data: { workerId, status: StationStatus.IN_PROGRESS, startedAt: new Date() },
  });
};

export const completeStation = async (
  workerId: string,
  stationId: string,
  items: ItemInput[],
) => {
  if (!items || items.length === 0) {
    throw Object.assign(new Error('Item wajib diisi'), { status: 400 });
  }

  const station = await prisma.orderStation.findUnique({
    where: { id: stationId },
    include: {
      order: {
        include: {
          orderItems: true,
          orderStations: { include: { stationItems: true } },
          payment: true,
        },
      },
    },
  });

  if (!station || station.workerId !== workerId || station.status !== StationStatus.IN_PROGRESS) {
    throw Object.assign(new Error('Station tidak valid'), { status: 400 });
  }

  // Tentukan referensi item dari station sebelumnya
  let referenceItems: ItemInput[];
  if (station.station === StationName.WASHING) {
    referenceItems = station.order.orderItems.map((i) => ({
      laundryItemId: i.laundryItemId,
      quantityInput: i.quantity,
    }));
  } else {
    const prevStation = station.station === StationName.IRONING ? StationName.WASHING : StationName.IRONING;
    const prev = station.order.orderStations.find((s) => s.station === prevStation);
    referenceItems = (prev?.stationItems ?? []).map((i) => ({
      laundryItemId: i.laundryItemId,
      quantityInput: i.quantityInput,
    }));
  }

  const mismatches = checkMismatch(items, referenceItems);
  if (mismatches.length > 0) {
    throw Object.assign(
      new Error('Jumlah item tidak sesuai. Buat bypass request untuk melanjutkan.'),
      { status: 400, mismatches },
    );
  }

  const isPaid = station.order.payment?.status === 'PAID';
  const next = nextStation[station.station];

  await prisma.$transaction(async (tx) => {
    await tx.stationItem.deleteMany({ where: { stationId } });
    await tx.stationItem.createMany({
      data: items.map((i) => ({
        stationId,
        laundryItemId: i.laundryItemId,
        quantityInput: i.quantityInput,
      })),
    });

    await tx.orderStation.update({
      where: { id: stationId },
      data: { status: StationStatus.COMPLETED, completedAt: new Date() },
    });

    if (station.station === StationName.PACKING) {
      const newOrderStatus = isPaid ? OrderStatus.READY_TO_DELIVER : OrderStatus.WAITING_PAYMENT;
      await tx.order.update({ where: { id: station.orderId }, data: { status: newOrderStatus } });

      if (isPaid) {
        const pickupReq = await tx.pickupRequest.findUnique({
          where: { id: station.order.pickupRequestId },
        });
        if (pickupReq) {
          await tx.deliveryRequest.create({
            data: {
              orderId: station.orderId,
              outletId: station.order.outletId,
              addressId: pickupReq.addressId,
              status: 'WAITING_DRIVER',
            },
          });
        }
      }
    } else if (next) {
      await tx.order.update({
        where: { id: station.orderId },
        data: { status: stationOrderStatus[next] },
      });
      await tx.orderStation.update({
        where: { orderId_station: { orderId: station.orderId, station: next } },
        data: { status: StationStatus.PENDING },
      });
    }
  });
};

export const requestBypass = async (stationId: string, reason: string) => {
  if (!reason || reason.trim().length < 10) {
    throw Object.assign(new Error('Alasan minimal 10 karakter'), { status: 400 });
  }

  const station = await prisma.orderStation.findUnique({ where: { id: stationId } });
  if (!station || station.status !== StationStatus.IN_PROGRESS) {
    throw Object.assign(new Error('Station tidak valid'), { status: 400 });
  }

  const existing = await prisma.bypassRequest.findFirst({
    where: { stationId, status: BypassStatus.PENDING },
  });
  if (existing) {
    throw Object.assign(
      new Error('Sudah ada bypass request yang menunggu persetujuan'),
      { status: 400 },
    );
  }

  return prisma.bypassRequest.create({
    data: { stationId, reason: reason.trim() },
  });
};

export const approveBypass = async (adminId: string, bypassId: string, adminNote?: string) => {
  const bypass = await prisma.bypassRequest.findUnique({
    where: { id: bypassId },
    include: { station: { include: { order: { include: { payment: true } } } } },
  });

  if (!bypass || bypass.status !== BypassStatus.PENDING) {
    throw Object.assign(new Error('Bypass request tidak ditemukan'), { status: 404 });
  }

  const isPaid = bypass.station.order.payment?.status === 'PAID';
  const next = nextStation[bypass.station.station];

  await prisma.$transaction(async (tx) => {
    await tx.bypassRequest.update({
      where: { id: bypassId },
      data: { status: BypassStatus.APPROVED, adminId, adminNote: adminNote ?? null, approvedAt: new Date() },
    });

    await tx.orderStation.update({
      where: { id: bypass.stationId },
      data: { status: StationStatus.BYPASSED, completedAt: new Date() },
    });

    if (bypass.station.station === StationName.PACKING) {
      const newOrderStatus = isPaid ? OrderStatus.READY_TO_DELIVER : OrderStatus.WAITING_PAYMENT;
      await tx.order.update({ where: { id: bypass.station.orderId }, data: { status: newOrderStatus } });
    } else if (next) {
      await tx.order.update({
        where: { id: bypass.station.orderId },
        data: { status: stationOrderStatus[next] },
      });
      await tx.orderStation.update({
        where: { orderId_station: { orderId: bypass.station.orderId, station: next } },
        data: { status: StationStatus.PENDING },
      });
    }
  });
};

export const rejectBypass = async (adminId: string, bypassId: string, adminNote: string) => {
  if (!adminNote || adminNote.trim().length < 5) {
    throw Object.assign(new Error('Keterangan penolakan wajib diisi'), { status: 400 });
  }

  const bypass = await prisma.bypassRequest.findUnique({ where: { id: bypassId } });
  if (!bypass || bypass.status !== BypassStatus.PENDING) {
    throw Object.assign(new Error('Bypass request tidak ditemukan'), { status: 404 });
  }

  return prisma.bypassRequest.update({
    where: { id: bypassId },
    data: { status: BypassStatus.REJECTED, adminId, adminNote: adminNote.trim() },
  });
};

export const getWorkerHistory = async (workerId: string, query: Record<string, unknown>) => {
  const { page, limit, skip } = getPagination(query);

  const where = {
    workerId,
    status: { in: [StationStatus.COMPLETED, StationStatus.BYPASSED] as StationStatus[] },
  };

  const [stations, total] = await prisma.$transaction([
    prisma.orderStation.findMany({
      where,
      include: {
        order: {
          select: {
            invoiceNumber: true,
            pickupRequest: { select: { customer: { select: { name: true } } } },
          },
        },
        stationItems: { include: { laundryItem: { select: { name: true } } } },
      },
      orderBy: { completedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.orderStation.count({ where }),
  ]);

  return { stations, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};
