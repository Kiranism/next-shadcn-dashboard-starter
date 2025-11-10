'use client';

import { Send } from 'lucide-react';

export default function Footer() {
  return (
    <footer className='w-full bg-gray-900 py-10 text-white sm:py-12 lg:py-16'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        {/* Top Section */}
        <div className='mb-8 grid grid-cols-1 gap-6 border-b border-gray-800 pb-8 sm:mb-10 sm:grid-cols-2 sm:gap-8 sm:pb-10 md:grid-cols-5 lg:mb-12 lg:pb-12'>
          {/* Company Info */}
          <div className='md:col-span-1'>
            <div className='mb-3 flex items-center gap-1.5 sm:mb-4 sm:gap-2'>
              <div className='h-5 w-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 sm:h-6 sm:w-6'></div>
              <span className='text-lg font-bold sm:text-xl'>SehatYarr</span>
            </div>
            <p className='mb-4 text-xs text-gray-400 sm:mb-6 sm:text-sm'>
              Revolutionizing healthcare delivery with innovative solutions.
            </p>
            <div className='flex gap-2 sm:gap-3'>
              <button className='flex h-7 w-7 items-center justify-center rounded-lg bg-gray-800 text-xs hover:bg-gray-700 sm:h-8 sm:w-8 sm:text-sm'>
                f
              </button>
              <button className='flex h-7 w-7 items-center justify-center rounded-lg bg-gray-800 text-xs hover:bg-gray-700 sm:h-8 sm:w-8 sm:text-sm'>
                𝕏
              </button>
            </div>
          </div>

          {/* Links Columns */}
          {['Company', 'Features', 'Solutions', 'Resources'].map(
            (title, idx) => (
              <div key={idx}>
                <h3 className='mb-3 text-xs font-semibold text-white sm:mb-4 sm:text-sm'>
                  {title}
                </h3>
                <ul className='space-y-2 sm:space-y-3'>
                  <li>
                    <a
                      href='#'
                      className='text-xs text-gray-400 transition hover:text-white sm:text-sm'
                    >
                      Link One
                    </a>
                  </li>
                  <li>
                    <a
                      href='#'
                      className='text-xs text-gray-400 transition hover:text-white sm:text-sm'
                    >
                      Link Two
                    </a>
                  </li>
                  <li>
                    <a
                      href='#'
                      className='text-xs text-gray-400 transition hover:text-white sm:text-sm'
                    >
                      Link Three
                    </a>
                  </li>
                  <li>
                    <a
                      href='#'
                      className='text-xs text-gray-400 transition hover:text-white sm:text-sm'
                    >
                      Link Four
                    </a>
                  </li>
                </ul>
              </div>
            )
          )}
        </div>

        {/* Bottom Section */}
        <div className='grid grid-cols-1 items-start gap-6 sm:gap-8 md:grid-cols-2 md:items-center'>
          {/* Subscribe */}
          <div>
            <p className='mb-2 text-xs text-gray-400 sm:mb-0 sm:text-sm'>
              Subscribe our newsletter for new updates
            </p>
            <div className='mt-2 flex gap-1.5 rounded-lg bg-gray-800 p-1 sm:mt-3 sm:gap-2'>
              <input
                type='email'
                placeholder='Enter your email'
                className='min-w-0 flex-1 bg-transparent px-2 py-1.5 text-xs text-white outline-none sm:px-3 sm:py-2 sm:text-sm'
              />
              <button className='flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-white transition hover:bg-indigo-700 sm:gap-2 sm:px-4 sm:py-2'>
                <Send size={14} className='sm:h-4 sm:w-4' />
              </button>
            </div>
          </div>

          {/* App Links */}
          <div className='flex flex-col gap-2 sm:flex-row sm:gap-3 md:justify-end'>
            <button className='flex items-center justify-center gap-1.5 rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-300 transition hover:bg-gray-800 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm'>
              <span>🍎</span> App Store
            </button>
            <button className='flex items-center justify-center gap-1.5 rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-300 transition hover:bg-gray-800 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm'>
              <span>▶</span> Play Store
            </button>
          </div>
        </div>

        {/* Social Icons */}
        <div className='mt-6 flex justify-center gap-1.5 border-t border-gray-800 pt-6 sm:mt-8 sm:justify-end sm:gap-2 sm:pt-8'>
          <div className='h-5 w-5 rounded-full bg-indigo-600 sm:h-6 sm:w-6'></div>
          <div className='h-5 w-5 rounded-full bg-indigo-600 sm:h-6 sm:w-6'></div>
          <div className='h-5 w-5 rounded-full bg-gray-700 sm:h-6 sm:w-6'></div>
        </div>
      </div>
    </footer>
  );
}
