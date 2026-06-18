import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/authRoutes';
import addressRoutes from './routes/addressRoutes';
import pickupRoutes from './routes/pickupRoutes';
import orderRoutes from './routes/orderRoutes';
import paymentRoutes from './routes/paymentRoutes';
import adminRoutes from './routes/adminRoutes';
import { autoConfirmDeliveredOrders } from './services/orderAutoConfirm';
const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/pickups', pickupRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'API is running' });
});

app.post('/api/cron/auto-confirm', async (_req, res) => {
  const count = await autoConfirmDeliveredOrders();
  res.json({ success: true, confirmed: count });
});

app.use((err: Error & { status?: number }, _req: express.Request, res: express.Response) => {
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
