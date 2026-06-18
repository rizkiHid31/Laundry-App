import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { sendVerificationEmail, sendResetPasswordEmail } from '../utils/email';
import { AuthValidationError } from './authValidation';
import {
  generateTokenPair,
  generatePasswordResetToken,
  selectPublicUserFields,
} from './authHelper';
import { prisma } from '../lib/prisma';

export const authService = {
  async register(email: string, firstName: string, lastName?: string) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AuthValidationError(400, 'Email already registered');
    }

    const { token, expiry } = generateTokenPair();
    const user = await prisma.user.create({
      data: {
        email,
        firstName: firstName.trim(),
        lastName: lastName?.trim() || '',
        emailVerificationToken: token,
        emailVerificationTokenExpiry: expiry,
        loginProvider: 'email',
      },
    });

    await sendVerificationEmail(email, firstName, token);
    return { userId: user.id, email: user.email };
  },

  async verifyEmailAndSetPassword(token: string, password: string) {
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new AuthValidationError(400, 'Invalid or expired verification token');
    }

    const hashedPassword = await hashPassword(password);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        isVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiry: null,
      },
    });
  },

  async resendVerificationEmail(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AuthValidationError(400, 'User not found');
    }
    if (user.isVerified) {
      throw new AuthValidationError(400, 'User is already verified');
    }

    const { token, expiry } = generateTokenPair();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: token,
        emailVerificationTokenExpiry: expiry,
      },
    });

    await sendVerificationEmail(email, user.firstName || 'User', token);
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AuthValidationError(401, 'Invalid email or password');
    }

    if (!user.isVerified) {
      throw new AuthValidationError(401, 'Please verify your email first');
    }

    if (!user.password) {
      throw new AuthValidationError(
        401,
        'This account uses social login. Please use social login to proceed.'
      );
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new AuthValidationError(401, 'Invalid email or password');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isVerified: user.isVerified,
      },
    };
  },

  async requestResetPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AuthValidationError(400, 'User not found');
    }

    if (!user.password || user.loginProvider !== 'email') {
      throw new AuthValidationError(
        400,
        'This account uses social login. Please use social login to reset password.'
      );
    }

    const { token, expiry } = generatePasswordResetToken();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: token,
        resetPasswordTokenExpiry: expiry,
      },
    });

    await sendResetPasswordEmail(email, user.firstName || 'User', token);
  },

  async confirmResetPassword(token: string, password: string) {
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new AuthValidationError(400, 'Invalid or expired reset token');
    }

    const hashedPassword = await hashPassword(password);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordTokenExpiry: null,
      },
    });
  },

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: selectPublicUserFields(),
    });

    if (!user) {
      throw new AuthValidationError(404, 'User not found');
    }

    return user;
  },
};
