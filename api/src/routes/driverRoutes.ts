import express from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import {
  getAvailablePickups,
  acceptPickup,
  arrivedAtOutlet,
  getAvailableDeliveries,
  acceptDelivery,
  deliveredOrder,
  getDriverHistory,
} from '../controllers/driverController.js';

const router = express.Router();

router.use(authMiddleware as any, requireRole('DRIVER') as any);

router.get('/pickups', getAvailablePickups as any);
router.post('/pickups/:id/accept', acceptPickup as any);
router.patch('/pickups/:id/arrived', arrivedAtOutlet as any);
router.get('/deliveries', getAvailableDeliveries as any);
router.post('/deliveries/:id/accept', acceptDelivery as any);
router.patch('/deliveries/:id/delivered', deliveredOrder as any);
router.get('/history', getDriverHistory as any);

export default router;
