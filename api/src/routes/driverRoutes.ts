import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { employeeGuard, requireEmployeeRole } from '../middleware/employeeGuard';
import {
  getAvailablePickups,
  acceptPickup,
  arriveAtOutlet,
  getActivePickup,
  getPickupHistory,
  getAvailableDeliveries,
  acceptDelivery,
  completeDelivery,
  getActiveDelivery,
  getDeliveryHistory,
} from '../controllers/driverController';

const router = Router();

router.use(authMiddleware as any);
router.use(employeeGuard as any);
router.use(requireEmployeeRole('driver') as any);

// Pickup
router.get('/pickups/available', getAvailablePickups as any);
router.get('/pickups/active', getActivePickup as any);
router.get('/pickups/history', getPickupHistory as any);
router.post('/pickups/:id/accept', acceptPickup as any);
router.patch('/pickups/:id/arrive', arriveAtOutlet as any);

// Delivery
router.get('/deliveries/available', getAvailableDeliveries as any);
router.get('/deliveries/active', getActiveDelivery as any);
router.get('/deliveries/history', getDeliveryHistory as any);
router.post('/deliveries/:id/accept', acceptDelivery as any);
router.patch('/deliveries/:id/complete', completeDelivery as any);

export default router;
