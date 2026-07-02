import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import {
  buildUserResponse,
  getCurrentUserWithRoles,
  getUserWithRoles,
  issueToken,
  requireAuth,
  sanitizePassword,
  sendError,
  sendSuccess,
  verifyPassword,
} from '../authController.helpers';

export const login = async (req: Request, res: Response) => {
  try {
    const email = (typeof req.body?.email === 'string' ? req.body.email : '').trim().toLowerCase();
    const password = sanitizePassword(typeof req.body?.password === 'string' ? req.body.password : '');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
      return sendError(res, 400, 'Please provide a valid email and password');
    }

    const user = await getUserWithRoles(email);
    if (!user) return sendError(res, 401, 'Invalid email or password');
    if (!user.isVerified) return sendError(res, 401, 'Please verify your email first');
    if (!user.passwordHash) return sendError(res, 401, 'This account uses social login. Please use social login to proceed.');

    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) return sendError(res, 401, 'Invalid email or password');

    return sendSuccess(res, 200, 'Login successful', { token: issueToken(user), user: buildUserResponse(user) });
  } catch (error) {
    console.error('Login error:', error);
    return sendError(res, 500, 'Login failed');
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const authError = requireAuth(req, res);
    if (authError) return authError;

    const user = await getCurrentUserWithRoles(req.user!.userId);
    if (!user) return sendError(res, 404, 'User not found');

    return sendSuccess(res, 200, 'User fetched successfully', buildUserResponse(user));
  } catch (error) {
    console.error('Get current user error:', error);
    return sendError(res, 500, 'Failed to get user');
  }
};
