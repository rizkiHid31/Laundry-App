import { Request, Response } from 'express';
import { VerificationTokenType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken, generateVerificationToken, generateResetToken } from '../utils/jwt';
import { sendVerificationEmail, sendResetPasswordEmail } from '../utils/email';
import { AuthRequest } from '../middleware/auth';

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

const getPrimaryRole = async (userId: string): Promise<string> => {
  const userRole = await prisma.userRole.findFirst({
    where: { userId, outletId: null },
    include: { role: true },
  });
  return userRole?.role.name ?? '';
};

// REGISTER
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body as { name: string; email: string };

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const token = generateVerificationToken();

    const user = await prisma.user.create({
      data: {
        name,
        email,
        verificationTokens: {
          create: {
            token,
            type: VerificationTokenType.EMAIL_VERIFY,
            expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
          },
        },
      },
    });

    await sendVerificationEmail(email, name, token);

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

    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token,
        type: VerificationTokenType.EMAIL_VERIFY,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!verificationToken) {
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

    return res.json({
      success: true,
      message: 'Email verified successfully. Please login with your new password.',
    });
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

    await prisma.$transaction([
      prisma.verificationToken.updateMany({
        where: { userId: user.id, type: VerificationTokenType.EMAIL_VERIFY, isUsed: false },
        data: { isUsed: true },
      }),
      prisma.verificationToken.create({
        data: {
          userId: user.id,
          token,
          type: VerificationTokenType.EMAIL_VERIFY,
          expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
        },
      }),
    ]);

    await sendVerificationEmail(email, user.name, token);

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
      return res.status(401).json({
        success: false,
        message: 'This account uses social login. Please use social login to proceed.',
      });
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const role = await getPrimaryRole(user.id);

    const token = generateToken({ userId: user.id, email: user.email, role });

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role,
          isVerified: user.isVerified,
        },
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

    if (!user.passwordHash) {
      return res.status(400).json({
        success: false,
        message: 'This account uses social login. Please use social login to reset password.',
      });
    }

    const token = generateResetToken();

    await prisma.$transaction([
      prisma.verificationToken.updateMany({
        where: { userId: user.id, type: VerificationTokenType.RESET_PASSWORD, isUsed: false },
        data: { isUsed: true },
      }),
      prisma.verificationToken.create({
        data: {
          userId: user.id,
          token,
          type: VerificationTokenType.RESET_PASSWORD,
          expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
        },
      }),
    ]);

    await sendResetPasswordEmail(email, user.name, token);

    return res.json({
      success: true,
      message: 'Reset password link sent to your email. Please check your email.',
    });
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

    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token,
        type: VerificationTokenType.RESET_PASSWORD,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!verificationToken) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    const passwordHash = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: verificationToken.userId },
        data: { passwordHash },
      }),
      prisma.verificationToken.update({
        where: { id: verificationToken.id },
        data: { isUsed: true },
      }),
    ]);

    return res.json({
      success: true,
      message: 'Password reset successfully. Please login with your new password.',
    });
  } catch (error) {
    console.error('Confirm reset password error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
};

// GET CURRENT USER
export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        isVerified: true,
        photoUrl: true,
        createdAt: true,
        userRoles: {
          include: { role: { select: { name: true, scope: true } } },
        },
        outletEmployees: {
          select: {
            outletId: true,
            isActive: true,
            createdAt: true,
            outlet: { select: { name: true } },
          },
        },
      },
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
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { name, photoUrl } = req.body as { name?: string; photoUrl?: string };

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        ...(name ? { name } : {}),
        ...(photoUrl ? { photoUrl } : {}),
      },
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
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user?.passwordHash) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update password for social login accounts',
      });
    }

    const isPasswordValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: req.user.userId }, data: { passwordHash } });

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update password' });
  }
};

// UPDATE EMAIL
export const updateEmail = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { newEmail } = req.body as { newEmail: string };
    if (!newEmail) {
      return res.status(400).json({ success: false, message: 'New email is required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: newEmail } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    const token = generateVerificationToken();

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        email: newEmail,
        isVerified: false,
        verificationTokens: {
          create: {
            token,
            type: VerificationTokenType.EMAIL_VERIFY,
            expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
          },
        },
      },
    });

    await sendVerificationEmail(newEmail, user.name, token);

    return res.json({
      success: true,
      message: 'Verification link sent to new email. Please verify to confirm email change.',
    });
  } catch (error) {
    console.error('Update email error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update email' });
  }
};

// UPLOAD PROFILE PICTURE
export const uploadProfilePicture = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // TODO: Implement file upload logic
    return res.json({ success: false, message: 'Profile picture upload not yet implemented' });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload profile picture' });
  }
};
