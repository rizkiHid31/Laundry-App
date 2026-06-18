import { hashPassword, comparePassword } from '../utils/password';
import { sendVerificationEmail } from '../utils/email';
import { AuthValidationError } from './authValidation';
import { generateTokenPair } from './authHelper';
import { prisma } from '../lib/prisma';
import { selectPublicUserFields } from './authHelper';

export const userService = {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: selectPublicUserFields(),
    });
    if (!user) throw new AuthValidationError(404, 'User tidak ditemukan');
    return user;
  },

  async updateProfile(userId: string, data: Record<string, unknown>) {
    const fields = ['firstName', 'lastName', 'phone'] as const;
    const updateData: Record<string, string | undefined> = {};
    for (const key of fields) {
      if (data[key] !== undefined) {
        updateData[key] = String(data[key]).trim() || undefined;
      }
    }
    return prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: selectPublicUserFields(),
    });
  },

  async updatePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.password) {
      throw new AuthValidationError(400, 'Akun social login tidak bisa ubah password');
    }
    const valid = await comparePassword(currentPassword, user.password);
    if (!valid) throw new AuthValidationError(401, 'Password saat ini salah');
    const hashed = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
  },

  async updateEmail(userId: string, newEmail: string) {
    const exists = await prisma.user.findUnique({ where: { email: newEmail } });
    if (exists) throw new AuthValidationError(400, 'Email sudah digunakan');
    const { token, expiry } = generateTokenPair();
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        email: newEmail,
        isVerified: false,
        emailVerificationToken: token,
        emailVerificationTokenExpiry: expiry,
      },
    });
    await sendVerificationEmail(newEmail, user.firstName || 'User', token);
  },

  async uploadProfilePicture(userId: string, imageUrl: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { profilePicture: imageUrl },
      select: selectPublicUserFields(),
    });
  },
};
