import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AppNavbar from '@/components/layout/AppNavbar';

const roleHome: Record<string, string> = {
  CUSTOMER: '/orders',
  DRIVER: '/driver',
  WORKER: '/worker',
  OUTLET_ADMIN: '/outlet-admin',
  SUPER_ADMIN: '/super-admin',
};

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return <Navigate to={roleHome[user.role] || '/orders'} replace />;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <AppNavbar />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
