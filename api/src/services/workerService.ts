import { Prisma, StationStatus, StationName, OrderStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { getPagination, buildMeta } from '../utils/pagination';
import {
  stationOrderStatus,
  getTodayStation,
  checkMismatch,
  advanceOrderStage,
  ItemInput,
} from './stationShared';

const myOrdersInclude = {
  order: {
    include: {
      orderItems: { include: { laundryItem: { select: { name: true, unit: true } } } },
      pickupRequest: { select: { scheduledAt: true, customer: { select: { name: true } } } },
    },
  },
  worker: { select: { user: { select: { name: true } } } },
};

const buildMyOrdersWhere = (outletId: string, myStation: StationName, station?: StationName) => ({
  AND: [
    { station: myStation, order: { outletId, status: stationOrderStatus[myStation] } },
    { status: { in: [StationStatus.PENDING, StationStatus.IN_PROGRESS] as StationStatus[] } },
    ...(station ? [{ station }] : []),
  ],
});

export const getMyOrders = async (outletId: string, query: Record<string, unknown>, workerId: string, station?: StationName) => {
  const { page, limit, skip } = getPagination(query);

  const myStation = await getTodayStation(workerId);
  if (!myStation) {
    return { stations: [], meta: buildMeta(page, limit, 0) };
  }

  const where = buildMyOrdersWhere(outletId, myStation, station);
  const [stations, total] = await prisma.$transaction([
    prisma.orderStation.findMany({ where, include: myOrdersInclude, orderBy: { order: { createdAt: 'asc' } }, skip, take: limit }),
    prisma.orderStation.count({ where }),
  ]);

  return { stations, meta: buildMeta(page, limit, total) };
};

const ensureStationStartable = (
  station: { status: StationStatus; station: StationName; order: { status: OrderStatus } } | null,
) => {
  if (!station || station.status !== StationStatus.PENDING) {
    throw Object.assign(new Error('Station tidak tersedia'), { status: 400 });
  }
  if (station.order.status !== stationOrderStatus[station.station]) {
    throw Object.assign(new Error('Station sebelumnya belum selesai'), { status: 400 });
  }
};

const ensureMatchesShift = (myStation: StationName | null, targetStation: StationName) => {
  if (myStation !== targetStation) {
    throw Object.assign(
      new Error(`Shift Anda hari ini bertugas di station ${myStation ?? '-'}, bukan ${targetStation}`),
      { status: 403 },
    );
  }
};

export const startStation = async (workerId: string, stationId: string) => {
  const station = await prisma.orderStation.findUnique({
    where: { id: stationId },
    include: { order: { select: { status: true } } },
  });
  ensureStationStartable(station);

  const myStation = await getTodayStation(workerId);
  ensureMatchesShift(myStation, station!.station);

  return prisma.orderStation.update({
    where: { id: stationId },
    data: { workerId, status: StationStatus.IN_PROGRESS, startedAt: new Date() },
  });
};

type OrderItemLike = { laundryItemId: string; quantity: number };
type StationWithHistory = {
  station: StationName;
  order: {
    orderItems: OrderItemLike[];
    orderStations: { station: StationName; stationItems: ItemInput[] }[];
  };
};

const getReferenceItems = (station: StationWithHistory): ItemInput[] => {
  if (station.station === StationName.WASHING) {
    return station.order.orderItems.map((i) => ({
      laundryItemId: i.laundryItemId,
      quantityInput: i.quantity,
    }));
  }
  const prevStation = station.station === StationName.IRONING ? StationName.WASHING : StationName.IRONING;
  const prev = station.order.orderStations.find((s) => s.station === prevStation);
  return prev?.stationItems ?? [];
};

const ensureItemsProvided = (items: ItemInput[]) => {
  if (!items || items.length === 0) {
    throw Object.assign(new Error('Item wajib diisi'), { status: 400 });
  }
};

type CompletableStation = { workerId: string | null; status: StationStatus } | null;

const ensureCanCompleteStation = (station: CompletableStation, workerId: string) => {
  if (!station || station.workerId !== workerId || station.status !== StationStatus.IN_PROGRESS) {
    throw Object.assign(new Error('Station tidak valid'), { status: 400 });
  }
};

const ensureItemsMatch = (items: ItemInput[], reference: ItemInput[]) => {
  const mismatches = checkMismatch(items, reference);
  if (mismatches.length > 0) {
    throw Object.assign(
      new Error('Jumlah item tidak sesuai. Buat bypass request untuk melanjutkan.'),
      { status: 400, mismatches },
    );
  }
};

const saveStationItems = async (tx: Prisma.TransactionClient, stationId: string, items: ItemInput[]) => {
  await tx.stationItem.deleteMany({ where: { stationId } });
  await tx.stationItem.createMany({
    data: items.map((i) => ({ stationId, laundryItemId: i.laundryItemId, quantityInput: i.quantityInput })),
  });
};

type CompletionOrderRef = { orderId: string; station: StationName; order: { pickupRequestId: string; outletId: string } };

const persistCompletion = async (
  tx: Prisma.TransactionClient,
  stationId: string,
  items: ItemInput[],
  station: CompletionOrderRef,
  isPaid: boolean,
) => {
  await saveStationItems(tx, stationId, items);
  await tx.orderStation.update({
    where: { id: stationId },
    data: { status: StationStatus.COMPLETED, completedAt: new Date() },
  });
  await advanceOrderStage(tx, station.orderId, station.order.pickupRequestId, station.order.outletId, station.station, isPaid);
};

export const completeStation = async (workerId: string, stationId: string, items: ItemInput[]) => {
  ensureItemsProvided(items);

  const station = await prisma.orderStation.findUnique({
    where: { id: stationId },
    include: {
      order: { include: { orderItems: true, orderStations: { include: { stationItems: true } }, payment: true } },
    },
  });
  ensureCanCompleteStation(station, workerId);
  ensureItemsMatch(items, getReferenceItems(station!));

  const isPaid = station!.order.payment?.status === 'PAID';
  await prisma.$transaction((tx) => persistCompletion(tx, stationId, items, station!, isPaid));
};

const workerHistoryInclude = {
  order: {
    select: {
      invoiceNumber: true,
      pickupRequest: { select: { customer: { select: { name: true } } } },
    },
  },
  stationItems: { include: { laundryItem: { select: { name: true } } } },
};

export const getWorkerHistory = async (workerId: string, query: Record<string, unknown>) => {
  const { page, limit, skip } = getPagination(query);
  const where = { workerId, status: { in: [StationStatus.COMPLETED, StationStatus.BYPASSED] as StationStatus[] } };

  const [stations, total] = await prisma.$transaction([
    prisma.orderStation.findMany({ where, include: workerHistoryInclude, orderBy: { completedAt: 'desc' }, skip, take: limit }),
    prisma.orderStation.count({ where }),
  ]);

  return { stations, meta: buildMeta(page, limit, total) };
};
