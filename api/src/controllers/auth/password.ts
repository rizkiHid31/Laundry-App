import { Response } from 'express';
import { prisma } from '../../lib/prisma';
import { generateResetToken } from '../../utils/jwt';
import { AuthRequest } from '../../middleware/auth';
import {
  getUserByEmail,
  hashUserPassword,
  normalizeEmail,
  requireAuth,
  sanitizePassword,
  sendError,
  sendResetMail,
  sendSuccess,
  verifyPassword,
} from '../authController.helpers';

export const requestResetPassword = async (req: any, res: Response) => {
  try {
    const email = normalizeEmail(typeof req.body?.email === 'string' ? req.body.email : '');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return sendError(res, 400, 'Please provide a valid email address');

    const user = await getUserByEmail(email);
    if (!user) return sendError(res, 400, 'User not found');
    if (!user.passwordHash) return sendError(res, 400, 'This account uses social login. Please use social login to reset password.');

    const resetToken = generateResetToken();
    await prisma.verificationToken.create({ data: { userId: user.id, token: resetToken, type: 'RESET_PASSWORD', expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });
    await sendResetMail(email, user.name || 'User', resetToken);

    return sendSuccess(res, 200, 'Reset password link sent to your email. Please check your email.');
  } catch (error) {
    console.error('Request reset password error:', error);
    return sendError(res, 500, 'Failed to send reset password email');
  }
};

export const confirmResetPassword = async (req: any, res: Response) => {
  try {
    const rawToken = typeof req.body?.token === 'string' ? req.body.token : '';
    const rawPassword = typeof req.body?.password === 'string' ? req.body.password : '';
    const password = sanitizePassword(rawPassword);

    if (!rawToken || !password) return sendError(res, 400, 'Token and password are required');

    const verificationToken = await prisma.verificationToken.findFirst({
      where: { token: rawToken, type: 'RESET_PASSWORD', isUsed: false, expiresAt: { gt: new Date() } },
    });

    if (!verificationToken) return sendError(res, 400, 'Invalid or expired reset token');

    const hashedPassword = await hashUserPassword(password);
    await prisma.user.update({ where: { id: verificationToken.userId }, data: { passwordHash: hashedPassword } });
    await prisma.verificationToken.update({ where: { id: verificationToken.id }, data: { isUsed: true } });

    return sendSuccess(res, 200, 'Password reset successfully. Please login with your new password.');
  } catch (error) {
    console.error('Confirm reset password error:', error);
    return sendError(res, 500, 'Failed to reset password');
  }
};

export const updatePassword = async (req: AuthRequest, res: Response) => {
  try {
    const authError = requireAuth(req, res);
    if (authError) return authError;

    const currentPassword = sanitizePassword(typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '');
    const newPassword = sanitizePassword(typeof req.body?.newPassword === 'string' ? req.body.newPassword : '');

    if (!currentPassword || !newPassword) return sendError(res, 400, 'Current password and new password are required');

    const user = await getUserByEmail(req.user!.email);
    if (!user || !user.passwordHash) return sendError(res, 400, 'Cannot update password for social login accounts');

    const isPasswordValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isPasswordValid) return sendError(res, 401, 'Current password is incorrect');

    const hashedPassword = await hashUserPassword(newPassword);
    await prisma.user.update({ where: { id: req.user!.userId }, data: { passwordHash: hashedPassword } });

    return sendSuccess(res, 200, 'Password updated successfully');
  } catch (error) {
    console.error('Update password error:', error);
    return sendError(res, 500, 'Failed to update password');
  }
};
