import Hero from './Hero';
import Footer from './Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Hero />
      
      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-4">
            How It Works
          </h2>
          <p className="text-gray-600 text-center text-base sm:text-lg mb-12 sm:mb-16">
            Simple, convenient, and hassle-free laundry service
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                Schedule Pickup
              </h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Request a pickup at your convenient time
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                Professional Cleaning
              </h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Expert care at our nearby outlet
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                Track Progress
              </h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Real-time updates on your order status
              </p>
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">4</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                Fast Delivery
              </h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Get your clothes delivered fresh to you
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-4">
            Simple Pricing
          </h2>
          <p className="text-gray-600 text-center text-base sm:text-lg mb-12 sm:mb-16">
            Transparent pricing with no hidden charges
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Basic Plan */}
            <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 hover:shadow-lg transition">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Regular</h3>
              <p className="text-gray-600 text-sm sm:text-base mb-4">Perfect for everyday laundry</p>
              <p className="text-3xl sm:text-4xl font-bold text-blue-600 mb-6">
                Rp 5k<span className="text-lg text-gray-600">/kg</span>
              </p>
              <ul className="space-y-3 mb-6 sm:mb-8 text-sm sm:text-base text-gray-700">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Washing & Drying
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Free Pickup & Delivery
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  3-4 Days Turnaround
                </li>
              </ul>
              <button className="w-full px-4 py-2 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition">
                Choose Plan
              </button>
            </div>

            {/* Premium Plan */}
            <div className="bg-blue-600 text-white rounded-lg shadow-lg p-6 sm:p-8 relative transform scale-105 sm:scale-100">
              <div className="absolute top-0 left-0 right-0 bg-yellow-400 text-gray-900 text-center py-1 rounded-t-lg text-xs sm:text-sm font-bold">
                MOST POPULAR
              </div>
              <div className="pt-6">
                <h3 className="text-xl sm:text-2xl font-bold mb-2">Express</h3>
                <p className="text-blue-100 text-sm sm:text-base mb-4">Quick turnaround guaranteed</p>
                <p className="text-3xl sm:text-4xl font-bold mb-6">
                  Rp 8k<span className="text-lg text-blue-200">/kg</span>
                </p>
                <ul className="space-y-3 mb-6 sm:mb-8 text-sm sm:text-base">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Everything in Regular
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Iron & Fold
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Next Day Delivery
                  </li>
                </ul>
                <button className="w-full px-4 py-2 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition">
                  Choose Plan
                </button>
              </div>
            </div>

            {/* Dry Cleaning Plan */}
            <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 hover:shadow-lg transition">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Dry Cleaning</h3>
              <p className="text-gray-600 text-sm sm:text-base mb-4">For delicate items</p>
              <p className="text-3xl sm:text-4xl font-bold text-blue-600 mb-6">
                Rp 12k<span className="text-lg text-gray-600">/kg</span>
              </p>
              <ul className="space-y-3 mb-6 sm:mb-8 text-sm sm:text-base text-gray-700">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Professional Dry Cleaning
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Gentle Care
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Free Pickup & Delivery
                </li>
              </ul>
              <button className="w-full px-4 py-2 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition">
                Choose Plan
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
