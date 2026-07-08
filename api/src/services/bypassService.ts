import { Prisma, StationStatus, BypassStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { getPagination, buildMeta } from '../utils/pagination';
import { advanceOrderStage, ensureItemsProvided, saveStationItems, ItemInput } from './stationShared';

const pendingBypassInclude = {
  station: {
    select: {
      station: true,
      worker: { select: { user: { select: { name: true } } } },
      order: {
        select: {
          invoiceNumber: true,
          orderItems: { include: { laundryItem: { select: { name: true } } } },
        },
      },
    },
  },
};

export const getPendingBypasses = async (outletId: string, query: Record<string, unknown>) => {
  const { page, limit, skip } = getPagination(query);
  const where = { status: BypassStatus.PENDING, station: { order: { outletId } } };

  const [bypasses, total] = await prisma.$transaction([
    prisma.bypassRequest.findMany({
      where, include: pendingBypassInclude, orderBy: { createdAt: 'asc' }, skip, take: limit,
    }),
    prisma.bypassRequest.count({ where }),
  ]);

  return { bypasses, meta: buildMeta(page, limit, total) };
};

const ensureValidAdminNote = (adminNote: string, message: string) => {
  if (!adminNote || adminNote.trim().length < 5) {
    throw Object.assign(new Error(message), { status: 400 });
  }
};

const ensureNoPendingBypass = async (stationId: string) => {
  const existing = await prisma.bypassRequest.findFirst({ where: { stationId, status: BypassStatus.PENDING } });
  if (existing) {
    throw Object.assign(new Error('Sudah ada bypass request yang menunggu persetujuan'), { status: 400 });
  }
};

export const requestBypass = async (stationId: string, reason: string, items: ItemInput[]) => {
  if (!reason || reason.trim().length < 10) {
    throw Object.assign(new Error('Alasan minimal 10 karakter'), { status: 400 });
  }
  ensureItemsProvided(items);

  const station = await prisma.orderStation.findUnique({ where: { id: stationId } });
  if (!station || station.status !== StationStatus.IN_PROGRESS) {
    throw Object.assign(new Error('Station tidak valid'), { status: 400 });
  }
  await ensureNoPendingBypass(stationId);

  return prisma.bypassRequest.create({
    data: { stationId, reason: reason.trim(), reportedItems: items as unknown as Prisma.InputJsonValue },
  });
};

const findPendingBypass = async (bypassId: string) => {
  const bypass = await prisma.bypassRequest.findUnique({
    where: { id: bypassId },
    include: { station: { include: { order: { include: { payment: true } } } } },
  });
  if (!bypass || bypass.status !== BypassStatus.PENDING) {
    throw Object.assign(new Error('Bypass request tidak ditemukan'), { status: 404 });
  }
  return bypass;
};

type PendingBypass = Awaited<ReturnType<typeof findPendingBypass>>;

const persistBypassApproval = async (tx: Prisma.TransactionClient, bypass: PendingBypass, adminId: string, adminNote: string, isPaid: boolean) => {
  await tx.bypassRequest.update({
    where: { id: bypass.id },
    data: { status: BypassStatus.APPROVED, adminId, adminNote: adminNote.trim(), approvedAt: new Date() },
  });
  await saveStationItems(tx, bypass.stationId, bypass.reportedItems as unknown as ItemInput[]);
  await tx.orderStation.update({
    where: { id: bypass.stationId },
    data: { status: StationStatus.BYPASSED, completedAt: new Date() },
  });
  await advanceOrderStage(tx, bypass.station.orderId, bypass.station.order.pickupRequestId, bypass.station.order.outletId, bypass.station.station, isPaid);
};

export const approveBypass = async (adminId: string, bypassId: string, adminNote: string) => {
  ensureValidAdminNote(adminNote, 'Keterangan problem wajib diisi');
  const bypass = await findPendingBypass(bypassId);
  const isPaid = bypass.station.order.payment?.status === 'PAID';

  await prisma.$transaction((tx) => persistBypassApproval(tx, bypass, adminId, adminNote, isPaid));
};

export const rejectBypass = async (adminId: string, bypassId: string, adminNote: string) => {
  ensureValidAdminNote(adminNote, 'Keterangan penolakan wajib diisi');

  const bypass = await prisma.bypassRequest.findUnique({ where: { id: bypassId } });
  if (!bypass || bypass.status !== BypassStatus.PENDING) {
    throw Object.assign(new Error('Bypass request tidak ditemukan'), { status: 404 });
  }

  return prisma.bypassRequest.update({
    where: { id: bypassId },
    data: { status: BypassStatus.REJECTED, adminId, adminNote: adminNote.trim() },
  });
};
