import { Router } from "express";
import attendanceRoutes from "./attendanceRoutes.js";
import driverRoutes from "./driverRoutes.js";
import workerRoutes from "./workerRoutes.js";

const router = Router();

router.use("/attendance", attendanceRoutes);
router.use("/driver", driverRoutes);
router.use("/worker", workerRoutes);

export default router;
