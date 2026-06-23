import { Response } from 'express';
import { EmployeeRequest } from '../middleware/employeeGuard';
import * as attendanceService from '../services/attendanceService';

export const clockIn = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { id: employeeId } = req.employee!;
    const shift = await attendanceService.clockIn(employeeId);
    res.status(201).json({ success: true, message: 'Clock-in berhasil', data: shift });
  } catch (error: any) {
    console.error('clockIn error:', error);
    res.status(error?.status ?? 500).json({ success: false, message: error.message ?? 'Gagal clock-in' });
  }
};

export const clockOut = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { id: employeeId } = req.employee!;
    const shift = await attendanceService.clockOut(employeeId);
    res.json({ success: true, message: 'Clock-out berhasil', data: shift });
  } catch (error: any) {
    console.error('clockOut error:', error);
    res.status(error?.status ?? 500).json({ success: false, message: error.message ?? 'Gagal clock-out' });
  }
};

export const getTodayStatus = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { id: employeeId } = req.employee!;
    const shift = await attendanceService.getTodayStatus(employeeId);
    res.json({ success: true, data: shift });
  } catch (error) {
    console.error('getTodayStatus error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil status' });
  }
};

export const getMyAttendance = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { id: employeeId } = req.employee!;
    const result = await attendanceService.getMyAttendance(employeeId, req.query as Record<string, unknown>);
    res.json({ success: true, data: result.shifts, meta: result.meta });
  } catch (error) {
    console.error('getMyAttendance error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data absensi' });
  }
};

export const getAttendanceReport = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { outletId } = req.employee!;
    const result = await attendanceService.getAttendanceReport(outletId, req.query as Record<string, unknown>);
    res.json({ success: true, data: result.shifts, meta: result.meta });
  } catch (error) {
    console.error('getAttendanceReport error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil laporan absensi' });
  }
};
