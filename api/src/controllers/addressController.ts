import { Request, Response } from 'express';
import { addressService } from '../services/addressService';
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

export const listAddresses = handle(async (req, res) => {
  const userId = (req as AuthRequest).user!.userId;
  const data = await addressService.list(userId);
  okResponse(res, 'OK', data);
});

export const createAddress = handle(async (req, res) => {
  const userId = (req as AuthRequest).user!.userId;
  const data = await addressService.create(userId, req.body);
  createdResponse(res, 'Alamat berhasil ditambahkan', data);
});

export const updateAddress = handle(async (req, res) => {
  const userId = (req as AuthRequest).user!.userId;
  const data = await addressService.update(userId, req.params.id!, req.body);
  okResponse(res, 'Alamat berhasil diperbarui', data);
});

export const deleteAddress = handle(async (req, res) => {
  const userId = (req as AuthRequest).user!.userId;
  await addressService.remove(userId, req.params.id!);
  okResponse(res, 'Alamat berhasil dihapus');
});

export const setDefaultAddress = handle(async (req, res) => {
  const userId = (req as AuthRequest).user!.userId;
  const data = await addressService.setDefault(userId, req.params.id!);
  okResponse(res, 'Alamat utama diperbarui', data);
});
