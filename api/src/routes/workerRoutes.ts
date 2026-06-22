import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { employeeGuard, requireEmployeeRole } from '../middleware/employeeGuard';
import {
  getMyOrders,
  startStation,
  completeStation,
  requestBypass,
  approveBypass,
  rejectBypass,
  getWorkerHistory,
} from '../controllers/workerController';

const router = Router();

router.use(authMiddleware as any);
router.use(employeeGuard as any);

// Worker routes
router.get('/orders', requireEmployeeRole('worker') as any, getMyOrders as any);
router.post('/orders/:stationId/start', requireEmployeeRole('worker') as any, startStation as any);
router.post('/orders/:stationId/complete', requireEmployeeRole('worker') as any, completeStation as any);
router.post('/orders/:stationId/bypass', requireEmployeeRole('worker') as any, requestBypass as any);
router.get('/history', requireEmployeeRole('worker') as any, getWorkerHistory as any);

// Admin bypass approval routes
router.patch(
  '/bypass/:bypassId/approve',
  requireEmployeeRole('outlet_admin', 'super_admin') as any,
  approveBypass as any,
);
router.patch(
  '/bypass/:bypassId/reject',
  requireEmployeeRole('outlet_admin', 'super_admin') as any,
  rejectBypass as any,
);

export default router;
