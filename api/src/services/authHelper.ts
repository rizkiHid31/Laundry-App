import { generateVerificationToken, generateResetToken } from '../utils/jwt';

const TOKEN_EXPIRY_MS = 60 * 60 * 1000;

export const generateTokenPair = () => ({
  token: generateVerificationToken(),
  expiry: new Date(Date.now() + TOKEN_EXPIRY_MS),
});

export const generatePasswordResetToken = () => ({
  token: generateResetToken(),
  expiry: new Date(Date.now() + TOKEN_EXPIRY_MS),
});

export const selectPublicUserFields = () => ({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  profilePicture: true,
  role: true,
  workerType: true,
  outletId: true,
  isVerified: true,
  loginProvider: true,
  createdAt: true,
});
