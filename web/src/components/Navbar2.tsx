import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const roleNames = user?.userRoles?.map((ur) => ur.role.name) ?? [];
  const isDriver = roleNames.includes('driver');
  const isWorker = roleNames.includes('worker');
  const isOutletAdmin = roleNames.includes('outlet_admin') || roleNames.includes('super_admin');
  const isEmployee = isDriver || isWorker;

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 w-full bg-white shadow-md z-50">
      <div className="px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="shrink-0">
            <Link to="/" className="text-xl sm:text-2xl font-bold text-blue-600">
              LaundryApp
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex gap-8 items-center">
            <a href="#home" className="text-gray-700 hover:text-blue-600 transition">
              Home
            </a>
            <a href="#services" className="text-gray-700 hover:text-blue-600 transition">
              Services
            </a>
            <a href="#about" className="text-gray-700 hover:text-blue-600 transition">
              About
            </a>
            <a href="#contact" className="text-gray-700 hover:text-blue-600 transition">
              Contact
            </a>
          </div>

          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex gap-3">
            {!user ? (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                >
                  Register
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <span className="text-gray-700">
                  Hi, <strong>{user.name}</strong>
                </span>
                {isDriver && (
                  <Link
                    to="/driver"
                    className="px-4 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition"
                  >
                    Driver Dashboard
                  </Link>
                )}
                {isWorker && (
                  <Link
                    to="/worker"
                    className="px-4 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition"
                  >
                    Worker Dashboard
                  </Link>
                )}
                {isEmployee && (
                  <Link
                    to="/attendance"
                    className="px-4 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition"
                  >
                    Attendance
                  </Link>
                )}
                {isOutletAdmin && (
                  <Link
                    to="/attendance/report"
                    className="px-4 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition"
                  >
                    Attendance Report
                  </Link>
                )}
                {isOutletAdmin && (
                  <Link
                    to="/admin/orders/waiting-payment"
                    className="px-4 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition"
                  >
                    Waiting Payment
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="px-4 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
              />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t pt-4">
            <div className="flex flex-col gap-3">
              <a href="#home" className="text-gray-700 hover:text-blue-600 transition block py-2">
                Home
              </a>
              <a href="#services" className="text-gray-700 hover:text-blue-600 transition block py-2">
                Services
              </a>
              <a href="#about" className="text-gray-700 hover:text-blue-600 transition block py-2">
                About
              </a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 transition block py-2">
                Contact
              </a>
              <div className="flex flex-col gap-2 mt-2 border-t pt-2">
                {!user ? (
                  <>
                    <Link
                      to="/login"
                      className="px-4 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition border border-blue-600 text-center"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition text-center"
                    >
                      Register
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-gray-700 py-2">
                      Hi, <strong>{user.name}</strong>
                    </p>
                    {isDriver && (
                      <Link
                        to="/driver"
                        className="px-4 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition text-center"
                      >
                        Driver Dashboard
                      </Link>
                    )}
                    {isWorker && (
                      <Link
                        to="/worker"
                        className="px-4 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition text-center"
                      >
                        Worker Dashboard
                      </Link>
                    )}
                    {isEmployee && (
                      <Link
                        to="/attendance"
                        className="px-4 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition text-center"
                      >
                        Attendance
                      </Link>
                    )}
                    {isOutletAdmin && (
                      <Link
                        to="/attendance/report"
                        className="px-4 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition text-center"
                      >
                        Attendance Report
                      </Link>
                    )}
                    {isOutletAdmin && (
                      <Link
                        to="/admin/orders/waiting-payment"
                        className="px-4 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition text-center"
                      >
                        Waiting Payment
                      </Link>
                    )}
                    <Link
                      to="/profile"
                      className="px-4 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition text-center"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition"
                    >
                      Logout
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
