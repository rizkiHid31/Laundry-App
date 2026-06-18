import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { sendErrorResponse, validateRegistration, validateLoginInput, validatePassword, validateToken, validateProfileUpdate } from '../services/authValidation';
import { okResponse, createdResponse } from '../services/responseHelper';
import { AuthRequest } from '../middleware/auth';

const handle = (fn: (req: Request, res: Response) => Promise<void>) => {
  return async (req: Request, res: Response) => {
    try {
      await fn(req, res);
    } catch (error) {
      sendErrorResponse(res, error);
    }
  };
};

export const register = handle(async (req, res) => {
  const { email, firstName, lastName } = req.body;
  validateRegistration(email, firstName, lastName);
  const data = await authService.register(email, firstName, lastName);
  createdResponse(res, 'Registrasi berhasil. Cek email untuk verifikasi.', data);
});

export const verifyEmailAndSetPassword = handle(async (req, res) => {
  const { token, password } = req.body;
  validateToken(token);
  validatePassword(password);
  await authService.verifyEmailAndSetPassword(token, password);
  okResponse(res, 'Email terverifikasi. Silakan login.');
});

export const resendVerificationEmail = handle(async (req, res) => {
  const { email } = req.body;
  await authService.resendVerificationEmail(email);
  okResponse(res, 'Email verifikasi telah dikirim ulang.');
});

export const login = handle(async (req, res) => {
  const { email, password } = req.body;
  validateLoginInput(email, password);
  const data = await authService.login(email, password);
  okResponse(res, 'Login berhasil', data);
});

export const requestResetPassword = handle(async (req, res) => {
  const { email } = req.body;
  await authService.requestResetPassword(email);
  okResponse(res, 'Link reset password telah dikirim ke email.');
});

export const confirmResetPassword = handle(async (req, res) => {
  const { token, password } = req.body;
  validateToken(token);
  validatePassword(password);
  await authService.confirmResetPassword(token, password);
  okResponse(res, 'Password berhasil direset. Silakan login.');
});

export const getCurrentUser = handle(async (req, res) => {
  const user = await authService.getCurrentUser((req as AuthRequest).user!.userId);
  okResponse(res, 'OK', user);
});

export const updateProfile = handle(async (req, res) => {
  const userId = (req as AuthRequest).user!.userId;
  validateProfileUpdate(req.body);
  const user = await userService.updateProfile(userId, req.body);
  okResponse(res, 'Profil berhasil diperbarui', user);
});

export const updatePassword = handle(async (req, res) => {
  const userId = (req as AuthRequest).user!.userId;
  const { currentPassword, newPassword } = req.body;
  validatePassword(newPassword);
  await userService.updatePassword(userId, currentPassword, newPassword);
  okResponse(res, 'Password berhasil diperbarui');
});

export const updateEmail = handle(async (req, res) => {
  const userId = (req as AuthRequest).user!.userId;
  const { newEmail } = req.body;
  await userService.updateEmail(userId, newEmail);
  okResponse(res, 'Link verifikasi dikirim ke email baru.');
});

export const uploadProfilePicture = handle(async (req, res) => {
  const userId = (req as AuthRequest).user!.userId;
  const file = (req as Request & { file?: { filename: string } }).file;
  if (!file) {
    res.status(400).json({ success: false, message: 'File gambar wajib diupload' });
    return;
  }
  const imageUrl = `/uploads/${file.filename}`;
  const user = await userService.uploadProfilePicture(userId, imageUrl);
  okResponse(res, 'Foto profil berhasil diupload', { profilePicture: user.profilePicture });
});
