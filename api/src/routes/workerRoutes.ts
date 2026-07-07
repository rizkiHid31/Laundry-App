import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { employeeGuard, requireEmployeeRole } from '../middleware/employeeGuard';
import { requireActiveShift } from '../middleware/shiftGuard';
import {
  getMyOrders,
  startStation,
  completeStation,
  requestBypass,
  approveBypass,
  rejectBypass,
  getOrdersWaitingPayment,
  retryPaymentGate,
  getWorkerHistory,
} from '../controllers/workerController';

const router = Router();

router.use(authMiddleware as any);
router.use(employeeGuard as any);

// Worker routes
router.get('/orders', requireEmployeeRole('worker') as any, getMyOrders as any);
router.post(
  '/orders/:stationId/start',
  requireEmployeeRole('worker') as any,
  requireActiveShift as any,
  startStation as any,
);
router.post(
  '/orders/:stationId/complete',
  requireEmployeeRole('worker') as any,
  requireActiveShift as any,
  completeStation as any,
);
router.post(
  '/orders/:stationId/bypass',
  requireEmployeeRole('worker') as any,
  requireActiveShift as any,
  requestBypass as any,
);
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
router.get(
  '/orders/waiting-payment',
  requireEmployeeRole('outlet_admin', 'super_admin') as any,
  getOrdersWaitingPayment as any,
);
router.post(
  '/orders/:orderId/retry-payment',
  requireEmployeeRole('outlet_admin', 'super_admin') as any,
  retryPaymentGate as any,
);

export default router;
