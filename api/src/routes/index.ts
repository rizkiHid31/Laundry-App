import { Router } from "express";
import workerRoutes from "./worker.routes.js";
import driverRoutes from "./driver.routes.js";
import attendanceRoutes from "./attendance.routes.js";

const router = Router();

router.use("/workers", workerRoutes);
router.use("/drivers", driverRoutes);
router.use("/attendance", attendanceRoutes);

export default router;
