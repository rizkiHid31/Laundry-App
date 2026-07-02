import dotenv from "dotenv";
dotenv.config();

import express, { Application } from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import attendanceRoutes from "./routes/attendanceRoutes";
import driverRoutes from "./routes/driverRoutes";
import workerRoutes from "./routes/workerRoutes";
import customerRoutes from "./routes/customerRoutes";
import addressRoutes from "./routes/addressRoutes";
import adminRoutes from "./routes/adminRoutes";
import superAdminRoutes from "./routes/superAdminRoutes";

const app: Application = express();

app.disable("x-powered-by");

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
  "http://localhost:5173",
  "http://localhost:5174",
]
  .filter(Boolean)
  .flatMap((value) => value!.split(",").map((entry) => entry.trim()).filter(Boolean));

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS origin denied: ${origin}`));
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/super-admin", superAdminRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "API is running" });
});

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("Error:", err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  },
);

const PORT = Number(process.env.PORT) || 3000;

const startServer = () => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
};

if (process.env.NODE_ENV !== "test") {
  startServer();
}

export { app, startServer };
export default app;
