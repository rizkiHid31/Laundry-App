import { Response } from 'express';
import { StationStatus } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { getActiveEmployee, hasActiveShift } from '../utils/employee.js';

const paginate = (page: number, limit: number) => ({ skip: (page - 1) * limit, take: limit });

const meta = (page: number, limit: number, total: number) => ({
  page, limit, total, totalPages: Math.ceil(total / limit),
});

export const getAvailableOrders = async (req: AuthRequest, res: Response) => {
  try {
    const employee = await getActiveEmployee(req.user!.userId);
    if (!employee) return res.status(403).json({ success: false, message: 'Not an employee' });
    if (!await hasActiveShift(employee.id)) return res.status(403).json({ success: false, message: 'Check in first' });

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const where = {
      status: 'PENDING' as const,
      OR: [
        { station: 'WASHING' as const, order: { outletId: employee.outletId, status: 'PROCESSING' as const } },
        { station: 'IRONING' as const, order: { outletId: employee.outletId, status: 'IRONING' as const } },
        { station: 'PACKING' as const, order: { outletId: employee.outletId, status: 'PACKING' as const } },
      ],
    };

    const [stations, total] = await Promise.all([
      prisma.orderStation.findMany({
        where,
        include: { order: { select: { invoiceNumber: true, status: true, totalKg: true } } },
        orderBy: { order: { createdAt: 'asc' } },
        ...paginate(page, limit),
      }),
      prisma.orderStation.count({ where }),
    ]);
    return res.json({ success: true, data: stations, meta: meta(page, limit, total) });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};

export const getStationDetail = async (req: AuthRequest, res: Response) => {
  try {
    const employee = await getActiveEmployee(req.user!.userId);
    if (!employee) return res.status(403).json({ success: false, message: 'Not an employee' });

    const station = await prisma.orderStation.findFirst({
      where: { id: req.params['stationId'] as string, order: { outletId: employee.outletId } },
      include: {
        order: { include: { orderItems: { include: { laundryItem: true } } } },
        stationItems: { include: { laundryItem: true } },
        bypassRequests: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!station) return res.status(404).json({ success: false, message: 'Station not found' });
    return res.json({ success: true, data: station });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to fetch station detail' });
  }
};

export const getJobHistory = async (req: AuthRequest, res: Response) => {
  try {
    const employee = await getActiveEmployee(req.user!.userId);
    if (!employee) return res.status(403).json({ success: false, message: 'Not an employee' });

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const { startDate, endDate } = req.query as Record<string, string>;
    const dateFilter = startDate && endDate
      ? { completedAt: { gte: new Date(startDate), lte: new Date(endDate) } }
      : {};
    const statuses: StationStatus[] = [StationStatus.COMPLETED, StationStatus.BYPASSED];
    const where = { workerId: employee.id, status: { in: statuses }, ...dateFilter };

    const [stations, total] = await Promise.all([
      prisma.orderStation.findMany({
        where,
        include: { order: { select: { invoiceNumber: true, status: true } } },
        orderBy: { completedAt: 'desc' },
        ...paginate(page, limit),
      }),
      prisma.orderStation.count({ where }),
    ]);
    return res.json({ success: true, data: stations, meta: meta(page, limit, total) });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to fetch job history' });
  }
};
