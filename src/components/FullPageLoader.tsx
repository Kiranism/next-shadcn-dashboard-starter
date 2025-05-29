'use client';

import Image from 'next/image';
import React from 'react';

interface FullPageLoaderProps {
  message?: string;
}

const FullPageLoader: React.FC<FullPageLoaderProps> = ({
  message = 'Please wait...'
}) => {
  return (
    <div className='bg-opacity-90 fixed inset-0 z-50 flex flex-col items-center justify-center bg-white'>
      <div className='flex flex-col items-center justify-center space-y-6'>
        {/* Logo */}
        {/* <div className='relative mb-4 h-12 w-32'>
          <Image
            src='/images/logo.png'
            alt='Yes Jobs Logo'
            fill
            className='object-contain'
            priority
          />
        </div> */}

        {/* Spinner */}
        <div className='relative'>
          <div className='h-16 w-16 rounded-full border-4 border-orange-100'></div>
          <div className='absolute top-0 h-16 w-16 animate-spin rounded-full border-4 border-blue-100 border-t-transparent'></div>
        </div>

        {/* Message */}
        <p className='text-lg font-medium text-gray-700'>{message}</p>
      </div>
    </div>
  );
};

export default FullPageLoader;
