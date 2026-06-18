import { Request, Response } from 'express';
import { pickupService } from '../services/pickupService';
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

export const createPickup = handle(async (req, res) => {
  const userId = (req as AuthRequest).user!.userId;
  const data = await pickupService.create(userId, req.body);
  createdResponse(res, 'Request pickup berhasil dibuat', data);
});

export const listMyPickups = handle(async (req, res) => {
  const userId = (req as AuthRequest).user!.userId;
  const data = await pickupService.listForCustomer(userId, req.query as Record<string, string>);
  okResponse(res, 'OK', data);
});

export const listDriverPickups = handle(async (req, res) => {
  const userId = (req as AuthRequest).user!.userId;
  const data = await pickupService.listForDriver(userId);
  okResponse(res, 'OK', data);
});

export const acceptPickup = handle(async (req, res) => {
  const userId = (req as AuthRequest).user!.userId;
  const data = await pickupService.acceptPickup(userId, req.params.id!);
  okResponse(res, 'Pickup diterima', data);
});

export const markPickedUp = handle(async (req, res) => {
  const userId = (req as AuthRequest).user!.userId;
  const data = await pickupService.markPickedUp(userId, req.params.id!);
  okResponse(res, 'Laundry telah diambil', data);
});

export const markArrived = handle(async (req, res) => {
  const userId = (req as AuthRequest).user!.userId;
  const data = await pickupService.markArrivedAtOutlet(userId, req.params.id!);
  okResponse(res, 'Laundry sampai di outlet', data);
});

export const listDeliveries = handle(async (req, res) => {
  const userId = (req as AuthRequest).user!.userId;
  const data = await paymentService.listDeliveries(userId);
  okResponse(res, 'OK', data);
});

export const acceptDelivery = handle(async (req, res) => {
  const userId = (req as AuthRequest).user!.userId;
  const data = await paymentService.acceptDelivery(userId, req.params.id!);
  okResponse(res, 'Delivery diterima', data);
});

export const completeDelivery = handle(async (req, res) => {
  const userId = (req as AuthRequest).user!.userId;
  const data = await paymentService.completeDelivery(userId, req.params.id!);
  okResponse(res, 'Laundry telah dikirim ke customer', data);
});
