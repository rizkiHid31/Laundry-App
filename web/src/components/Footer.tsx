export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-4">LaundryApp</h3>
            <p className="text-sm sm:text-base text-gray-400">
              Your trusted laundry service partner. Quality cleaning, convenient delivery.
            </p>
            <div className="flex gap-4 mt-4">
              <a href="#" className="hover:text-blue-500 transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a href="#" className="hover:text-blue-500 transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 7-7 7-7" />
                </svg>
              </a>
              <a href="#" className="hover:text-blue-500 transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16.5 7.5C16.5 9.71 14.71 11.5 12.5 11.5C10.29 11.5 8.5 9.71 8.5 7.5C8.5 5.29 10.29 3.5 12.5 3.5C14.71 3.5 16.5 5.29 16.5 7.5Z" fill="#000" />
                  <circle cx="17" cy="7" r="1.5" fill="#000" />
                  <path d="M12.5 20C15.81 20 18.82 18.66 20.89 16.42M20.89 16.42C21.6 15.57 22.17 14.61 22.57 13.55M20.89 16.42C19.36 18.13 17.21 19.17 14.81 19.17C11.23 19.17 8.18 16.62 7.59 13.24" fill="#000" />
                </svg>
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm sm:text-base">Services</h4>
            <ul className="space-y-2 text-sm sm:text-base">
              <li>
                <a href="#" className="text-gray-400 hover:text-blue-500 transition">
                  Regular Laundry
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-blue-500 transition">
                  Dry Cleaning
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-blue-500 transition">
                  Ironing Service
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-blue-500 transition">
                  Express Service
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm sm:text-base">Company</h4>
            <ul className="space-y-2 text-sm sm:text-base">
              <li>
                <a href="#about" className="text-gray-400 hover:text-blue-500 transition">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-blue-500 transition">
                  Locations
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-blue-500 transition">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-blue-500 transition">
                  Blog
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm sm:text-base">Support</h4>
            <ul className="space-y-2 text-sm sm:text-base">
              <li>
                <a href="#contact" className="text-gray-400 hover:text-blue-500 transition">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-blue-500 transition">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-blue-500 transition">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-blue-500 transition">
                  Terms & Conditions
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 sm:mt-12 pt-8 sm:pt-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-0">
            {/* Copyright */}
            <div className="text-center sm:text-left text-sm text-gray-400">
              <p>&copy; 2026 LaundryApp. All rights reserved.</p>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-xs sm:text-sm text-gray-400 mb-2">Accepted Payment Methods</p>
              <div className="flex justify-center sm:justify-end gap-3">
                <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-300">Credit Card</span>
                <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-300">E-Wallet</span>
                <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-300">Bank Transfer</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
