import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/roleGuard.js";
import {
  clockIn,
  clockOut,
  getMyAttendance,
  getAllAttendance,
} from "../controllers/attendance/attendance.controller.js";

const router = Router();

router.use(authenticate);

router.post("/clock-in", requireRole("WORKER", "DRIVER"), clockIn);
router.post("/clock-out", requireRole("WORKER", "DRIVER"), clockOut);
router.get("/me", requireRole("WORKER", "DRIVER"), getMyAttendance);
router.get("/", requireRole("OUTLET_ADMIN", "SUPER_ADMIN"), getAllAttendance);

export default router;
