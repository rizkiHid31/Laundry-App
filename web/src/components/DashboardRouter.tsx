import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DashboardRouter() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate('/login');
      return;
    }

    // Redirect based on role using a stable priority order
    const roleName = (user.role || '').toLowerCase().trim();

    if (roleName === 'super_admin' || roleName === 'admin') {
      navigate('/admin', { replace: true });
      return;
    }

    if (roleName === 'outlet_admin') {
      navigate('/outlet-admin', { replace: true });
      return;
    }

    if (roleName === 'driver') {
      navigate('/driver', { replace: true });
      return;
    }

    if (roleName === 'worker') {
      navigate('/worker', { replace: true });
      return;
    }

    if (roleName === 'customer') {
      navigate('/customer', { replace: true });
      return;
    }

    // default: keep user on placeholder dashboard
    navigate('/dashboard/placeholder');
  }, [user, loading, navigate]);

  return null;
}
