import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { getCustomerOrders, getCustomerOrderById, getLaundryItems, createCustomerOrder } from '../controllers/customerController';

const router = express.Router();

router.get('/orders', authMiddleware, getCustomerOrders as any);
router.get('/orders/:orderId', authMiddleware, getCustomerOrderById as any);
router.post('/orders', authMiddleware, createCustomerOrder as any);
router.get('/items', authMiddleware, getLaundryItems as any);

export default router;
