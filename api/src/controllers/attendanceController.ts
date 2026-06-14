import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { getActiveEmployee, getTodayShift } from '../utils/employee.js';

const getToday = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const meta = (page: number, limit: number, total: number) => ({
  page, limit, total, totalPages: Math.ceil(total / limit),
});

export const checkIn = async (req: AuthRequest, res: Response) => {
  try {
    const employee = await getActiveEmployee(req.user!.userId);
    if (!employee) return res.status(403).json({ success: false, message: 'Not an employee' });

    const existing = await getTodayShift(employee.id);
    if (existing?.checkIn) return res.status(400).json({ success: false, message: 'Already checked in today' });

    const data = { checkIn: new Date(), status: 'PRESENT' as const };
    const shift = existing
      ? await prisma.shift.update({ where: { id: existing.id }, data })
      : await prisma.shift.create({ data: { employeeId: employee.id, shiftDate: getToday(), ...data } });

    return res.json({ success: true, data: shift });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to check in' });
  }
};

export const checkOut = async (req: AuthRequest, res: Response) => {
  try {
    const employee = await getActiveEmployee(req.user!.userId);
    if (!employee) return res.status(403).json({ success: false, message: 'Not an employee' });

    const shift = await getTodayShift(employee.id);
    if (!shift?.checkIn) return res.status(400).json({ success: false, message: 'Not checked in today' });
    if (shift.checkOut) return res.status(400).json({ success: false, message: 'Already checked out' });

    const updated = await prisma.shift.update({
      where: { id: shift.id },
      data: { checkOut: new Date(), status: 'COMPLETED' },
    });
    return res.json({ success: true, data: updated });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to check out' });
  }
};

export const getMyLog = async (req: AuthRequest, res: Response) => {
  try {
    const employee = await getActiveEmployee(req.user!.userId);
    if (!employee) return res.status(403).json({ success: false, message: 'Not an employee' });

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [shifts, total] = await Promise.all([
      prisma.shift.findMany({ where: { employeeId: employee.id }, orderBy: { shiftDate: 'desc' }, skip, take: limit }),
      prisma.shift.count({ where: { employeeId: employee.id } }),
    ]);

    return res.json({ success: true, data: shifts, meta: meta(page, limit, total) });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to fetch log' });
  }
};

const buildDateFilter = (startDate?: string, endDate?: string) =>
  startDate && endDate ? { shiftDate: { gte: new Date(startDate), lte: new Date(endDate) } } : {};

const fetchReport = async (empIds: string[], page: number, limit: number, startDate?: string, endDate?: string) => {
  const skip = (page - 1) * limit;
  const where = { employeeId: { in: empIds }, ...buildDateFilter(startDate, endDate) };
  const [shifts, total] = await Promise.all([
    prisma.shift.findMany({
      where,
      include: { employee: { include: { user: { select: { name: true } } } } },
      orderBy: { shiftDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.shift.count({ where }),
  ]);
  return { shifts, total };
};

export const getAttendanceReport = async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '10', startDate, endDate, outletId } = req.query as Record<string, string>;
    const isSuperAdmin = req.user!.role === 'SUPER_ADMIN';
    let targetOutletId = outletId;

    if (!isSuperAdmin) {
      const employee = await getActiveEmployee(req.user!.userId);
      if (!employee) return res.status(403).json({ success: false, message: 'Not an employee' });
      targetOutletId = employee.outletId;
    }

    const employees = await prisma.outletEmployee.findMany({
      where: targetOutletId ? { outletId: targetOutletId } : {},
      select: { id: true },
    });
    const empIds = employees.map((e) => e.id);

    const { shifts, total } = await fetchReport(empIds, Number(page), Number(limit), startDate, endDate);
    return res.json({ success: true, data: shifts, meta: meta(Number(page), Number(limit), total) });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to fetch report' });
  }
};
