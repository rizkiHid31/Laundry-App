import { useState, useEffect } from 'react';

interface CarouselItem {
  id: number;
  title: string;
  description: string;
  image: string;
  cta: string;
}

const carouselItems: CarouselItem[] = [
  {
    id: 1,
    title: 'Laundry Made Easy',
    description: 'Get your clothes picked up, cleaned, and delivered right to your door',
    image: 'https://images.unsplash.com/photo-1582735338319-4dee731bb33d?w=800&h=400&fit=crop',
    cta: 'Get Started',
  },
  {
    id: 2,
    title: 'Fast & Reliable',
    description: 'Professional laundry service with our network of trusted outlets',
    image: 'https://images.unsplash.com/photo-1545882546-d385894a1b02?w=800&h=400&fit=crop',
    cta: 'Learn More',
  },
  {
    id: 3,
    title: 'Affordable Rates',
    description: 'Competitive pricing with transparent billing and no hidden charges',
    image: 'https://images.unsplash.com/photo-1574553988590-8c20b3b7e0db?w=800&h=400&fit=crop',
    cta: 'View Prices',
  },
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  useEffect(() => {
    if (!isAutoPlay) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlay]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlay(false);
    setTimeout(() => setIsAutoPlay(true), 10000);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) =>
      prev === 0 ? carouselItems.length - 1 : prev - 1
    );
    setIsAutoPlay(false);
    setTimeout(() => setIsAutoPlay(true), 10000);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
    setIsAutoPlay(false);
    setTimeout(() => setIsAutoPlay(true), 10000);
  };

  return (
    <section id="home" className="mt-16 sm:mt-20 overflow-hidden bg-gray-50">
      {/* Carousel Container */}
      <div className="relative w-full h-96 sm:h-[500px] bg-black">
        {/* Slides */}
        {carouselItems.map((item, index) => (
          <div
            key={item.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url('${item.image}')`,
              }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            </div>

            {/* Content */}
            <div className="relative h-full flex items-center justify-center px-4">
              <div className="text-center max-w-2xl">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                  {item.title}
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-gray-100 mb-6 sm:mb-8">
                  {item.description}
                </p>
                <button className="px-6 sm:px-8 py-2 sm:py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition text-sm sm:text-base">
                  {item.cta}
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Previous Button */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white bg-opacity-30 hover:bg-opacity-50 rounded-full transition"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Next Button */}
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white bg-opacity-30 hover:bg-opacity-50 rounded-full transition"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {carouselItems.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition ${
                index === currentSlide ? 'bg-blue-500 w-8 sm:w-10' : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 text-center">
        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
          Why Choose LaundryApp?
        </h3>
        <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto mb-8 sm:mb-12">
          Enjoy convenient, professional laundry service with pickup and delivery to your doorstep
        </p>
        <button className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition text-base">
          Start Your Order Now
        </button>
      </div>
    </section>
  );
}
