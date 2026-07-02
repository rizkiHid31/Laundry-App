import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { generateVerificationToken } from '../../utils/jwt';
import {
  createUserRecord,
  createVerificationRecord,
  getUserByEmail,
  isValidEmail,
  normalizeEmail,
  sanitizeName,
  sendError,
  sendSuccess,
  sendVerificationMail,
} from '../authController.helpers';

export const register = async (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(typeof req.body?.email === 'string' ? req.body.email : '');
    const firstName = sanitizeName(typeof req.body?.firstName === 'string' ? req.body.firstName : '');
    const lastName = sanitizeName(typeof req.body?.lastName === 'string' ? req.body.lastName : '');

    if (!email || !isValidEmail(email)) return sendError(res, 400, 'Please provide a valid email address');
    if (!firstName && !lastName) return sendError(res, 400, 'Please provide at least one name');

    if (await getUserByEmail(email)) return sendError(res, 400, 'Email already registered');

    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || email.split('@')[0] || 'user';
    const verificationToken = generateVerificationToken();
    const user = await createUserRecord(email, fullName);
    await createVerificationRecord(user.id, verificationToken, 'EMAIL_VERIFY');

    const sent = await sendVerificationMail(email, fullName, verificationToken);
    if (!sent) {
      const previewLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
      return sendSuccess(res, 201, 'Registration successful, but email delivery is not configured in development. Use the preview link to verify your account.', {
        userId: user.id,
        email: user.email,
        verificationLink: previewLink,
      });
    }

    return sendSuccess(res, 201, 'Registration successful. Please check your email to verify your account.', {
      userId: user.id,
      email: user.email,
    });
  } catch (error) {
    console.error('Register error:', error);
    return sendError(res, 500, 'Registration failed');
  }
};

export const verifyEmailAndSetPassword = async (req: Request, res: Response) => {
  try {
    const rawToken = typeof req.body?.token === 'string' ? req.body.token : '';
    const rawPassword = typeof req.body?.password === 'string' ? req.body.password : '';
    const password = sanitizeName(rawPassword);

    if (!rawToken || !password) return sendError(res, 400, 'Token and password are required');

    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token: rawToken,
        type: 'EMAIL_VERIFY',
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!verificationToken) return sendError(res, 400, 'Invalid or expired verification token');

    const hashedPassword = await (await import('../../utils/password.js')).hashPassword(password);
    await prisma.user.update({ where: { id: verificationToken.userId }, data: { passwordHash: hashedPassword, isVerified: true } });
    await prisma.verificationToken.update({ where: { id: verificationToken.id }, data: { isUsed: true } });

    return sendSuccess(res, 200, 'Email verified successfully. Please login with your new password.');
  } catch (error) {
    console.error('Verify email error:', error);
    return sendError(res, 500, 'Email verification failed');
  }
};

export const resendVerificationEmail = async (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(typeof req.body?.email === 'string' ? req.body.email : '');
    if (!email || !isValidEmail(email)) return sendError(res, 400, 'Please provide a valid email address');

    const user = await getUserByEmail(email);
    if (!user) return sendError(res, 400, 'User not found');
    if (user.isVerified) return sendError(res, 400, 'User is already verified');

    const verificationToken = generateVerificationToken();
    await createVerificationRecord(user.id, verificationToken, 'EMAIL_VERIFY');
    await sendVerificationMail(email, user.name || 'User', verificationToken);

    return sendSuccess(res, 200, 'Verification email sent. Please check your email.');
  } catch (error) {
    console.error('Resend verification error:', error);
    return sendError(res, 500, 'Failed to resend verification email');
  }
};
