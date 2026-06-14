import express from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { getAvailableOrders, getStationDetail, getJobHistory } from '../controllers/workerController.js';
import { startStation, submitStationItems, completeStation, requestBypass } from '../controllers/stationController.js';

const router = express.Router();

router.use(authMiddleware as any, requireRole('WORKER') as any);

router.get('/orders', getAvailableOrders as any);
router.get('/history', getJobHistory as any);
router.get('/stations/:stationId', getStationDetail as any);
router.post('/stations/:stationId/start', startStation as any);
router.post('/stations/:stationId/items', submitStationItems as any);
router.post('/stations/:stationId/complete', completeStation as any);
router.post('/stations/:stationId/bypass', requestBypass as any);

export default router;
