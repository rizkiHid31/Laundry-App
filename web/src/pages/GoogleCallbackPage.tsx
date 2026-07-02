import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function GoogleCallbackPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) {
      navigate('/login');
      return;
    }

    localStorage.setItem('token', token);
    window.location.href = '/dashboard';
  }, [navigate, logout]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <p className="text-gray-700">Signing in with Google...</p>
      </div>
    </div>
  );
}
