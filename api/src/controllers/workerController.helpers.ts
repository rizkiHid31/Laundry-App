import { PrismaClient, StationName, StationStatus, OrderStatus, BypassStatus } from '@prisma/client';

const stationOrderStatus: Record<StationName, OrderStatus> = {
  WASHING: OrderStatus.WASHING,
  IRONING: OrderStatus.IRONING,
  PACKING: OrderStatus.PACKING,
};

const nextStation: Partial<Record<StationName, StationName>> = {
  WASHING: StationName.IRONING,
  IRONING: StationName.PACKING,
};

export const getPagination = (query: Record<string, unknown>) => {
  const page = Math.max(1, parseInt(query['page'] as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query['limit'] as string) || 10));
  return { page, limit, skip: (page - 1) * limit };
};

export const getStationOrderStatus = (station: StationName) => stationOrderStatus[station];
export const getNextStation = (station: StationName) => nextStation[station];

export const finalizeStation = async (tx: PrismaClient, stationId: string, status: StationStatus, completedAt?: Date) => {
  const data = completedAt ? { status, completedAt } : { status };
  return tx.orderStation.update({ where: { id: stationId }, data });
};

export const advanceOrderAfterStation = async (tx: PrismaClient, orderId: string, station: StationName) => {
  const next = getNextStation(station);
  if (!next) return;

  await tx.order.update({ where: { id: orderId }, data: { status: getStationOrderStatus(next) } });
  await tx.orderStation.update({
    where: { orderId_station: { orderId, station: next } },
    data: { status: StationStatus.PENDING },
  });
};

export const markOrderReadyOrWaiting = async (tx: PrismaClient, orderId: string, isPaid: boolean) => {
  const status = isPaid ? OrderStatus.READY_TO_DELIVER : OrderStatus.WAITING_PAYMENT;
  await tx.order.update({ where: { id: orderId }, data: { status } });
};
