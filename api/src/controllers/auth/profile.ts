import { Response } from 'express';
import { prisma } from '../../lib/prisma';
import { AuthRequest } from '../../middleware/auth';
import {
  buildUserResponse,
  getUserByEmail,
  normalizeEmail,
  requireAuth,
  sanitizeName,
  sendError,
  sendSuccess,
  sendVerificationMail,
} from '../authController.helpers';
import { generateVerificationToken } from '../../utils/jwt';

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const authError = requireAuth(req, res);
    if (authError) return authError;

    const firstName = sanitizeName(typeof req.body?.firstName === 'string' ? req.body.firstName : '');
    const lastName = sanitizeName(typeof req.body?.lastName === 'string' ? req.body.lastName : '');
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || undefined;

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: fullName ? { name: fullName } : {},
      select: { id: true, email: true, name: true, isVerified: true, photoUrl: true, createdAt: true },
    });

    return sendSuccess(res, 200, 'Profile updated successfully', buildUserResponse(user));
  } catch (error) {
    console.error('Update profile error:', error);
    return sendError(res, 500, 'Failed to update profile');
  }
};

export const updateEmail = async (req: AuthRequest, res: Response) => {
  try {
    const authError = requireAuth(req, res);
    if (authError) return authError;

    const newEmail = normalizeEmail(typeof req.body?.newEmail === 'string' ? req.body.newEmail : '');
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return sendError(res, 400, 'New email is required');

    if (await getUserByEmail(newEmail)) return sendError(res, 400, 'Email already in use');

    const verificationToken = generateVerificationToken();
    const user = await prisma.user.update({ where: { id: req.user!.userId }, data: { email: newEmail, isVerified: false } });
    await prisma.verificationToken.create({ data: { userId: user.id, token: verificationToken, type: 'EMAIL_VERIFY', expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });
    await sendVerificationMail(newEmail, user.name || 'User', verificationToken);

    return sendSuccess(res, 200, 'Verification link sent to new email. Please verify to confirm email change.');
  } catch (error) {
    console.error('Update email error:', error);
    return sendError(res, 500, 'Failed to update email');
  }
};

export const uploadProfilePicture = async (req: AuthRequest, res: Response) => {
  try {
    const authError = requireAuth(req, res);
    if (authError) return authError;

    const photoUrl = typeof req.body?.photoUrl === 'string' ? req.body.photoUrl.trim() : '';
    if (!photoUrl) return sendError(res, 400, 'Photo is required');

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { photoUrl },
      select: { id: true, email: true, name: true, isVerified: true, photoUrl: true, createdAt: true },
    });

    return sendSuccess(res, 200, 'Profile picture uploaded successfully', buildUserResponse(user));
  } catch (error) {
    console.error('Upload profile picture error:', error);
    return sendError(res, 500, 'Failed to upload profile picture');
  }
};
