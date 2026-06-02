import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/roleGuard.js";
import {
  getMyOrders,
  getOrderDetail,
  startStation,
  completeStation,
  requestBypass,
} from "../controllers/workers/worker.controller.js";

const router = Router();

router.use(authenticate, requireRole("WORKER"));

router.get("/orders", getMyOrders);
router.get("/orders/:orderId", getOrderDetail);
router.post("/stations/:stationId/start", startStation);
router.post("/stations/:stationId/complete", completeStation);
router.post("/stations/:stationId/bypass", requestBypass);

export default router;
