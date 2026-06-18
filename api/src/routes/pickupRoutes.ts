import express from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import {
  createPickup,
  listMyPickups,
  listDriverPickups,
  acceptPickup,
  markPickedUp,
  markArrived,
  listDeliveries,
  acceptDelivery,
  completeDelivery,
} from '../controllers/pickupController';

const router = express.Router();

router.use(authMiddleware);

router.post('/', requireRole('CUSTOMER'), createPickup as any);
router.get('/my', requireRole('CUSTOMER'), listMyPickups as any);
router.get('/driver', requireRole('DRIVER'), listDriverPickups as any);
router.post('/:id/accept', requireRole('DRIVER'), acceptPickup as any);
router.post('/:id/picked-up', requireRole('DRIVER'), markPickedUp as any);
router.post('/:id/arrived', requireRole('DRIVER'), markArrived as any);
router.get('/deliveries', requireRole('DRIVER'), listDeliveries as any);
router.post('/deliveries/:id/accept', requireRole('DRIVER'), acceptDelivery as any);
router.post('/deliveries/:id/complete', requireRole('DRIVER'), completeDelivery as any);

export default router;
