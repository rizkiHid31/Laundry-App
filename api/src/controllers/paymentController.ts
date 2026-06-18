import { Request, Response } from 'express';
import { paymentService } from '../services/paymentService';
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

export const createPayment = handle(async (req, res) => {
  const userId = (req as AuthRequest).user!.userId;
  const { orderId, method } = req.body;
  const data = await paymentService.createPayment(userId, orderId, method);
  createdResponse(res, 'Pembayaran dibuat', data);
});

export const confirmPayment = handle(async (req, res) => {
  const userId = (req as AuthRequest).user!.userId;
  const data = await paymentService.confirmPayment(userId, req.params.id!);
  okResponse(res, 'Pembayaran berhasil', data);
});
