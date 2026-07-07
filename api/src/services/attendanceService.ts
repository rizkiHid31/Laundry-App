import { Shift, ShiftStatus, StationName } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { getPagination, buildMeta } from '../utils/pagination';

const getToday = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const ensureStationChosen = (roles: string[], station?: StationName) => {
  if (roles.includes('worker') && !station) {
    throw Object.assign(
      new Error('Pilih station kerja (Washing/Ironing/Packing) sebelum clock-in'),
      { status: 400 },
    );
  }
};

const upsertTodayShift = (employeeId: string, shiftDate: Date, existing: Shift | null, station?: StationName) => {
  const data = { checkIn: new Date(), status: ShiftStatus.PRESENT, station: station ?? null };
  return existing
    ? prisma.shift.update({ where: { id: existing.id }, data })
    : prisma.shift.create({ data: { employeeId, shiftDate, ...data } });
};

export const clockIn = async (employeeId: string, roles: string[], station?: StationName) => {
  ensureStationChosen(roles, station);

  const shiftDate = getToday();
  const existing = await prisma.shift.findUnique({
    where: { employeeId_shiftDate: { employeeId, shiftDate } },
  });
  if (existing?.checkIn) {
    throw Object.assign(new Error('Sudah clock-in hari ini'), { status: 400 });
  }

  return upsertTodayShift(employeeId, shiftDate, existing, station);
};

const ensureCanClockOut = (shift: Shift | null) => {
  if (!shift?.checkIn) {
    throw Object.assign(new Error('Belum clock-in hari ini'), { status: 400 });
  }
  if (shift.checkOut) {
    throw Object.assign(new Error('Sudah clock-out hari ini'), { status: 400 });
  }
};

export const clockOut = async (employeeId: string) => {
  const shift = await prisma.shift.findUnique({
    where: { employeeId_shiftDate: { employeeId, shiftDate: getToday() } },
  });
  ensureCanClockOut(shift);

  return prisma.shift.update({
    where: { id: shift!.id },
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
    prisma.shift.findMany({ where: { employeeId }, orderBy: { shiftDate: 'desc' }, skip, take: limit }),
    prisma.shift.count({ where: { employeeId } }),
  ]);

  return { shifts, meta: buildMeta(page, limit, total) };
};

const buildDateRangeFilter = (query: Record<string, unknown>) => {
  const dateFrom = query['dateFrom'] ? new Date(query['dateFrom'] as string) : undefined;
  const dateTo = query['dateTo'] ? new Date(query['dateTo'] as string) : undefined;
  if (!dateFrom && !dateTo) return {};
  return { shiftDate: { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) } };
};

const REPORTABLE_ROLES = ['worker', 'driver'];

const resolveReportRoles = (query: Record<string, unknown>): string[] => {
  const role = query['role'] as string | undefined;
  return role && REPORTABLE_ROLES.includes(role) ? [role] : REPORTABLE_ROLES;
};

export const getAttendanceReport = async (outletId: string, query: Record<string, unknown>) => {
  const { page, limit, skip } = getPagination(query);
  const roles = resolveReportRoles(query);
  const where = {
    employee: {
      outletId,
      user: { userRoles: { some: { outletId, role: { name: { in: roles } } } } },
    },
    ...buildDateRangeFilter(query),
  };

  const [shifts, total] = await prisma.$transaction([
    prisma.shift.findMany({
      where,
      include: {
        employee: {
          select: {
            user: {
              select: {
                name: true,
                email: true,
                userRoles: { where: { outletId }, select: { role: { select: { name: true } } } },
              },
            },
          },
        },
      },
      orderBy: { shiftDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.shift.count({ where }),
  ]);

  return { shifts, meta: buildMeta(page, limit, total) };
};
