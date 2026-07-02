import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { register, verifyEmailAndSetPassword, resendVerificationEmail } from '../controllers/auth/register';
import { login, getCurrentUser } from '../controllers/auth/session';
import { requestResetPassword, confirmResetPassword, updatePassword } from '../controllers/auth/password';
import { updateProfile, updateEmail, uploadProfilePicture } from '../controllers/auth/profile';
import { redirectToGoogle, handleGoogleCallback } from '../controllers/auth/google';

const router = express.Router();

// Public routes
router.post('/register', register as any);
router.post('/verify-email', verifyEmailAndSetPassword as any);
router.post('/resend-verification', resendVerificationEmail as any);
router.get('/google', redirectToGoogle as any);
router.get('/google/callback', handleGoogleCallback as any);
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
