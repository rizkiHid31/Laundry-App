import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface NavItem { label: string; path: string }

const WORKER_NAV: NavItem[] = [
  { label: 'Order Tersedia', path: '/worker' },
  { label: 'Riwayat Kerja', path: '/worker/history' },
  { label: 'Absensi', path: '/attendance' },
];

const DRIVER_NAV: NavItem[] = [
  { label: 'Dashboard', path: '/driver' },
  { label: 'Riwayat', path: '/driver/history' },
  { label: 'Absensi', path: '/attendance' },
];

const ADMIN_NAV: NavItem[] = [
  { label: 'Laporan Absensi', path: '/attendance/report' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems =
    user?.role === 'WORKER' ? WORKER_NAV :
    user?.role === 'DRIVER' ? DRIVER_NAV :
    ADMIN_NAV;

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white shadow-md flex flex-col shrink-0">
        <div className="p-6 border-b">
          <a href="/" className="text-xl font-bold text-blue-600">LaundryApp</a>
          <p className="text-sm font-medium text-gray-900 mt-3">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
          <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded font-medium">
            {user?.role?.replace('_', ' ')}
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-4 py-2 rounded-lg text-sm font-medium transition ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t space-y-1">
          <Link
            to="/profile"
            className="block px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition"
          >
            My Profile
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto p-8">
        {children}
      </main>
    </div>
  );
}
