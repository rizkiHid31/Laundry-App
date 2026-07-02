import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export const getSuperAdminOverview = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userRoles = await prisma.userRole.findMany({ where: { userId: req.user.userId }, include: { role: true } });
    const isSuperAdmin = userRoles.some((entry) => entry.role.name === 'super_admin');
    if (!isSuperAdmin) {
      return res.status(403).json({ success: false, message: 'Only super admins can access this endpoint' });
    }

    const [outletsCount, usersCount, ordersCount] = await Promise.all([
      prisma.outlet.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.order.count(),
    ]);

    res.json({ success: true, data: { outletsCount, usersCount, ordersCount } });
  } catch (error) {
    console.error('getSuperAdminOverview error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch overview' });
  }
};

export const getAllOutlets = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userRoles = await prisma.userRole.findMany({ where: { userId: req.user.userId }, include: { role: true } });
    const isSuperAdmin = userRoles.some((entry) => entry.role.name === 'super_admin');
    if (!isSuperAdmin) {
      return res.status(403).json({ success: false, message: 'Only super admins can access this endpoint' });
    }

    const outlets = await prisma.outlet.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: outlets });
  } catch (error) {
    console.error('getAllOutlets error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch outlets' });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userRoles = await prisma.userRole.findMany({ where: { userId: req.user.userId }, include: { role: true } });
    const isSuperAdmin = userRoles.some((entry) => entry.role.name === 'super_admin');
    if (!isSuperAdmin) {
      return res.status(403).json({ success: false, message: 'Only super admins can access this endpoint' });
    }

    const users = await prisma.user.findMany({
      include: { userRoles: { include: { role: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('getAllUsers error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};
