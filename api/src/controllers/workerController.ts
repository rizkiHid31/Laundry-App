import { Response } from 'express';
import { StationName } from '@prisma/client';
import { EmployeeRequest } from '../middleware/employeeGuard';
import * as workerService from '../services/workerService';
import * as bypassService from '../services/bypassService';

export const getMyOrders = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { id: workerId, outletId } = req.employee!;
    const station = req.query['station'] as StationName | undefined;
    const result = await workerService.getMyOrders(outletId, req.query as Record<string, unknown>, workerId, station);
    res.json({ success: true, data: result.stations, meta: result.meta });
  } catch (error) {
    console.error('getMyOrders error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data' });
  }
};

export const startStation = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { id: workerId } = req.employee!;
    const { stationId } = req.params as { stationId: string };
    const updated = await workerService.startStation(workerId, stationId);
    res.json({ success: true, message: 'Mulai mengerjakan', data: updated });
  } catch (error: any) {
    console.error('startStation error:', error);
    res.status(error?.status ?? 500).json({ success: false, message: error.message ?? 'Gagal memulai station' });
  }
};

export const completeStation = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { id: workerId } = req.employee!;
    const { stationId } = req.params as { stationId: string };
    const { items } = req.body as { items: { laundryItemId: string; quantityInput: number }[] };
    await workerService.completeStation(workerId, stationId, items);
    res.json({ success: true, message: 'Station selesai' });
  } catch (error: any) {
    console.error('completeStation error:', error);
    const status = error?.status ?? 500;
    const payload: Record<string, unknown> = { success: false, message: error.message ?? 'Gagal menyelesaikan station' };
    if (error?.mismatches) payload['mismatches'] = error.mismatches;
    res.status(status).json(payload);
  }
};

export const requestBypass = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { stationId } = req.params as { stationId: string };
    const { reason, items } = req.body as { reason: string; items: { laundryItemId: string; quantityInput: number }[] };
    const bypass = await bypassService.requestBypass(stationId, reason, items);
    res.status(201).json({ success: true, message: 'Bypass request dikirim', data: bypass });
  } catch (error: any) {
    console.error('requestBypass error:', error);
    res.status(error?.status ?? 500).json({ success: false, message: error.message ?? 'Gagal membuat bypass request' });
  }
};

export const getPendingBypasses = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { outletId } = req.employee!;
    const result = await bypassService.getPendingBypasses(outletId, req.query as Record<string, unknown>);
    res.json({ success: true, data: result.bypasses, meta: result.meta });
  } catch (error) {
    console.error('getPendingBypasses error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data bypass' });
  }
};

export const approveBypass = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { id: adminId } = req.employee!;
    const { bypassId } = req.params as { bypassId: string };
    const { adminNote } = req.body as { adminNote: string };
    await bypassService.approveBypass(adminId, bypassId, adminNote);
    res.json({ success: true, message: 'Bypass disetujui' });
  } catch (error: any) {
    console.error('approveBypass error:', error);
    res.status(error?.status ?? 500).json({ success: false, message: error.message ?? 'Gagal menyetujui bypass' });
  }
};

export const rejectBypass = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { id: adminId } = req.employee!;
    const { bypassId } = req.params as { bypassId: string };
    const { adminNote } = req.body as { adminNote: string };
    await bypassService.rejectBypass(adminId, bypassId, adminNote);
    res.json({ success: true, message: 'Bypass ditolak' });
  } catch (error: any) {
    console.error('rejectBypass error:', error);
    res.status(error?.status ?? 500).json({ success: false, message: error.message ?? 'Gagal menolak bypass' });
  }
};

export const getOrdersWaitingPayment = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { outletId } = req.employee!;
    const result = await workerService.getOrdersWaitingPayment(outletId, req.query as Record<string, unknown>);
    res.json({ success: true, data: result.orders, meta: result.meta });
  } catch (error) {
    console.error('getOrdersWaitingPayment error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data' });
  }
};

export const retryPaymentGate = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { outletId } = req.employee!;
    const { orderId } = req.params as { orderId: string };
    await workerService.retryPaymentGate(outletId, orderId);
    res.json({ success: true, message: 'Order dilanjutkan ke pengiriman' });
  } catch (error: any) {
    console.error('retryPaymentGate error:', error);
    res.status(error?.status ?? 500).json({ success: false, message: error.message ?? 'Gagal memproses order' });
  }
};

export const getWorkerHistory = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { id: workerId } = req.employee!;
    const result = await workerService.getWorkerHistory(workerId, req.query as Record<string, unknown>);
    res.json({ success: true, data: result.stations, meta: result.meta });
  } catch (error) {
    console.error('getWorkerHistory error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil history' });
  }
};
