'use client';

import { Heart, Stethoscope, Zap, Bone, Activity } from 'lucide-react';

export default function Services() {
  const services = [
    {
      title: 'Primary Care',
      description: 'Comprehensive healthcare for all your basic medical needs',
      icon: Stethoscope,
      color: 'from-indigo-100 to-indigo-50'
    },
    {
      title: 'Pediatrics',
      description: 'Specialized care for children and infants',
      icon: Heart,
      color: 'from-purple-100 to-purple-50'
    },
    {
      title: 'Cardiology',
      description: 'Heart and cardiovascular disease treatment',
      icon: Heart,
      color: 'from-pink-100 to-pink-50'
    },
    {
      title: 'Orthopedics',
      description: 'Bone and joint care expertise',
      icon: Bone,
      color: 'from-indigo-100 to-indigo-50'
    },
    {
      title: 'Dermatology',
      description: 'Skin health and beauty treatments',
      icon: Activity,
      color: 'from-purple-100 to-purple-50'
    },
    {
      title: 'Physical Therapy',
      description: 'Rehabilitation and recovery services',
      icon: Zap,
      color: 'from-pink-100 to-pink-50'
    }
  ];

  return (
    <section className='w-full bg-gray-50 py-12 sm:py-16 lg:py-20'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='mb-8 space-y-2 text-center sm:mb-12 lg:mb-16'>
          <h2 className='text-2xl font-bold text-gray-900 sm:text-3xl md:text-4xl'>
            What medical service we offer
          </h2>
          <p className='mx-auto max-w-2xl px-4 text-xs text-gray-500 sm:text-sm'>
            From routine check-ups to specialized treatments, we provide
            comprehensive healthcare services tailored to your unique needs
          </p>
        </div>

        {/* Services Grid */}
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8'>
          {services.map((service, idx) => {
            const Icon = service.icon;
            return (
              <div
                key={idx}
                className='rounded-xl bg-white p-6 transition hover:shadow-lg sm:rounded-2xl sm:p-8'
              >
                <div
                  className={`h-10 w-10 bg-gradient-to-br sm:h-12 sm:w-12 ${service.color} mb-3 flex items-center justify-center rounded-lg sm:mb-4`}
                >
                  <Icon size={20} className='text-indigo-600 sm:h-6 sm:w-6' />
                </div>
                <h3 className='mb-1.5 text-lg font-bold text-gray-900 sm:mb-2 sm:text-xl'>
                  {service.title}
                </h3>
                <p className='text-xs text-gray-500 sm:text-sm'>
                  {service.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
