import { Request, Response } from 'express';
import { outletService } from '../services/outletService';
import { complaintService } from '../services/complaintService';
import { sendErrorResponse } from '../services/authValidation';
import { okResponse, createdResponse } from '../services/responseHelper';

const handle = (fn: (req: Request, res: Response) => Promise<void>) => {
  return async (req: Request, res: Response) => {
    try {
      await fn(req, res);
    } catch (error) {
      sendErrorResponse(res, error);
    }
  };
};

export const listOutlets = handle(async (req, res) => {
  const data = await outletService.list(req.query as Record<string, string>);
  okResponse(res, 'OK', data);
});

export const listActiveOutlets = handle(async (_req, res) => {
  const data = await outletService.getActive();
  okResponse(res, 'OK', data);
});

export const createOutlet = handle(async (req, res) => {
  const data = await outletService.create(req.body);
  createdResponse(res, 'Outlet berhasil dibuat', data);
});

export const updateOutlet = handle(async (req, res) => {
  const data = await outletService.update(req.params.id!, req.body);
  okResponse(res, 'Outlet berhasil diperbarui', data);
});

export const createComplaint = handle(async (req, res) => {
  const userId = (req as import('../middleware/auth').AuthRequest).user!.userId;
  const data = await complaintService.create(userId, req.body);
  createdResponse(res, 'Komplain berhasil dikirim', data);
});

export const listMyComplaints = handle(async (req, res) => {
  const userId = (req as import('../middleware/auth').AuthRequest).user!.userId;
  const data = await complaintService.listForCustomer(
    userId,
    req.query as Record<string, string>
  );
  okResponse(res, 'OK', data);
});

export const listAllComplaints = handle(async (req, res) => {
  const data = await complaintService.listAll(req.query as Record<string, string>);
  okResponse(res, 'OK', data);
});

export const respondComplaint = handle(async (req, res) => {
  const data = await complaintService.respond(req.params.id!, req.body.response);
  okResponse(res, 'Komplain ditanggapi', data);
});
