import { prisma } from '../lib/prisma.js';

export const getActiveEmployee = (userId: string) =>
  prisma.outletEmployee.findFirst({ where: { userId, isActive: true } });

export const getTodayShift = (employeeId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return prisma.shift.findUnique({
    where: { employeeId_shiftDate: { employeeId, shiftDate: today } },
  });
};

export const hasActiveShift = async (employeeId: string) => {
  const shift = await getTodayShift(employeeId);
  return shift?.status === 'PRESENT';
};

export const createNotification = (userId: string, type: string, message: string, orderId?: string) =>
  prisma.notification.create({ data: { userId, type, message, orderId: orderId ?? null } });
