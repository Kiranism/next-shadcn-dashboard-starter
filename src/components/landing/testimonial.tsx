'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function Testimonial() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      text: "I couldn't have asked for better care. From the moment I walked in, the staff was welcoming and attentive. They answered all my concerns, explained my options, and guided me through every step of my treatment.",
      name: 'Fahad',
      role: 'Patient',
      color: 'from-indigo-400 to-purple-500',
      image: '/assets/testimonials/AI.webp' // Using AI image as placeholder
    },
    {
      text: "As a healthcare professional, I'm impressed by SehatYarr's comprehensive platform. It streamlines patient management and allows me to focus more on providing quality care rather than administrative tasks.",
      name: 'Dr. Ahmad',
      role: 'Cardiologist',
      color: 'from-purple-400 to-pink-500',
      image: '/assets/testimonials/Ahmad.webp'
    },
    {
      text: 'The online consultation feature was a game-changer for me. I could connect with top specialists from the comfort of my home. The entire process was smooth, professional, and incredibly convenient.',
      name: 'Bilal',
      role: 'Patient',
      color: 'from-blue-400 to-indigo-500',
      image: '/assets/testimonials/bilal.webp'
    },
    {
      text: "SehatYarr has revolutionized how I practice medicine. The integrated system helps me track patient history, schedule appointments efficiently, and provide better continuity of care. It's an invaluable tool.",
      name: 'Dr. Umair',
      role: 'General Physician',
      color: 'from-pink-400 to-red-500',
      image: '/assets/testimonials/umair.webp'
    },
    {
      text: 'Finding the right specialist was always challenging until I discovered SehatYarr. The platform made it easy to compare doctors, read reviews, and book appointments. My experience has been exceptional.',
      name: 'Abdullah',
      role: 'Patient',
      color: 'from-teal-400 to-cyan-500',
      image: '/assets/testimonials/abdullah.webp'
    },
    {
      text: 'The telemedicine features and patient engagement tools on SehatYarr have transformed my practice. I can now reach more patients and provide timely consultations, especially for follow-ups and routine check-ins.',
      name: 'Dr. Athar',
      role: 'Orthopedic Surgeon',
      color: 'from-violet-400 to-purple-500',
      image: '/assets/testimonials/athar.webp'
    }
  ];

  // Auto-play carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const handlePrevious = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className='w-full bg-gray-50 py-12 sm:py-16 lg:py-20'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <div className='mb-8 text-center sm:mb-10 lg:mb-12'>
          <h2 className='mb-2 text-2xl font-bold text-gray-900 sm:text-3xl md:text-4xl'>
            What Our Community Says
          </h2>
          <p className='text-xs text-gray-500 sm:text-sm'>
            Real experiences from patients and healthcare professionals
          </p>
        </div>

        <div className='grid grid-cols-1 items-center gap-8 sm:gap-10 md:grid-cols-2 lg:gap-12'>
          {/* Testimonial Text */}
          <div className='space-y-3 sm:space-y-4'>
            <p className='min-h-[120px] text-sm leading-relaxed text-gray-600 sm:min-h-[140px] sm:text-base'>
              &ldquo;{currentTestimonial.text}&rdquo;
            </p>
            <div>
              <p className='text-sm font-semibold text-gray-900 sm:text-base'>
                — {currentTestimonial.name}
              </p>
              <p className='text-xs text-gray-500 sm:text-sm'>
                {currentTestimonial.role}
              </p>
            </div>

            {/* Navigation */}
            <div className='flex items-center gap-3 pt-2 sm:gap-4 sm:pt-4'>
              <button
                onClick={handlePrevious}
                className='rounded-full border border-gray-300 p-1.5 transition hover:bg-gray-100 sm:p-2'
              >
                <ChevronLeft
                  size={18}
                  className='text-gray-600 sm:h-5 sm:w-5'
                />
              </button>
              <button
                onClick={handleNext}
                className='rounded-full border border-gray-300 p-1.5 transition hover:bg-gray-100 sm:p-2'
              >
                <ChevronRight
                  size={18}
                  className='text-gray-600 sm:h-5 sm:w-5'
                />
              </button>

              {/* Indicator Dots */}
              <div className='ml-2 flex gap-1.5 sm:gap-2'>
                {testimonials.map((_, idx) => (
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

          {/* Testimonial Image */}
          <div className='flex justify-center md:justify-end'>
            <div className='relative flex h-64 w-56 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 shadow-lg sm:h-80 sm:w-64 sm:rounded-2xl'>
              {/* Background Image */}
              <div className='absolute inset-0'>
                <Image
                  src={currentTestimonial.image}
                  alt={currentTestimonial.name}
                  fill
                  className='object-cover'
                  sizes='(max-width: 640px) 224px, 256px'
                />
                {/* Overlay gradient */}
                <div className='absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/40 to-transparent'></div>
              </div>

              {/* Content overlay */}
              <div className='absolute right-0 bottom-0 left-0 z-10 p-4 text-center sm:p-6'>
                <p className='text-sm font-semibold text-white drop-shadow-lg sm:text-base'>
                  {currentTestimonial.name}
                </p>
                <p className='text-xs text-gray-200 drop-shadow sm:text-sm'>
                  {currentTestimonial.role}
                </p>
              </div>

              {/* Decorative background circles */}
              <div className='absolute top-0 right-0 h-32 w-32 rounded-full bg-purple-300/20 blur-2xl'></div>
              <div className='absolute bottom-0 left-0 h-24 w-24 rounded-full bg-pink-300/20 blur-2xl'></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
