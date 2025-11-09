'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Testimonial() {
  return (
    <section className='w-full bg-gray-50 py-20'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <div className='grid grid-cols-1 items-center gap-12 md:grid-cols-2'>
          {/* Testimonial Text */}
          <div className='space-y-4'>
            <p className='leading-relaxed text-gray-600'>
              &dquo;I couldn&apos;t have asked for better care. From the moment
              I walked in, the staff was welcoming and attentive. They answered
              all my concerns, explain my options, and guide me through every
              step of my treatment.&dquo;
            </p>
            <p className='font-semibold text-gray-900'>— Patient Name</p>

            {/* Navigation */}
            <div className='flex gap-4 pt-4'>
              <button className='rounded-full border border-gray-300 p-2 transition hover:bg-gray-100'>
                <ChevronLeft size={20} className='text-gray-600' />
              </button>
              <button className='rounded-full border border-gray-300 p-2 transition hover:bg-gray-100'>
                <ChevronRight size={20} className='text-gray-600' />
              </button>
            </div>
          </div>

          {/* Testimonial Image */}
          <div className='flex justify-end'>
            <div className='flex h-80 w-64 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 shadow-lg'>
              <div className='text-center'>
                <div className='mx-auto mb-4 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 opacity-30'></div>
                <p className='text-sm text-gray-400'>Testimonial Image</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
