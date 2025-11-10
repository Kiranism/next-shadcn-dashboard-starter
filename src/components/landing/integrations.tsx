'use client';

import { Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Integrations() {
  const icons = ['⭐', '❤️', '🔧', '📱', '💻', '🎯', '📊', '⚡', '🔐', '🌐'];
  const [radius, setRadius] = useState(140);

  useEffect(() => {
    const updateRadius = () => {
      if (window.innerWidth < 640) {
        setRadius(100);
      } else if (window.innerWidth < 1024) {
        setRadius(120);
      } else {
        setRadius(140);
      }
    };

    updateRadius();
    window.addEventListener('resize', updateRadius);
    return () => window.removeEventListener('resize', updateRadius);
  }, []);

  return (
    <section className='w-full bg-white py-12 sm:py-16 lg:py-20'>
      <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
        <div className='mb-8 space-y-2 text-center sm:mb-12 lg:mb-16'>
          <h2 className='px-4 text-2xl font-bold text-gray-900 sm:text-3xl md:text-4xl'>
            Optimize Your Workflow with 50+ Medical System Integrations
          </h2>
          <p className='px-4 text-xs text-gray-500 sm:text-sm'>
            Seamlessly connect with your existing tools and platforms
          </p>
        </div>

        {/* Integration Network */}
        <div className='relative flex h-64 items-center justify-center sm:h-72 lg:h-80'>
          {/* Center Circle */}
          <div className='absolute z-10 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg sm:h-24 sm:w-24'>
            <Zap size={32} className='text-white sm:h-10 sm:w-10' />
          </div>

          {/* Orbiting Icons Container - Rotates */}
          <div className='absolute flex h-full w-full items-center justify-center'>
            <div className='relative h-[200px] w-[200px] animate-[spin_50s_linear_infinite] sm:h-[240px] sm:w-[240px] lg:h-[280px] lg:w-[280px]'>
              {icons.map((icon, idx) => {
                const angle = (idx / icons.length) * Math.PI * 2;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                return (
                  <div
                    key={idx}
                    className='absolute top-1/2 left-1/2 text-2xl sm:text-3xl lg:text-4xl'
                    style={{
                      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
                    }}
                  >
                    {icon}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
