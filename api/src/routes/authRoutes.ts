import express from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  register,
  verifyEmailAndSetPassword,
  resendVerificationEmail,
  login,
  requestResetPassword,
  confirmResetPassword,
  getCurrentUser,
  updateProfile,
  updatePassword,
  updateEmail,
  uploadProfilePicture,
} from '../controllers/authController';

const router: express.Router = express.Router();

// Public routes
router.post('/register', register as any);
router.post('/verify-email', verifyEmailAndSetPassword as any);
router.post('/resend-verification', resendVerificationEmail as any);
router.post('/login', login as any);
router.post('/request-reset-password', requestResetPassword as any);
router.post('/confirm-reset-password', confirmResetPassword as any);

// Protected routes
router.get('/me', authMiddleware, getCurrentUser as any);
router.put('/profile', authMiddleware, updateProfile as any);
router.put('/password', authMiddleware, updatePassword as any);
router.put('/email', authMiddleware, updateEmail as any);
router.post('/profile-picture', authMiddleware, uploadProfilePicture as any);

export default router;
