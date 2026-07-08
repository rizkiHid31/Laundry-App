import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { EmployeeRequest } from './employeeGuard';

const getToday = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const isEmployeeOnActiveShift = async (employeeId: string): Promise<boolean> => {
  const shift = await prisma.shift.findUnique({
    where: { employeeId_shiftDate: { employeeId, shiftDate: getToday() } },
  });
  return !!shift?.checkIn && !shift.checkOut;
};

export const requireActiveShift = async (req: EmployeeRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.employee) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const onShift = await isEmployeeOnActiveShift(req.employee.id);
    if (!onShift) {
      res.status(403).json({ success: false, message: 'Anda wajib absen (clock-in) terlebih dahulu sebelum memproses pesanan' });
      return;
    }
    next();
  } catch (error) {
    next(error);
  }
};
