import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/roleGuard.js";
import {
  getAvailablePickups,
  getMyPickups,
  acceptPickup,
  arrivedAtOutlet,
  getMyDeliveries,
  startDelivery,
  completeDelivery,
  getHistory,
} from "../controllers/drivers/driver.controller.js";

const router = Router();

router.use(authenticate, requireRole("DRIVER"));

// Pickup
router.get("/pickups/available", getAvailablePickups);
router.get("/pickups/mine", getMyPickups);
router.post("/pickups/:id/accept", acceptPickup);
router.patch("/pickups/:id/arrived", arrivedAtOutlet);

// Delivery
router.get("/deliveries", getMyDeliveries);
router.patch("/deliveries/:id/start", startDelivery);
router.patch("/deliveries/:id/complete", completeDelivery);

// History
router.get("/history", getHistory);

export default router;
