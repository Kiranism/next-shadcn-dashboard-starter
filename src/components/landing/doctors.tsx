'use client';

import { ChevronLeft, ChevronRight, Hospital } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Hospitals() {
  const [currentIndex, setCurrentIndex] = useState(2);

  const hospitals = [
    { name: 'Aga Khan University Hospital', location: 'Karachi', icon: '🏥' },
    {
      name: 'Shaukat Khanum Memorial Cancer Hospital',
      location: 'Lahore',
      icon: '🏥'
    },
    { name: 'Indus Hospital', location: 'Karachi', icon: '🏥', featured: true },
    { name: 'Shifa International Hospital', location: 'Islamabad', icon: '🏥' },
    { name: 'Liaquat National Hospital', location: 'Karachi', icon: '🏥' }
  ];

  // Auto-play carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % hospitals.length);
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [hospitals.length]);

  return (
    <section className='w-full bg-gray-50 py-12 sm:py-16 lg:py-20'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='mb-8 space-y-2 text-center sm:mb-12 lg:mb-16'>
          <h2 className='px-4 text-2xl font-bold text-gray-900 sm:text-3xl md:text-4xl'>
            Partner Hospitals Across Pakistan
          </h2>
          <p className='px-4 text-xs text-gray-500 sm:text-sm'>
            Connecting you with leading healthcare institutions nationwide
          </p>
        </div>

        {/* Hospitals Carousel */}
        <div className='relative py-4 sm:py-6 lg:py-8'>
          <div className='flex items-center justify-center gap-2 sm:gap-4'>
            <button
              onClick={() =>
                setCurrentIndex(
                  (prev) => (prev - 1 + hospitals.length) % hospitals.length
                )
              }
              className='z-20 flex-shrink-0 rounded-full p-1.5 transition-colors hover:bg-gray-200 sm:p-2'
            >
              <ChevronLeft size={20} className='text-gray-700 sm:h-6 sm:w-6' />
            </button>

            <div className='flex max-w-full items-center justify-center gap-3 overflow-hidden px-2 sm:gap-4 lg:gap-6'>
              {hospitals.map((hospital, idx) => {
                const isCenter = idx === currentIndex;
                const distanceFromCenter = Math.abs(idx - currentIndex);

                // Responsive visibility logic:
                // Mobile (< 640px): Show only center card and 1 on each side (3 total)
                // Tablet (640px - 1023px): Show center card and 1 on each side (3 total)
                // Desktop (>= 1024px): Show all 5 cards
                const isMobileVisible = distanceFromCenter <= 1;
                const isDesktopVisible = distanceFromCenter <= 2;

                return (
                  <div
                    key={idx}
                    className={`transition-all duration-500 ease-in-out ${
                      isCenter
                        ? 'z-10 scale-100 opacity-100 lg:scale-110'
                        : 'scale-75 opacity-50 lg:scale-90'
                    } ${!isMobileVisible && 'hidden lg:block'} ${!isDesktopVisible && 'hidden'}`}
                  >
                    <div
                      className={`flex h-40 w-32 flex-col items-center justify-center rounded-xl p-3 text-center sm:h-44 sm:w-36 sm:rounded-2xl sm:p-4 md:h-48 md:w-40 md:p-5 lg:h-56 lg:w-48 lg:p-6 ${
                        isCenter
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-2xl'
                          : 'bg-white shadow-md'
                      }`}
                    >
                      <div
                        className={`mb-2 flex h-10 w-10 items-center justify-center rounded-full sm:mb-3 sm:h-12 sm:w-12 md:mb-4 md:h-14 md:w-14 lg:h-16 lg:w-16 ${
                          isCenter ? 'bg-white/20' : 'bg-purple-50'
                        }`}
                      >
                        <Hospital
                          size={20}
                          className={`${isCenter ? 'text-white' : 'text-purple-600'} sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8`}
                        />
                      </div>
                      <h3
                        className={`mb-1 px-1 text-[10px] leading-tight font-bold sm:mb-1.5 sm:text-xs md:mb-2 md:text-sm lg:text-base ${isCenter ? 'text-white' : 'text-gray-900'}`}
                      >
                        {hospital.name}
                      </h3>
                      <p
                        className={`text-[9px] sm:text-[10px] md:text-xs lg:text-sm ${isCenter ? 'text-purple-100' : 'text-gray-500'}`}
                      >
                        {hospital.location}
                      </p>
                      <div className='mt-2 flex gap-0.5 sm:mt-3 sm:gap-1 lg:mt-4'>
                        <div
                          className={`h-1 w-1 rounded-full sm:h-1.5 sm:w-1.5 md:h-2 md:w-2 ${isCenter ? 'bg-white' : 'bg-gray-300'}`}
                        ></div>
                        <div
                          className={`h-1 w-1 rounded-full sm:h-1.5 sm:w-1.5 md:h-2 md:w-2 ${isCenter ? 'bg-white' : 'bg-gray-300'}`}
                        ></div>
                        <div
                          className={`h-1 w-1 rounded-full sm:h-1.5 sm:w-1.5 md:h-2 md:w-2 ${isCenter ? 'bg-white' : 'bg-gray-300'}`}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() =>
                setCurrentIndex((prev) => (prev + 1) % hospitals.length)
              }
              className='z-20 flex-shrink-0 rounded-full p-1.5 transition-colors hover:bg-gray-200 sm:p-2'
            >
              <ChevronRight size={20} className='text-gray-700 sm:h-6 sm:w-6' />
            </button>
          </div>

          {/* Indicator Dots */}
          <div className='mt-6 flex justify-center gap-1.5 sm:mt-8 sm:gap-2'>
            {hospitals.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 w-1.5 rounded-full transition-all sm:h-2 sm:w-2 ${
                  idx === currentIndex
                    ? 'w-4 bg-purple-600 sm:w-6'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
