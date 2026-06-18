import express from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../controllers/addressController';

const router = express.Router();

router.use(authMiddleware);
router.get('/', listAddresses as any);
router.post('/', createAddress as any);
router.put('/:id', updateAddress as any);
router.delete('/:id', deleteAddress as any);
router.patch('/:id/default', setDefaultAddress as any);

export default router;
