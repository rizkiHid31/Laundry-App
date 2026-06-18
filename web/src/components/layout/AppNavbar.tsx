import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Shirt, Menu, X } from 'lucide-react';
import { useState } from 'react';

const roleLinks: Record<string, { to: string; label: string }[]> = {
  CUSTOMER: [
    { to: '/pickup', label: 'Pickup' },
    { to: '/orders', label: 'Pesanan' },
    { to: '/addresses', label: 'Alamat' },
  ],
  DRIVER: [{ to: '/driver', label: 'Driver' }],
  WORKER: [{ to: '/worker', label: 'Station' }],
  OUTLET_ADMIN: [{ to: '/outlet-admin', label: 'Outlet Admin' }],
  SUPER_ADMIN: [{ to: '/super-admin', label: 'Super Admin' }],
};

export default function AppNavbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const links = user ? roleLinks[user.role] || [] : [];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-primary">
          <Shirt className="h-6 w-6" />
          <span className="hidden sm:inline">LaundryApp</span>
        </Link>

        <nav className="hidden items-center gap-4 md:flex">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="text-sm text-muted-foreground hover:text-foreground">
              {l.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="text-sm hover:text-primary">Profil</Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Login</Button>
              <Button size="sm" onClick={() => navigate('/register')}>Daftar</Button>
            </>
          )}
        </nav>

        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="border-t px-4 py-3 md:hidden space-y-2">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="block py-2" onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <Button variant="outline" className="w-full" onClick={handleLogout}>Logout</Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => navigate('/login')}>Login</Button>
              <Button className="flex-1" onClick={() => navigate('/register')}>Daftar</Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
