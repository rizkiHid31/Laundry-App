import { useState } from 'react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full bg-white shadow-md z-50">
      <div className="px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="shrink-0">
            <a href="/" className="text-xl sm:text-2xl font-bold text-blue-600">
              LaundryApp
            </a>
          </div>

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

          <div className="hidden md:flex gap-3">
            <button className="px-4 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition">
              Login
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition">
              Register
            </button>
          </div>

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
              <div className="flex gap-2 mt-2">
                <button className="flex-1 px-4 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition border border-blue-600">
                  Login
                </button>
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition">
                  Register
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
