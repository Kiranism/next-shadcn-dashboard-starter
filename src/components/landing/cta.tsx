'use client';

import { Users, Link2, CheckSquare, Target, BarChart3 } from 'lucide-react';

export default function CTA() {
  return (
    <section className='w-full bg-white py-12 sm:py-16 lg:py-20'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        {/* Heading */}
        <div className='mb-8 text-center sm:mb-12 lg:mb-16'>
          <h2 className='mb-2 px-4 text-2xl font-bold text-gray-900 sm:mb-3 sm:text-3xl md:text-4xl'>
            Join our community of 120,000+ businesses
          </h2>
          <p className='px-4 text-xs text-gray-500 sm:text-sm'>
            Trusted by healthcare providers worldwide
          </p>
        </div>

        {/* Icons Grid */}
        <div className='flex flex-wrap items-center justify-center gap-8 sm:gap-12 md:gap-16 lg:gap-20'>
          {/* Expert */}
          <div className='flex flex-col items-center gap-2 sm:gap-3'>
            <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 sm:h-14 sm:w-14'>
              <Users className='h-6 w-6 text-purple-600 sm:h-7 sm:w-7' />
            </div>
            <span className='text-xs font-medium text-gray-600 sm:text-sm'>
              Expert
            </span>
          </div>

          {/* Verified */}
          <div className='flex flex-col items-center gap-2 sm:gap-3'>
            <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 sm:h-14 sm:w-14'>
              <Link2 className='h-6 w-6 text-gray-500 sm:h-7 sm:w-7' />
            </div>
            <span className='text-xs font-medium text-gray-600 sm:text-sm'>
              Verified
            </span>
          </div>

          {/* Businesses */}
          <div className='flex flex-col items-center gap-2 sm:gap-3'>
            <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 sm:h-14 sm:w-14'>
              <CheckSquare className='h-6 w-6 text-green-600 sm:h-7 sm:w-7' />
            </div>
            <span className='text-xs font-medium text-gray-600 sm:text-sm'>
              Businesses
            </span>
          </div>

          {/* Growth */}
          <div className='flex flex-col items-center gap-2 sm:gap-3'>
            <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 sm:h-14 sm:w-14'>
              <Target className='h-6 w-6 text-red-600 sm:h-7 sm:w-7' />
            </div>
            <span className='text-xs font-medium text-gray-600 sm:text-sm'>
              Growth
            </span>
          </div>

          {/* Results */}
          <div className='flex flex-col items-center gap-2 sm:gap-3'>
            <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 sm:h-14 sm:w-14'>
              <BarChart3 className='h-6 w-6 text-blue-600 sm:h-7 sm:w-7' />
            </div>
            <span className='text-xs font-medium text-gray-600 sm:text-sm'>
              Results
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
