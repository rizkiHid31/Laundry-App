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

const findActiveEmployee = async (userId: string) => {
  return prisma.outletEmployee.findFirst({
    where: { userId, isActive: true },
    include: { user: { include: { userRoles: { include: { role: true } } } } },
  });
};

const resolveEmployeeOrRespond = async (req: EmployeeRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return null;
  }
  const employee = await findActiveEmployee(req.user.userId);
  if (!employee) {
    res.status(403).json({ success: false, message: 'Bukan karyawan aktif' });
    return null;
  }
  return employee;
};

type ActiveEmployee = NonNullable<Awaited<ReturnType<typeof resolveEmployeeOrRespond>>>;

const toEmployeeContext = (employee: ActiveEmployee) => ({
  id: employee.id,
  outletId: employee.outletId,
  roles: employee.user.userRoles.map((ur) => ur.role.name),
});

export const employeeGuard = async (req: EmployeeRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const employee = await resolveEmployeeOrRespond(req, res);
    if (!employee) return;

    req.employee = toEmployeeContext(employee);
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
