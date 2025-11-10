'use client';

import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className='fixed top-0 right-0 left-0 z-50 border-b border-white/20 bg-white/70 shadow-sm backdrop-blur-md'>
      {/* Glossy overlay effect */}
      <div className='pointer-events-none absolute inset-0 bg-gradient-to-r from-purple-50/50 via-pink-50/30 to-purple-50/50'></div>

      <div className='relative mx-auto max-w-7xl px-3 sm:px-4 lg:px-8'>
        <div className='flex h-14 items-center justify-between sm:h-16'>
          {/* Logo */}
          <div className='flex items-center gap-1.5 sm:gap-2'>
            <div className='h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg sm:h-8 sm:w-8'></div>
            <span className='text-base font-bold text-gray-900 sm:text-xl'>
              SehatYarr
            </span>
          </div>

          {/* Navigation */}
          <nav className='hidden gap-8 md:flex'>
            <a
              href='#home'
              className='text-sm font-medium text-gray-700 transition-colors hover:text-purple-600'
            >
              Home
            </a>
            <a
              href='#about'
              className='text-sm font-medium text-gray-700 transition-colors hover:text-purple-600'
            >
              About
            </a>
            <a
              href='#services'
              className='text-sm font-medium text-gray-700 transition-colors hover:text-purple-600'
            >
              Services
            </a>
            <a
              href='#blog'
              className='text-sm font-medium text-gray-700 transition-colors hover:text-purple-600'
            >
              Blog
            </a>
          </nav>

          {/* Right side - CTA Buttons */}
          <div className='hidden items-center gap-3 md:flex'>
            <button className='px-5 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-purple-600'>
              Contact Us
            </button>
            <Link
              href='/auth/sign-up'
              className='rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2 text-sm font-medium text-white shadow-lg transition-all hover:from-purple-700 hover:to-pink-700 hover:shadow-xl'
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className='rounded-lg p-2 text-gray-900 transition-colors hover:bg-gray-100 md:hidden'
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className='absolute top-16 right-0 left-0 border-b border-white/20 bg-white/90 shadow-lg backdrop-blur-lg md:hidden'>
            <nav className='flex flex-col space-y-3 p-4'>
              <a
                href='#home'
                className='py-2 text-sm font-medium text-gray-700 transition-colors hover:text-purple-600'
              >
                Home
              </a>
              <a
                href='#about'
                className='py-2 text-sm font-medium text-gray-700 transition-colors hover:text-purple-600'
              >
                About
              </a>
              <a
                href='#services'
                className='py-2 text-sm font-medium text-gray-700 transition-colors hover:text-purple-600'
              >
                Services
              </a>
              <a
                href='#blog'
                className='py-2 text-sm font-medium text-gray-700 transition-colors hover:text-purple-600'
              >
                Blog
              </a>
              <div className='space-y-2 border-t border-gray-200 pt-3'>
                <button className='w-full rounded-lg px-5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100'>
                  Contact Us
                </button>
                <Link
                  href='/auth/sign-up'
                  className='block w-full rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2 text-center text-sm font-medium text-white shadow-lg transition-all hover:from-purple-700 hover:to-pink-700'
                >
                  Get Started
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
