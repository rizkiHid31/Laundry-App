import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken, generateVerificationToken, generateResetToken } from '../utils/jwt';
import { sendVerificationEmail, sendResetPasswordEmail } from '../utils/email';
import { AuthRequest } from '../middleware/auth';

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export const sanitizeName = (value?: string) => {
  const normalized = value?.trim();
  if (!normalized || normalized.length > 50) return null;
  return normalized;
};

export const sanitizePassword = (password?: string) => {
  const normalized = password?.trim();
  if (!normalized || normalized.length < 6 || normalized.length > 128) return null;
  return normalized;
};

export const sendError = (res: Response, statusCode: number, message: string) => {
  return res.status(statusCode).json({ success: false, message });
};

export const sendSuccess = (res: Response, statusCode: number, message: string, data?: unknown) => {
  const payload: { success: boolean; message: string; data?: unknown } = {
    success: true,
    message,
  };

  if (data !== undefined) payload.data = data;
  return res.status(statusCode).json(payload);
};

export const getPrimaryRole = (user: any) => {
  const roleNames = (user?.userRoles || [])
    .map((entry: any) => entry?.role?.name)
    .filter((name: string | undefined): name is string => Boolean(name))
    .map((name: string) => name.toLowerCase().trim());

  const priorityOrder = ['super_admin', 'admin', 'outlet_admin', 'driver', 'worker', 'customer'];

  for (const candidate of priorityOrder) {
    if (roleNames.includes(candidate)) {
      return candidate;
    }
  }

  if (typeof user?.role === 'string' && user.role.trim()) {
    return user.role.toLowerCase().trim();
  }

  return 'customer';
};

export const buildUserResponse = (user: any) => {
  const fullName = (user.name || '').trim();
  const nameParts = fullName.split(/\s+/).filter(Boolean);
  const firstName = nameParts.shift() || '';
  const lastName = nameParts.join(' ') || '';
  const loginProvider = user.loginProvider || user.oauthAccounts?.[0]?.provider || 'email';

  return {
    id: user.id,
    email: user.email,
    firstName,
    lastName,
    name: user.name,
    role: getPrimaryRole(user),
    isVerified: user.isVerified,
    loginProvider,
    photoUrl: user.photoUrl || null,
    createdAt: user.createdAt,
    userRoles: user.userRoles || [],
  };
};

export const getUserByEmail = async (email: string) => {
  return prisma.user.findUnique({ where: { email } });
};

export const getUserWithRoles = async (email: string) => {
  return prisma.user.findUnique({
    where: { email },
    include: { userRoles: { include: { role: true } }, oauthAccounts: true },
  });
};

export const getCurrentUserWithRoles = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { userRoles: { include: { role: true } }, oauthAccounts: true },
  });
};

export const createVerificationRecord = async (userId: string, token: string, type: 'EMAIL_VERIFY' | 'RESET_PASSWORD') => {
  const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
  return prisma.verificationToken.create({
    data: { userId, token, type, expiresAt: tokenExpiry },
  });
};

export const createUserRecord = async (email: string, fullName: string, extra: Record<string, any> = {}) => {
  return prisma.user.create({
    data: {
      email,
      name: fullName,
      passwordHash: null,
      isVerified: true,
      photoUrl: null,
      ...extra,
    },
  });
};

export const getUserByOAuthAccount = async (provider: string, providerAccountId: string) => {
  const account = await prisma.oauthAccount.findFirst({
    where: { provider, providerAccountId },
    include: { user: true },
  });
  return account?.user ?? null;
};

export const createOAuthAccount = async (userId: string, provider: string, providerAccountId: string) => {
  return prisma.oauthAccount.create({
    data: { userId, provider, providerAccountId },
  });
};

export const assignDefaultCustomerRole = async (userId: string) => {
  const customerRole = await prisma.role.findUnique({ where: { name: 'customer' } });
  if (!customerRole) return;
  const existingRole = await prisma.userRole.findFirst({ where: { userId, roleId: customerRole.id } });
  if (!existingRole) {
    await prisma.userRole.create({ data: { userId, roleId: customerRole.id } });
  }
};

export const verifyPassword = async (password: string, passwordHash: string) => {
  return comparePassword(password, passwordHash);
};

export const hashUserPassword = async (password: string) => {
  return hashPassword(password);
};

export const sendVerificationMail = async (email: string, name: string, token: string) => {
  return sendVerificationEmail(email, name, token);
};

export const sendResetMail = async (email: string, name: string, token: string) => {
  return sendResetPasswordEmail(email, name, token);
};

export const issueToken = (user: any) => {
  return generateToken({ userId: user.id, email: user.email, role: getPrimaryRole(user) });
};

export const requireAuth = (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }
  return null;
};
