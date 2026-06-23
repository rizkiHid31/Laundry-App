import { Response } from 'express';
import { EmployeeRequest } from '../middleware/employeeGuard';
import * as driverService from '../services/driverService';

// ─── PICKUP ────────────────────────────────────────────────────────────────────

export const getAvailablePickups = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { outletId } = req.employee!;
    const result = await driverService.getAvailablePickups(outletId, req.query as Record<string, unknown>);
    res.json({ success: true, data: result.pickups, meta: result.meta });
  } catch (error) {
    console.error('getAvailablePickups error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data' });
  }
};

export const acceptPickup = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { id: driverId } = req.employee!;
    const { id } = req.params as { id: string };
    const updated = await driverService.acceptPickup(driverId, id);
    res.json({ success: true, message: 'Pickup diterima', data: updated });
  } catch (error: any) {
    console.error('acceptPickup error:', error);
    res.status(error?.status ?? 500).json({ success: false, message: error.message ?? 'Gagal menerima pickup' });
  }
};

export const arriveAtOutlet = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { id: driverId } = req.employee!;
    const { id } = req.params as { id: string };
    const updated = await driverService.arriveAtOutlet(driverId, id);
    res.json({ success: true, message: 'Tiba di outlet', data: updated });
  } catch (error: any) {
    console.error('arriveAtOutlet error:', error);
    res.status(error?.status ?? 500).json({ success: false, message: error.message ?? 'Gagal update status' });
  }
};

export const getActivePickup = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { id: driverId } = req.employee!;
    const pickup = await driverService.getActivePickup(driverId);
    res.json({ success: true, data: pickup });
  } catch (error) {
    console.error('getActivePickup error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data' });
  }
};

export const getPickupHistory = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { id: driverId } = req.employee!;
    const result = await driverService.getPickupHistory(driverId, req.query as Record<string, unknown>);
    res.json({ success: true, data: result.pickups, meta: result.meta });
  } catch (error) {
    console.error('getPickupHistory error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil history' });
  }
};

// ─── DELIVERY ──────────────────────────────────────────────────────────────────

export const getAvailableDeliveries = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { outletId } = req.employee!;
    const result = await driverService.getAvailableDeliveries(outletId, req.query as Record<string, unknown>);
    res.json({ success: true, data: result.deliveries, meta: result.meta });
  } catch (error) {
    console.error('getAvailableDeliveries error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data' });
  }
};

export const acceptDelivery = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { id: driverId } = req.employee!;
    const { id } = req.params as { id: string };
    const updated = await driverService.acceptDelivery(driverId, id);
    res.json({ success: true, message: 'Delivery diterima', data: updated });
  } catch (error: any) {
    console.error('acceptDelivery error:', error);
    res.status(error?.status ?? 500).json({ success: false, message: error.message ?? 'Gagal menerima delivery' });
  }
};

export const completeDelivery = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { id: driverId } = req.employee!;
    const { id } = req.params as { id: string };
    await driverService.completeDelivery(driverId, id);
    res.json({ success: true, message: 'Delivery selesai' });
  } catch (error: any) {
    console.error('completeDelivery error:', error);
    res.status(error?.status ?? 500).json({ success: false, message: error.message ?? 'Gagal menyelesaikan delivery' });
  }
};

export const getActiveDelivery = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { id: driverId } = req.employee!;
    const delivery = await driverService.getActiveDelivery(driverId);
    res.json({ success: true, data: delivery });
  } catch (error) {
    console.error('getActiveDelivery error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data' });
  }
};

export const getDeliveryHistory = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { id: driverId } = req.employee!;
    const result = await driverService.getDeliveryHistory(driverId, req.query as Record<string, unknown>);
    res.json({ success: true, data: result.deliveries, meta: result.meta });
  } catch (error) {
    console.error('getDeliveryHistory error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil history' });
  }
};
