import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from './auth';

export interface EmployeeRequest extends AuthRequest {
  employee?: {
    id: string;
    outletId: string;
    roles: string[];
  };
}

export const employeeGuard = async (
  req: EmployeeRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const employee = await prisma.outletEmployee.findFirst({
      where: { userId: req.user.userId, isActive: true },
      include: {
        user: {
          include: {
            userRoles: { include: { role: true } },
          },
        },
      },
    });

    if (!employee) {
      res.status(403).json({ success: false, message: 'Bukan karyawan aktif' });
      return;
    }

    req.employee = {
      id: employee.id,
      outletId: employee.outletId,
      roles: employee.user.userRoles.map((ur) => ur.role.name),
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const requireEmployeeRole = (...allowedRoles: string[]) => {
  return (req: EmployeeRequest, res: Response, next: NextFunction): void => {
    if (!req.employee) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const hasRole = allowedRoles.some((r) => req.employee!.roles.includes(r));
    if (!hasRole) {
      res.status(403).json({ success: false, message: 'Akses ditolak' });
      return;
    }
    next();
  };
};
