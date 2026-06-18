import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { orderService } from '../services/orderService';
import { workerService } from '../services/workerService';
import { sendErrorResponse } from '../services/authValidation';
import { okResponse, createdResponse } from '../services/responseHelper';
import { AuthRequest } from '../middleware/auth';

const handle = (fn: (req: Request, res: Response) => Promise<void>) => {
  return async (req: Request, res: Response) => {
    try {
      await fn(req, res);
    } catch (error) {
      sendErrorResponse(res, error);
    }
  };
};

export const createOrder = handle(async (req, res) => {
  const userId = (req as AuthRequest).user!.userId;
  const data = await orderService.createFromPickup(userId, req.body);
  okResponse(res, 'Order berhasil dibuat', data);
});

export const listMyOrders = handle(async (req, res) => {
  const userId = (req as AuthRequest).user!.userId;
  const data = await orderService.listForCustomer(userId, req.query as Record<string, string>);
  okResponse(res, 'OK', data);
});

export const getOrder = handle(async (req, res) => {
  const auth = (req as AuthRequest).user!;
  const data = await orderService.getById(auth.userId, auth.role, req.params.id!);
  okResponse(res, 'OK', data);
});

export const listOutletOrders = handle(async (req, res) => {
  const auth = (req as AuthRequest).user!;
  const admin = await prisma.user.findUnique({ where: { id: auth.userId } });
  const data = await orderService.listForOutlet(
    admin?.outletId || '',
    req.query as Record<string, string>
  );
  okResponse(res, 'OK', data);
});

export const confirmOrder = handle(async (req, res) => {
  const userId = (req as AuthRequest).user!.userId;
  const data = await orderService.confirmReceived(userId, req.params.id!);
  okResponse(res, 'Order dikonfirmasi diterima', data);
});

const getWorkerType = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user?.workerType || '';
};

export const listWorkerOrders = handle(async (req, res) => {
  const auth = (req as AuthRequest).user!;
  const workerType = await getWorkerType(auth.userId);
  const data = await workerService.listOrders(auth.userId, workerType);
  okResponse(res, 'OK', data);
});

export const processStation = handle(async (req, res) => {
  const auth = (req as AuthRequest).user!;
  const workerType = await getWorkerType(auth.userId);
  const data = await workerService.processStation(auth.userId, workerType, req.body);
  okResponse(res, 'Station selesai diproses', data);
});

export const requestBypass = handle(async (req, res) => {
  const auth = (req as AuthRequest).user!;
  const workerType = await getWorkerType(auth.userId);
  const data = await workerService.requestBypass(auth.userId, workerType, req.body);
  createdResponse(res, 'Bypass request dikirim', data);
});

export const approveBypass = handle(async (req, res) => {
  const userId = (req as AuthRequest).user!.userId;
  const data = await workerService.approveBypass(userId, req.params.id!, req.body);
  okResponse(res, 'Bypass disetujui', data);
});

export const listBypass = handle(async (req, res) => {
  const auth = (req as AuthRequest).user!;
  const admin = await prisma.user.findUnique({ where: { id: auth.userId } });
  const data = await workerService.listPendingBypass(admin?.outletId || '');
  okResponse(res, 'OK', data);
});
