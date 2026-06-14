import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;
    if (user.role === 'WORKER') navigate('/worker', { replace: true });
    else if (user.role === 'DRIVER') navigate('/driver', { replace: true });
    else if (user.role === 'OUTLET_ADMIN' || user.role === 'SUPER_ADMIN')
      navigate('/attendance/report', { replace: true });
    else navigate('/profile', { replace: true });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  );
}
