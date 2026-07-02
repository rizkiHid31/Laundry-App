import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export const getOutletMetrics = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const employee = await prisma.outletEmployee.findFirst({ where: { userId: req.user.userId, isActive: true } });
    if (!employee) {
      return res.status(403).json({ success: false, message: 'Only outlet employees can access this endpoint' });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [ordersCount, todayOrdersCount, revenueResult, todayRevenueResult, employeesCount] = await Promise.all([
      prisma.order.count({ where: { outletId: employee.outletId } }),
      prisma.order.count({ where: { outletId: employee.outletId, createdAt: { gte: startOfDay } } }),
      prisma.order.aggregate({
        where: { outletId: employee.outletId, totalPrice: { not: null } },
        _sum: { totalPrice: true },
      }),
      prisma.order.aggregate({
        where: { outletId: employee.outletId, createdAt: { gte: startOfDay }, totalPrice: { not: null } },
        _sum: { totalPrice: true },
      }),
      prisma.outletEmployee.count({ where: { outletId: employee.outletId, isActive: true } }),
    ]);

    const totalRevenue = revenueResult._sum.totalPrice ?? 0;
    const revenueToday = todayRevenueResult._sum.totalPrice ?? 0;
    const activeStations = 3;

    res.json({
      success: true,
      data: {
        totalOrders: ordersCount,
        ordersToday: todayOrdersCount,
        totalRevenue: Number(totalRevenue),
        revenueToday: Number(revenueToday),
        activeStations,
        activeEmployees: employeesCount,
      },
    });
  } catch (error) {
    console.error('getOutletMetrics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch outlet metrics' });
  }
};

export const getOutletOrders = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const employee = await prisma.outletEmployee.findFirst({ where: { userId: req.user.userId, isActive: true } });
    if (!employee) {
      return res.status(403).json({ success: false, message: 'Only outlet employees can access this endpoint' });
    }

    const orders = await prisma.order.findMany({
      where: { outletId: employee.outletId },
      include: { pickupRequest: { include: { customer: true, address: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('getOutletOrders error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch outlet orders' });
  }
};

export const getOutletEmployees = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const employee = await prisma.outletEmployee.findFirst({ where: { userId: req.user.userId, isActive: true } });
    if (!employee) {
      return res.status(403).json({ success: false, message: 'Only outlet employees can access this endpoint' });
    }

    const employees = await prisma.outletEmployee.findMany({
      where: { outletId: employee.outletId, isActive: true },
      include: { user: true },
    });

    res.json({ success: true, data: employees });
  } catch (error) {
    console.error('getOutletEmployees error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch outlet employees' });
  }
};
