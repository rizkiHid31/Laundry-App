import { Response } from 'express';
import { ShiftStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { EmployeeRequest } from '../middleware/employeeGuard';

const getToday = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const getPagination = (query: Record<string, unknown>) => {
  const page = Math.max(1, parseInt(query['page'] as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query['limit'] as string) || 20));
  return { page, limit, skip: (page - 1) * limit };
};

export const clockIn = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { id: employeeId } = req.employee!;
    const shiftDate = getToday();

    const existing = await prisma.shift.findUnique({
      where: { employeeId_shiftDate: { employeeId, shiftDate } },
    });

    if (existing?.checkIn) {
      res.status(400).json({ success: false, message: 'Sudah clock-in hari ini' });
      return;
    }

    const shift = existing
      ? await prisma.shift.update({
          where: { id: existing.id },
          data: { checkIn: new Date(), status: ShiftStatus.PRESENT },
        })
      : await prisma.shift.create({
          data: { employeeId, shiftDate, checkIn: new Date(), status: ShiftStatus.PRESENT },
        });

    res.status(201).json({ success: true, message: 'Clock-in berhasil', data: shift });
  } catch (error) {
    console.error('clockIn error:', error);
    res.status(500).json({ success: false, message: 'Gagal clock-in' });
  }
};

export const clockOut = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { id: employeeId } = req.employee!;
    const shiftDate = getToday();

    const shift = await prisma.shift.findUnique({
      where: { employeeId_shiftDate: { employeeId, shiftDate } },
    });

    if (!shift?.checkIn) {
      res.status(400).json({ success: false, message: 'Belum clock-in hari ini' });
      return;
    }
    if (shift.checkOut) {
      res.status(400).json({ success: false, message: 'Sudah clock-out hari ini' });
      return;
    }

    const updated = await prisma.shift.update({
      where: { id: shift.id },
      data: { checkOut: new Date(), status: ShiftStatus.COMPLETED },
    });

    res.json({ success: true, message: 'Clock-out berhasil', data: updated });
  } catch (error) {
    console.error('clockOut error:', error);
    res.status(500).json({ success: false, message: 'Gagal clock-out' });
  }
};

export const getTodayStatus = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { id: employeeId } = req.employee!;
    const shift = await prisma.shift.findUnique({
      where: { employeeId_shiftDate: { employeeId, shiftDate: getToday() } },
    });
    res.json({ success: true, data: shift });
  } catch (error) {
    console.error('getTodayStatus error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil status' });
  }
};

export const getMyAttendance = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { id: employeeId } = req.employee!;
    const { page, limit, skip } = getPagination(req.query as Record<string, unknown>);

    const [shifts, total] = await prisma.$transaction([
      prisma.shift.findMany({
        where: { employeeId },
        orderBy: { shiftDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.shift.count({ where: { employeeId } }),
    ]);

    res.json({
      success: true,
      data: shifts,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('getMyAttendance error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data absensi' });
  }
};

export const getAttendanceReport = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { outletId } = req.employee!;
    const { page, limit, skip } = getPagination(req.query as Record<string, unknown>);
    const dateFrom = req.query['dateFrom'] ? new Date(req.query['dateFrom'] as string) : undefined;
    const dateTo = req.query['dateTo'] ? new Date(req.query['dateTo'] as string) : undefined;

    const dateFilter = dateFrom || dateTo
      ? { shiftDate: { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) } }
      : {};

    const where = { employee: { outletId }, ...dateFilter };

    const [shifts, total] = await prisma.$transaction([
      prisma.shift.findMany({
        where,
        include: {
          employee: {
            select: { user: { select: { name: true, email: true } } },
          },
        },
        orderBy: [{ shiftDate: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.shift.count({ where }),
    ]);

    res.json({
      success: true,
      data: shifts,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('getAttendanceReport error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil laporan absensi' });
  }
};
