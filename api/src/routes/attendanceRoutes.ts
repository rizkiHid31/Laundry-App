import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { employeeGuard, requireEmployeeRole } from '../middleware/employeeGuard';
import {
  clockIn,
  clockOut,
  getTodayStatus,
  getMyAttendance,
  getAttendanceReport,
} from '../controllers/attendanceController';

const router: Router = Router();

router.use(authMiddleware as any);
router.use(employeeGuard as any);

router.post('/clock-in', clockIn as any);
router.post('/clock-out', clockOut as any);
router.get('/today', getTodayStatus as any);
router.get('/my', getMyAttendance as any);
router.get('/report', requireEmployeeRole('outlet_admin', 'super_admin') as any, getAttendanceReport as any);

export default router;
