/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  profilePicture?: string;
  photoUrl?: string;
  role: string;
  isVerified: boolean;
  loginProvider: string;
  userRoles?: Array<{ role: { name: string; description?: string } }>;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  register: (email: string, firstName: string, lastName?: string) => Promise<void>;
  verifyEmail: (token: string, password: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  requestResetPassword: (email: string) => Promise<void>;
  confirmResetPassword: (token: string, password: string) => Promise<void>;
  getCurrentUser: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateEmail: (newEmail: string) => Promise<void>;
  uploadProfilePicture: (file: File) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const normalizeUser = (user: any) => ({
  ...user,
  profilePicture: user?.profilePicture || user?.photoUrl || null,
  photoUrl: user?.photoUrl || user?.profilePicture || null,
});

type AuthProviderProps = {
  children: React.ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const getCurrentUserData = async (authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(normalizeUser(data.data));
      } else {
        localStorage.removeItem('token');
        setToken(null);
      }
    } catch (error) {
      console.error('Failed to get user:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        setToken(savedToken);
        await getCurrentUserData(savedToken);
      } else {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const register = async (email: string, firstName: string, lastName?: string) => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, firstName, lastName }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }
  };

  const verifyEmail = async (token: string, password: string) => {
    const response = await fetch(`${API_URL}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Verification failed');
    }
  };

  const resendVerificationEmail = async (email: string) => {
    const response = await fetch(`${API_URL}/api/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to resend verification email');
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    setToken(data.data.token);
    setUser(normalizeUser(data.data.user));
    localStorage.setItem('token', data.data.token);
    return normalizeUser(data.data.user) as User;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const requestResetPassword = async (email: string) => {
    const response = await fetch(`${API_URL}/api/auth/request-reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to request password reset');
    }
  };

  const confirmResetPassword = async (token: string, password: string) => {
    const response = await fetch(`${API_URL}/api/auth/confirm-reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reset password');
    }
  };

  const getCurrentUser = async () => {
    if (token) {
      await getCurrentUserData(token);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update profile');
    }

    const result = await response.json();
    const updatedUser = normalizeUser(result.data || result);
    setUser((current) => current ? { ...current, ...updatedUser } : updatedUser);
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/api/auth/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update password');
    }
  };

  const updateEmail = async (newEmail: string) => {
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/api/auth/email`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ newEmail }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update email');
    }
  };

  const uploadProfilePicture = async (file: File) => {
    if (!token) throw new Error('Not authenticated');

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Only JPG, JPEG, PNG, and GIF files are allowed');
    }

    if (file.size > 1024 * 1024) {
      throw new Error('Image must be 1MB or smaller');
    }

    const base64Image = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });

    const response = await fetch(`${API_URL}/api/auth/profile-picture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ photoUrl: base64Image }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload profile picture');
    }

    const result = await response.json();
    const uploadedPhoto = result?.data?.photoUrl || result?.data?.profilePicture || result?.data?.url;
    if (uploadedPhoto) {
      setUser((current) => current ? { ...current, profilePicture: uploadedPhoto, photoUrl: uploadedPhoto } : current);
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
        uploadProfilePicture,
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