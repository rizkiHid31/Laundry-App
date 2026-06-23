import { ShiftStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { getPagination } from '../utils/pagination';

const getToday = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const clockIn = async (employeeId: string) => {
  const shiftDate = getToday();

  const existing = await prisma.shift.findUnique({
    where: { employeeId_shiftDate: { employeeId, shiftDate } },
  });

  if (existing?.checkIn) {
    throw Object.assign(new Error('Sudah clock-in hari ini'), { status: 400 });
  }

  return existing
    ? prisma.shift.update({
        where: { id: existing.id },
        data: { checkIn: new Date(), status: ShiftStatus.PRESENT },
      })
    : prisma.shift.create({
        data: { employeeId, shiftDate, checkIn: new Date(), status: ShiftStatus.PRESENT },
      });
};

export const clockOut = async (employeeId: string) => {
  const shift = await prisma.shift.findUnique({
    where: { employeeId_shiftDate: { employeeId, shiftDate: getToday() } },
  });

  if (!shift?.checkIn) {
    throw Object.assign(new Error('Belum clock-in hari ini'), { status: 400 });
  }
  if (shift.checkOut) {
    throw Object.assign(new Error('Sudah clock-out hari ini'), { status: 400 });
  }

  return prisma.shift.update({
    where: { id: shift.id },
    data: { checkOut: new Date(), status: ShiftStatus.COMPLETED },
  });
};

export const getTodayStatus = async (employeeId: string) => {
  return prisma.shift.findUnique({
    where: { employeeId_shiftDate: { employeeId, shiftDate: getToday() } },
  });
};

export const getMyAttendance = async (employeeId: string, query: Record<string, unknown>) => {
  const { page, limit, skip } = getPagination(query);

  const [shifts, total] = await prisma.$transaction([
    prisma.shift.findMany({
      where: { employeeId },
      orderBy: { shiftDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.shift.count({ where: { employeeId } }),
  ]);

  return { shifts, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const getAttendanceReport = async (
  outletId: string,
  query: Record<string, unknown>,
) => {
  const { page, limit, skip } = getPagination(query);
  const dateFrom = query['dateFrom'] ? new Date(query['dateFrom'] as string) : undefined;
  const dateTo = query['dateTo'] ? new Date(query['dateTo'] as string) : undefined;

  const where = {
    employee: { outletId },
    ...(dateFrom || dateTo
      ? { shiftDate: { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) } }
      : {}),
  };

  const [shifts, total] = await prisma.$transaction([
    prisma.shift.findMany({
      where,
      include: {
        employee: {
          select: { user: { select: { name: true, email: true } } },
        },
      },
      orderBy: { shiftDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.shift.count({ where }),
  ]);

  return { shifts, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};
