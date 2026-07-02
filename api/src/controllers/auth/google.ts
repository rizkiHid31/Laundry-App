import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { getUserByEmail, getUserByOAuthAccount, createUserRecord, createOAuthAccount, assignDefaultCustomerRole, buildUserResponse, issueToken } from '../authController.helpers';
import { sendError, sendSuccess } from '../authController.helpers';

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

export const redirectToGoogle = async (_req: Request, res: Response) => {
  try {
    const url = client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'select_account',
      scope: ['openid', 'email', 'profile'],
    });
    return res.redirect(url);
  } catch (error) {
    console.error('Google redirect error:', error);
    return sendError(res, 500, 'Failed to start Google login');
  }
};

export const handleGoogleCallback = async (req: Request, res: Response) => {
  try {
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    if (!code) return sendError(res, 400, 'Missing Google authorization code');

    const { tokens } = await client.getToken(code);
    if (!tokens.id_token) return sendError(res, 400, 'Missing Google ID token');

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload?.email?.toLowerCase();
    const providerAccountId = payload?.sub;
    const fullName = [payload?.given_name, payload?.family_name].filter(Boolean).join(' ').trim() || payload?.name || email?.split('@')[0] || 'Google User';
    const photoUrl = payload?.picture || null;

    if (!email || !providerAccountId) return sendError(res, 400, 'Unable to verify Google user');

    let user = await getUserByOAuthAccount('google', providerAccountId);
    if (!user) {
      user = await getUserByEmail(email);
      if (!user) {
        user = await createUserRecord(email, fullName, { photoUrl });
      }
      await createOAuthAccount(user.id, 'google', providerAccountId);
    }

    await assignDefaultCustomerRole(user.id);

    const token = issueToken(user);
    const redirectUri = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/google-callback?token=${encodeURIComponent(token)}` : `http://localhost:5173/google-callback?token=${encodeURIComponent(token)}`;

    return res.redirect(redirectUri);
  } catch (error) {
    console.error('Google callback error:', error);
    return sendError(res, 500, 'Google login failed');
  }
};
