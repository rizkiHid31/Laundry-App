import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { getOutletMetrics, getOutletOrders, getOutletEmployees } from '../controllers/adminController';

const router = express.Router();

router.get('/metrics', authMiddleware, getOutletMetrics as any);
router.get('/orders', authMiddleware, getOutletOrders as any);
router.get('/employees', authMiddleware, getOutletEmployees as any);

export default router;
