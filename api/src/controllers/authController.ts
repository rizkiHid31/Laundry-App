import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken, generateVerificationToken, generateResetToken } from '../utils/jwt.js';
import { sendVerificationEmail, sendResetPasswordEmail } from '../utils/email.js';
import { AuthRequest } from '../middleware/auth.js';

// REGISTER
export const register = async (req: Request, res: Response) => {
  try {
    const { email, firstName, lastName } = req.body as {
      email: string;
      firstName: string;
      lastName?: string;
    };

    if (!email || !firstName) {
      return res.status(400).json({ success: false, message: 'Email and firstName are required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const name = `${firstName} ${lastName || ''}`.trim();
    const user = await prisma.user.create({ data: { email, name } });

    const token = generateVerificationToken();
    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        type: 'EMAIL_VERIFY',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    await sendVerificationEmail(email, firstName, token);

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: { userId: user.id, email: user.email },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

// VERIFY EMAIL AND SET PASSWORD
export const verifyEmailAndSetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body as { token: string; password: string };

    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token and password are required' });
    }

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken || verificationToken.isUsed || verificationToken.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
    }

    const passwordHash = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: verificationToken.userId },
        data: { passwordHash, isVerified: true },
      }),
      prisma.verificationToken.update({
        where: { id: verificationToken.id },
        data: { isUsed: true },
      }),
    ]);

    return res.json({ success: true, message: 'Email verified successfully. Please login with your new password.' });
  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).json({ success: false, message: 'Email verification failed' });
  }
};

// RESEND VERIFICATION EMAIL
export const resendVerificationEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email: string };

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'User is already verified' });
    }

    const token = generateVerificationToken();
    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        type: 'EMAIL_VERIFY',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const firstName = user.name.split(' ')[0] ?? user.name;
    await sendVerificationEmail(email, firstName, token);

    return res.json({ success: true, message: 'Verification email sent. Please check your email.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({ success: false, message: 'Failed to resend verification email' });
  }
};

// LOGIN
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (!user.isVerified) {
      return res.status(401).json({ success: false, message: 'Please verify your email first' });
    }
    if (!user.passwordHash) {
      return res.status(401).json({ success: false, message: 'This account uses social login.' });
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Get user's primary role for JWT
    const userRole = await prisma.userRole.findFirst({
      where: { userId: user.id },
      include: { role: true },
      orderBy: { grantedAt: 'desc' },
    });
    const role = userRole?.role.name ?? 'CUSTOMER';

    const token = generateToken({ userId: user.id, email: user.email, role });

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: { id: user.id, email: user.email, name: user.name, role, isVerified: user.isVerified },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Login failed' });
  }
};

// REQUEST RESET PASSWORD
export const requestResetPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email: string };
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    const token = generateResetToken();
    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        type: 'RESET_PASSWORD',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const firstName = user.name.split(' ')[0] ?? user.name;
    await sendResetPasswordEmail(email, firstName, token);

    return res.json({ success: true, message: 'Reset password link sent to your email.' });
  } catch (error) {
    console.error('Request reset password error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send reset password email' });
  }
};

// CONFIRM RESET PASSWORD
export const confirmResetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body as { token: string; password: string };
    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token and password are required' });
    }

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken || verificationToken.isUsed || verificationToken.expiresAt < new Date() || verificationToken.type !== 'RESET_PASSWORD') {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    const passwordHash = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({ where: { id: verificationToken.userId }, data: { passwordHash } }),
      prisma.verificationToken.update({ where: { id: verificationToken.id }, data: { isUsed: true } }),
    ]);

    return res.json({ success: true, message: 'Password reset successfully. Please login with your new password.' });
  } catch (error) {
    console.error('Confirm reset password error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
};

// GET CURRENT USER
export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, name: true, photoUrl: true, isVerified: true, createdAt: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get user' });
  }
};

// UPDATE PROFILE
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const name = firstName ? `${firstName} ${lastName || ''}`.trim() : undefined;

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { ...(name ? { name } : {}), ...(phone ? { photoUrl: undefined } : {}) },
      select: { id: true, email: true, name: true, photoUrl: true },
    });

    return res.json({ success: true, message: 'Profile updated successfully', data: user });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

// UPDATE PASSWORD
export const updatePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user?.passwordHash) {
      return res.status(400).json({ success: false, message: 'Cannot update password for social login accounts' });
    }

    const isValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: req.user!.userId }, data: { passwordHash } });

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update password' });
  }
};

// UPDATE EMAIL
export const updateEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { newEmail } = req.body;
    if (!newEmail) {
      return res.status(400).json({ success: false, message: 'New email is required' });
    }

    const existing = await prisma.user.findUnique({ where: { email: newEmail } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });

    const token = generateVerificationToken();
    await prisma.$transaction([
      prisma.user.update({ where: { id: req.user!.userId }, data: { email: newEmail, isVerified: false } }),
      prisma.verificationToken.create({
        data: { userId: req.user!.userId, token, type: 'EMAIL_VERIFY', expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
      }),
    ]);

    const firstName = user?.name.split(' ')[0] ?? 'User';
    await sendVerificationEmail(newEmail, firstName, token);

    return res.json({ success: true, message: 'Verification link sent to new email.' });
  } catch (error) {
    console.error('Update email error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update email' });
  }
};

// UPLOAD PROFILE PICTURE (placeholder)
export const uploadProfilePicture = async (req: AuthRequest, res: Response) => {
  return res.json({ success: false, message: 'Profile picture upload not yet implemented' });
};
