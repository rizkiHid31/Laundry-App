import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { getSuperAdminOverview, getAllOutlets, getAllUsers } from '../controllers/superAdminController';

const router = express.Router();

router.get('/overview', authMiddleware, getSuperAdminOverview as any);
router.get('/outlets', authMiddleware, getAllOutlets as any);
router.get('/users', authMiddleware, getAllUsers as any);

export default router;
