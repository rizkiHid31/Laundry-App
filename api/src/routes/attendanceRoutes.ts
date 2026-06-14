import express from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { checkIn, checkOut, getMyLog, getAttendanceReport } from '../controllers/attendanceController.js';

const router = express.Router();

router.post('/check-in', authMiddleware as any, requireRole('WORKER', 'DRIVER') as any, checkIn as any);
router.post('/check-out', authMiddleware as any, requireRole('WORKER', 'DRIVER') as any, checkOut as any);
router.get('/my-log', authMiddleware as any, requireRole('WORKER', 'DRIVER') as any, getMyLog as any);
router.get('/report', authMiddleware as any, requireRole('OUTLET_ADMIN', 'SUPER_ADMIN') as any, getAttendanceReport as any);

export default router;
