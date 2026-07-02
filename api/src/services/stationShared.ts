import { Prisma, StationStatus, StationName, OrderStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';

export const stationOrderStatus: Record<StationName, OrderStatus> = {
  WASHING: OrderStatus.WASHING,
  IRONING: OrderStatus.IRONING,
  PACKING: OrderStatus.PACKING,
};

const nextStationMap: Partial<Record<StationName, StationName>> = {
  WASHING: StationName.IRONING,
  IRONING: StationName.PACKING,
};

const getToday = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// The station a worker handles is chosen at clock-in (see attendanceService),
// allowing daily rotation instead of a fixed specialization.
export const getTodayStation = async (workerId: string): Promise<StationName | null> => {
  const shift = await prisma.shift.findUnique({
    where: { employeeId_shiftDate: { employeeId: workerId, shiftDate: getToday() } },
  });
  if (!shift?.checkIn || shift.checkOut) return null;
  return shift.station;
};

export type ItemInput = { laundryItemId: string; quantityInput: number };

export const checkMismatch = (inputs: ItemInput[], references: ItemInput[]) => {
  return references.filter((ref) => {
    const found = inputs.find((i) => i.laundryItemId === ref.laundryItemId);
    return !found || found.quantityInput !== ref.quantityInput;
  });
};

const finishPacking = async (tx: Prisma.TransactionClient, orderId: string, pickupRequestId: string, outletId: string, isPaid: boolean) => {
  const newOrderStatus = isPaid ? OrderStatus.READY_TO_DELIVER : OrderStatus.WAITING_PAYMENT;
  await tx.order.update({ where: { id: orderId }, data: { status: newOrderStatus } });
  if (!isPaid) return;

  const pickupReq = await tx.pickupRequest.findUnique({ where: { id: pickupRequestId } });
  if (!pickupReq) return;
  await tx.deliveryRequest.create({
    data: { orderId, outletId, addressId: pickupReq.addressId, status: 'WAITING_DRIVER' },
  });
};

const advanceToNextStation = async (tx: Prisma.TransactionClient, orderId: string, next: StationName) => {
  await tx.order.update({ where: { id: orderId }, data: { status: stationOrderStatus[next] } });
  await tx.orderStation.update({
    where: { orderId_station: { orderId, station: next } },
    data: { status: StationStatus.PENDING },
  });
};

// Shared by completeStation (normal path) and approveBypass (exception path):
// moves the order to the next station, or to its post-packing status.
export const advanceOrderStage = async (tx: Prisma.TransactionClient, orderId: string, pickupRequestId: string, outletId: string, currentStation: StationName, isPaid: boolean) => {
  if (currentStation === StationName.PACKING) {
    await finishPacking(tx, orderId, pickupRequestId, outletId, isPaid);
    return;
  }
  const next = nextStationMap[currentStation];
  if (next) {
    await advanceToNextStation(tx, orderId, next);
  }
};
