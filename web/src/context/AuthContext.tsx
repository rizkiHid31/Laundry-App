import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  profilePicture?: string;
  role: string;
  isVerified: boolean;
  loginProvider: string;
  userRoles?: Array<{ role: { name: string; scope: string } }>;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  register: (email: string, firstName: string, lastName?: string) => Promise<void>;
  verifyEmail: (token: string, password: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
  login: (email: string, password: string) => Promise<string[]>;
  logout: () => void;
  requestResetPassword: (email: string) => Promise<void>;
  confirmResetPassword: (token: string, password: string) => Promise<void>;
  getCurrentUser: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateEmail: (newEmail: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/api/auth/me');
      setUser(res.data.data);
    } catch {
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, firstName: string, lastName?: string) => {
    try {
      const name = [firstName, lastName].filter(Boolean).join(' ');
      await api.post('/api/auth/register', { email, name });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const verifyEmail = async (token: string, password: string) => {
    try {
      await api.post('/api/auth/verify-email', { token, password });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Verification failed');
    }
  };

  const resendVerificationEmail = async (email: string) => {
    try {
      await api.post('/api/auth/resend-verification', { email });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to resend verification email');
    }
  };

  const login = async (email: string, password: string): Promise<string[]> => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const { token: newToken } = res.data.data;
      setToken(newToken);
      localStorage.setItem('token', newToken);

      // Fetch full profile (includes outlet-scoped roles like driver/worker,
      // which the login response's flat `role` field omits).
      const meRes = await api.get('/api/auth/me');
      const fullUser: User = meRes.data.data;
      setUser(fullUser);

      return (fullUser.userRoles ?? []).map((ur) => ur.role.name);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const requestResetPassword = async (email: string) => {
    try {
      await api.post('/api/auth/request-reset-password', { email });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to request password reset');
    }
  };

  const confirmResetPassword = async (token: string, password: string) => {
    try {
      await api.post('/api/auth/confirm-reset-password', { token, password });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to reset password');
    }
  };

  const getCurrentUser = async () => {
    await fetchCurrentUser();
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const res = await api.put('/api/auth/profile', data);
      setUser(res.data.data);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await api.put('/api/auth/password', { currentPassword, newPassword });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update password');
    }
  };

  const updateEmail = async (newEmail: string) => {
    try {
      await api.put('/api/auth/email', { newEmail });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update email');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        register,
        verifyEmail,
        resendVerificationEmail,
        login,
        logout,
        requestResetPassword,
        confirmResetPassword,
        getCurrentUser,
        updateProfile,
        updatePassword,
        updateEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
