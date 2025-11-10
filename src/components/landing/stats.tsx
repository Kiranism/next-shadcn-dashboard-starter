'use client';

export default function Stats() {
  const stats = [
    { number: '30M+', label: 'Patients Served' },
    { number: '30%', label: 'Growth Rate' },
    { number: '$100M', label: 'Revenue' },
    { number: '60+', label: 'Countries' }
  ];

  return (
    <section className='w-full bg-white py-10 sm:py-12 lg:py-16'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4 lg:gap-8'>
          {stats.map((stat, idx) => (
            <div key={idx} className='text-center'>
              <h3 className='mb-1.5 text-2xl font-bold text-gray-900 sm:mb-2 sm:text-3xl md:text-4xl'>
                {stat.number}
              </h3>
              <p className='text-xs text-gray-500 sm:text-sm'>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
