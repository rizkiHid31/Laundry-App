import express from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import { createPayment, confirmPayment } from '../controllers/paymentController';

const router = express.Router();

router.use(authMiddleware, requireRole('CUSTOMER'));
router.post('/', createPayment as any);
router.post('/:id/confirm', confirmPayment as any);

export default router;
