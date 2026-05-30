import React, { createContext, useContext, useState, useEffect } from 'react';

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
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  register: (email: string, firstName: string, lastName?: string) => Promise<void>;
  verifyEmail: (token: string, password: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  requestResetPassword: (email: string) => Promise<void>;
  confirmResetPassword: (token: string, password: string) => Promise<void>;
  getCurrentUser: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateEmail: (newEmail: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      getCurrentUserData(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const getCurrentUserData = async (authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.data);
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
    setUser(data.data.user);
    localStorage.setItem('token', data.data.token);
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
    setUser(result.data);
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
