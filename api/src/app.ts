<<<<<<< Updated upstream
import express from "express";
import cors from "cors";
import { config } from "./config/index.js";
import routes from "./routes/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";
=======
import 'dotenv/config';
import express, { Application } from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import attendanceRoutes from "./routes/attendanceRoutes";
import driverRoutes from "./routes/driverRoutes";
import workerRoutes from "./routes/workerRoutes";
>>>>>>> Stashed changes

const app = express();

app.use(cors({ origin: config.webUrl, credentials: true }));
app.use(express.json());

<<<<<<< Updated upstream
app.get("/", (_req, res) => {
  res.json({ message: "Laundry App API is running" });
=======
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/driver", driverRoutes);
app.use("/api/worker", workerRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "API is running" });
>>>>>>> Stashed changes
});

app.use("/api", routes);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
