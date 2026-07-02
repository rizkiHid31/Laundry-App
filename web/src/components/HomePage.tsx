import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import Hero from './Hero';
import Footer from './Footer';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStartOrder = () => {
    if (user) {
      navigate('/customer/orders/new');
    } else {
      navigate('/register');
    }
  };
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <section id="services" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-gray-600 text-lg sm:text-xl">
              From laundry pickup to doorstep delivery in <span className="font-bold text-blue-600">just 3 simple steps</span>
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 h-full hover:shadow-lg transition transform hover:scale-105">
                <div className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                  1️⃣
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Schedule Pickup
                </h3>
                <p className="text-gray-700 mb-4">
                  Choose your laundry, select a convenient pickup time, and we'll arrive at your door.
                </p>
                <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold">
                  <span>⏰ Takes 2 minutes</span>
                </div>
              </div>
              {/* Arrow */}
              <div className="hidden lg:flex absolute -right-4 top-1/2 transform -translate-y-1/2">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 h-full hover:shadow-lg transition transform hover:scale-105">
                <div className="w-14 h-14 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                  2️⃣
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Professional Cleaning
                </h3>
                <p className="text-gray-700 mb-4">
                  Your clothes are carefully cleaned at our nearby outlet using premium products.
                </p>
                <div className="flex items-center gap-2 text-sm text-purple-600 font-semibold">
                  <span>✨ Expert care</span>
                </div>
              </div>
              <div className="hidden lg:flex absolute -right-4 top-1/2 transform -translate-y-1/2">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 h-full hover:shadow-lg transition transform hover:scale-105">
                <div className="w-14 h-14 bg-orange-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                  3️⃣
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Track Progress
                </h3>
                <p className="text-gray-700 mb-4">
                  Monitor your order with real-time status updates from processing to delivery.
                </p>
                <div className="flex items-center gap-2 text-sm text-orange-600 font-semibold">
                  <span>📍 Real-time tracking</span>
                </div>
              </div>
              <div className="hidden lg:flex absolute -right-4 top-1/2 transform -translate-y-1/2">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            <div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 h-full hover:shadow-lg transition transform hover:scale-105">
                <div className="w-14 h-14 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                  4️⃣
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Fast Delivery
                </h3>
                <p className="text-gray-700 mb-4">
                  Your fresh, perfectly cleaned clothes delivered straight to your door.
                </p>
                <div className="flex items-center gap-2 text-sm text-green-600 font-semibold">
                  <span>🚚 As fast as next day</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Why Choose Us?
            </h2>
            <p className="text-gray-600 text-lg sm:text-xl">
              The most trusted laundry service in your area
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: '🏆', title: 'Trusted by 10,000+', desc: 'Happy customers choosing us every day' },
              { icon: '⚡', title: 'Lightning Fast', desc: 'Express service ready in as fast as 24 hours' },
              { icon: '💚', title: 'Eco-Friendly', desc: 'We care for your clothes and the environment' },
              { icon: '🎯', title: 'Quality Guaranteed', desc: '100% satisfaction or your money back' },
              { icon: '📱', title: 'Real-time Tracking', desc: 'Know exactly where your laundry is' },
              { icon: '💰', title: 'Transparent Pricing', desc: 'No hidden charges, pay only what you use' },
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition">
                <div className="text-5xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Simple & Transparent Pricing
            </h2>
            <p className="text-gray-600 text-lg sm:text-xl">
              Pay only for what you use, no hidden fees
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Regular Plan */}
            <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">👔</span>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Regular</h3>
                  <p className="text-gray-600 text-sm">Standard cleaning</p>
                </div>
              </div>
              <p className="text-4xl font-bold text-blue-600 mb-2">
                Rp 5<span className="text-lg text-gray-600">k/kg</span>
              </p>
              <p className="text-sm text-gray-600 mb-6">Turnaround: 3-4 days</p>
              <ul className="space-y-3 mb-8">
                {['Washing & Drying', 'Free Pickup & Delivery', 'Premium Care'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-700">
                    <span className="text-green-500 font-bold">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button className="w-full px-4 py-3 border-2 border-blue-600 text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition">
                Get Started
              </button>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition border-2 border-blue-400 p-8 relative transform lg:scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold">⭐ MOST POPULAR</span>
              </div>
              <div className="flex items-center gap-3 mb-4 mt-2">
                <span className="text-4xl">⚡</span>
                <div>
                  <h3 className="text-2xl font-bold">Express</h3>
                  <p className="text-blue-100 text-sm">Quick turnaround</p>
                </div>
              </div>
              <p className="text-4xl font-bold mb-2">
                Rp 7.5<span className="text-lg text-blue-100">k/kg</span>
              </p>
              <p className="text-sm text-blue-100 mb-6">Turnaround: 24 hours</p>
              <ul className="space-y-3 mb-8">
                {['Everything in Regular', 'Iron & Fold Included', 'Priority Processing'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-yellow-300 font-bold">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button className="w-full px-4 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition">
                Choose Express
              </button>
            </div>
            <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">✨</span>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Premium</h3>
                  <p className="text-gray-600 text-sm">Luxury care</p>
                </div>
              </div>
              <p className="text-4xl font-bold text-purple-600 mb-2">
                Rp 10<span className="text-lg text-gray-600">k/kg</span>
              </p>
              <p className="text-sm text-gray-600 mb-6">Turnaround: 48 hours</p>
              <ul className="space-y-3 mb-8">
                {['Professional Ironing', 'Delicate Hand Care', 'Same-day Pressing'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-700">
                    <span className="text-purple-500 font-bold">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button className="w-full px-4 py-3 border-2 border-purple-600 text-purple-600 font-bold rounded-lg hover:bg-purple-50 transition">
                Choose Premium
              </button>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Laundry Experience?
          </h2>
          <p className="text-blue-100 text-lg sm:text-xl mb-8">
            Join thousands of happy customers and get your first order processed within 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleStartOrder}
              className="px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition text-lg"
            >
              Get Started Now
            </button>
            <button
              onClick={() => window.location.hash = '#services'}
              className="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition text-lg"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
