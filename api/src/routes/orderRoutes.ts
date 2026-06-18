import express from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import {
  createOrder,
  listMyOrders,
  getOrder,
  listOutletOrders,
  confirmOrder,
  listWorkerOrders,
  processStation,
  requestBypass,
  approveBypass,
  listBypass,
} from '../controllers/orderController';

const router = express.Router();

router.use(authMiddleware);

router.get('/my', requireRole('CUSTOMER'), listMyOrders as any);
router.post('/create', requireRole('OUTLET_ADMIN'), createOrder as any);
router.get('/outlet/list', requireRole('OUTLET_ADMIN'), listOutletOrders as any);
router.get('/worker/list', requireRole('WORKER'), listWorkerOrders as any);
router.post('/worker/process', requireRole('WORKER'), processStation as any);
router.post('/worker/bypass', requireRole('WORKER'), requestBypass as any);
router.get('/bypass/pending', requireRole('OUTLET_ADMIN'), listBypass as any);
router.post('/bypass/:id/approve', requireRole('OUTLET_ADMIN'), approveBypass as any);
router.post('/:id/confirm', requireRole('CUSTOMER'), confirmOrder as any);
router.get('/:id', getOrder as any);

export default router;
