import express from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import {
  listOutlets,
  listActiveOutlets,
  createOutlet,
  updateOutlet,
  createComplaint,
  listMyComplaints,
  listAllComplaints,
  respondComplaint,
} from '../controllers/adminController';

const router = express.Router();

router.get('/outlets/active', listActiveOutlets as any);

router.use(authMiddleware);

router.get('/outlets', requireRole('SUPER_ADMIN'), listOutlets as any);
router.post('/outlets', requireRole('SUPER_ADMIN'), createOutlet as any);
router.put('/outlets/:id', requireRole('SUPER_ADMIN'), updateOutlet as any);
router.post('/complaints', requireRole('CUSTOMER'), createComplaint as any);
router.get('/complaints/my', requireRole('CUSTOMER'), listMyComplaints as any);
router.get('/complaints', requireRole('SUPER_ADMIN', 'OUTLET_ADMIN'), listAllComplaints as any);
router.put('/complaints/:id', requireRole('SUPER_ADMIN', 'OUTLET_ADMIN'), respondComplaint as any);

export default router;
