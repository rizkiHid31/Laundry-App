import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Hero() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('Browser Anda belum mendukung fitur lokasi.');
      return;
    }

    const savedStatus = localStorage.getItem('homepageLocationStatus');
    if (savedStatus) {
      setLocationStatus(
        savedStatus === 'granted'
          ? 'Lokasi ditemukan. Kami dapat menampilkan layanan yang lebih cepat untuk Anda.'
          : 'Izin lokasi sebelumnya ditolak. Anda tetap bisa menggunakan layanan tanpa lokasi.',
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ latitude, longitude });
        setLocationStatus('Lokasi Anda berhasil ditemukan. Layanan dapat memberikan estimasi lebih cepat.');
        localStorage.setItem('homepageLocationStatus', 'granted');
      },
      () => {
        setLocationStatus('Izin lokasi ditolak atau tidak tersedia. Silakan lanjutkan tanpa lokasi.');
        localStorage.setItem('homepageLocationStatus', 'denied');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const handleStartOrder = () => {
    if (user) {
      navigate('/customer/orders/new');
    } else {
      navigate('/register');
    }
  };

  return (
    <section id="home" className="mt-16 sm:mt-20 overflow-hidden">
      {/* Hero Main Section with Gradient Background */}
      <div className="relative w-full min-h-[500px] sm:min-h-[600px] bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

        {/* Content Container */}
        <div className="relative h-full flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="max-w-4xl mx-auto text-center">
            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Laundry Made <span className="text-yellow-300">Easy</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl lg:text-2xl text-blue-50 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
              Get your clothes picked up, professionally cleaned, and delivered fresh to your door. Simple, convenient, and hassle-free.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
              <button
                onClick={handleStartOrder}
                className="px-8 sm:px-10 py-3 sm:py-4 bg-white text-blue-600 font-bold text-lg rounded-lg hover:bg-blue-50 transition transform hover:scale-105 shadow-lg"
              >
                Start Your Order Now
              </button>
              <a
                href="#services"
                className="px-8 sm:px-10 py-3 sm:py-4 border-2 border-white text-white font-bold text-lg rounded-lg hover:bg-white hover:text-blue-600 transition"
              >
                Learn More
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 sm:mt-16 flex flex-col sm:flex-row gap-6 sm:gap-8 justify-center text-white text-sm sm:text-base">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.381-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>4.8+ Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <span>10,000+ Happy Customers</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2h1a1 1 0 000-2h1a2 2 0 012 2v1a1 1 0 000 2H4a1 1 0 000-2V5zm0 4a1 1 0 100 2h10a1 1 0 100-2H4z" clipRule="evenodd" />
                </svg>
                <span>100% Professional Service</span>
              </div>
            </div>

            {locationStatus && (
              <div className="mt-8 mx-auto max-w-2xl rounded-2xl border border-white/30 bg-white/10 px-6 py-4 text-sm text-blue-100">
                {locationStatus}
                {coordinates && (
                  <div className="mt-2 text-xs text-blue-50 opacity-90">
                    Koordinat: {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Showcase (3 Cards) */}
      <div className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-6">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-8 text-center hover:shadow-lg transition transform hover:scale-105">
              <div className="text-5xl mb-4">🚚</div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Fast Pickup & Delivery</h3>
              <p className="text-gray-700">Same-day pickup and delivery available in your area</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-8 text-center hover:shadow-lg transition transform hover:scale-105">
              <div className="text-5xl mb-4">⏱️</div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Real-time Tracking</h3>
              <p className="text-gray-700">Track your order from pickup to delivery in real-time</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-8 text-center hover:shadow-lg transition transform hover:scale-105">
              <div className="text-5xl mb-4">💰</div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Transparent Pricing</h3>
              <p className="text-gray-700">No hidden charges, competitive rates for all services</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
