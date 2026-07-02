import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { createAddress, listAddresses, updateAddress, deleteAddress } from '../controllers/addressController';

const router = express.Router();

router.get('/', authMiddleware, listAddresses as any);
router.post('/', authMiddleware, createAddress as any);
router.put('/:id', authMiddleware, updateAddress as any);
router.delete('/:id', authMiddleware, deleteAddress as any);

export default router;
