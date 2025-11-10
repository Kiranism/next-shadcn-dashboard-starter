'use client';

import Image from 'next/image';

export default function Hero() {
  return (
    <section className='-mt-12 flex min-h-screen w-full items-center justify-center bg-white p-2 pt-16 sm:p-4 sm:pt-20 md:p-6'>
      {/* Main Container with gradient background and rounded corners */}
      <div className='relative min-h-[85vh] w-full overflow-hidden rounded-[20px] bg-gradient-to-br from-purple-200 via-pink-100 to-pink-200 sm:rounded-[30px] lg:rounded-[40px]'>
        {/* Decorative circles */}
        <div className='absolute top-1/4 left-1/3 h-32 w-32 rounded-full bg-purple-300/20 blur-3xl sm:h-48 sm:w-48 md:h-64 md:w-64'></div>
        <div className='absolute right-1/4 bottom-1/4 h-40 w-40 rounded-full bg-pink-300/15 blur-3xl sm:h-60 sm:w-60 md:h-80 md:w-80'></div>

        <div className='relative z-10 mx-auto flex h-full max-w-7xl items-center px-3 py-8 sm:px-6 sm:py-12 lg:px-12 lg:py-0'>
          <div className='grid w-full grid-cols-1 items-center gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-12'>
            {/* Left Content */}
            <div className='space-y-3 text-center sm:space-y-4 lg:text-left'>
              {/* Badge */}
              <div className='inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[9px] shadow-sm backdrop-blur-sm sm:gap-2 sm:px-3 sm:py-1.5 sm:text-[10px]'>
                <span className='font-semibold text-purple-600'>Trusted</span>
                <span className='text-gray-600'>
                  Best Medical Service in Town
                </span>
              </div>

              {/* Heading */}
              <h1 className='text-2xl leading-tight font-bold text-white sm:text-3xl md:text-4xl lg:text-5xl'>
                Personalized
                <br />
                Medical Services
                <br />
                for Better Health
              </h1>

              {/* Schedule Button */}
              <button className='mt-2 inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-4 py-2 text-xs text-white shadow-lg transition-colors hover:bg-gray-800 sm:mt-3 sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm'>
                <div className='flex h-6 w-6 items-center justify-center rounded-full bg-white sm:h-7 sm:w-7'>
                  <span className='text-sm font-bold text-gray-900 sm:text-base'>
                    +
                  </span>
                </div>
                <span className='font-medium'>Schedule an appointment</span>
              </button>

              {/* Patient Card */}
              <div className='mx-auto mt-3 max-w-xs rounded-xl bg-white/95 p-2.5 shadow-xl backdrop-blur-sm sm:mt-4 sm:rounded-2xl sm:p-3 lg:mx-0'>
                <div className='flex items-start gap-2 sm:gap-2.5'>
                  <Image
                    src='/assets/images/doctor1.png'
                    alt='Patient'
                    width={40}
                    height={40}
                    className='rounded-lg object-cover sm:h-[45px] sm:w-[45px]'
                  />
                  <div className='min-w-0 flex-1'>
                    <h3 className='mb-0 truncate text-[11px] font-bold text-gray-900 sm:text-xs'>
                      Mitochondrial Test
                    </h3>
                    <p className='mb-1 text-[8px] text-gray-500 sm:mb-1.5 sm:text-[9px]'>
                      Test
                    </p>

                    {/* Chart */}
                    <div className='mb-1 sm:mb-1.5'>
                      <div className='flex h-6 items-end gap-0.5 sm:h-8'>
                        {[16, 28, 20, 34, 24, 32, 22, 36, 12, 16, 14, 18].map(
                          (height, i) => (
                            <div
                              key={i}
                              className={`flex-1 rounded-t ${
                                i < 8 ? 'bg-purple-500' : 'bg-gray-300'
                              }`}
                              style={{ height: `${height * 0.75}px` }}
                            ></div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Avatar group and play button */}
                    <div className='flex items-center gap-1 sm:gap-1.5'>
                      <div className='flex -space-x-1'>
                        <div className='h-4 w-4 rounded-full border-2 border-white bg-purple-300 sm:h-5 sm:w-5'></div>
                        <div className='h-4 w-4 rounded-full border-2 border-white bg-pink-300 sm:h-5 sm:w-5'></div>
                        <div className='h-4 w-4 rounded-full border-2 border-white bg-blue-300 sm:h-5 sm:w-5'></div>
                        <div className='flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-purple-500 sm:h-5 sm:w-5'>
                          <span className='text-[6px] font-bold text-white sm:text-[7px]'>
                            ▶
                          </span>
                        </div>
                      </div>
                      <span className='truncate text-[8px] font-medium text-gray-600 sm:text-[9px]'>
                        One Successful
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content - Doctor Image */}
            <div className='relative mt-8 flex h-full items-center justify-center lg:mt-0'>
              {/* Decorative circle behind doctor */}
              <div className='absolute top-1/2 left-1/2 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-purple-300/25 to-pink-300/25 blur-3xl sm:h-[250px] sm:w-[250px] xl:h-[350px] xl:w-[350px]'></div>

              {/* Doctor Image Container */}
              <div className='relative z-10'>
                <div className='relative h-[280px] w-[280px] sm:h-[350px] sm:w-[350px] md:h-[400px] md:w-[400px] lg:h-[450px] lg:w-[450px] xl:h-[620px] xl:w-[620px]'>
                  <Image
                    src='/assets/images/doctor1.png'
                    alt='DoctorGujar'
                    fill
                    className='object-contain'
                    priority
                  />
                </div>

                {/* Floating Profile Card */}
                <div className='absolute top-[10%] left-2 rounded-xl p-2 xl:p-3'>
                  <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 xl:h-16 xl:w-16'>
                    <span className='text-xl font-bold text-white xl:text-2xl'>
                      Dr
                    </span>
                  </div>
                </div>

                {/* Calling Card */}
                <div className='absolute bottom-10 left-4 hidden max-w-[200px] items-center gap-1 rounded-lg bg-white px-2 py-1.5 shadow-xl lg:flex xl:left-90 xl:gap-1.5 xl:rounded-xl xl:px-3 xl:py-2'>
                  <div className='flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 xl:h-15 xl:w-15'>
                    <Image
                      src='/assets/images/doctor1.png'
                      alt='Caller'
                      width={52}
                      height={42}
                      className='object-cover'
                    />
                  </div>

                  <div className='flex min-w-0 flex-1 flex-col'>
                    <span className='truncate text-xs leading-none font-semibold text-gray-900 xl:text-sm'>
                      Dr. Gujar
                    </span>
                    <span className='text-[9px] font-medium text-gray-900 xl:text-[10px]'>
                      Calling .......
                    </span>
                  </div>
                  <div className='flex flex-shrink-0 gap-0.5 xl:gap-1'>
                    <button className='flex h-6 w-6 items-center justify-center rounded-full bg-gray-50 text-[9px] hover:bg-gray-100 xl:h-7 xl:w-7 xl:text-[10px]'>
                      📹
                    </button>
                    <button className='flex h-6 w-6 items-center justify-center rounded-full bg-red-500 hover:bg-red-600 xl:h-7 xl:w-7'>
                      <svg
                        className='h-2.5 w-2.5 text-white xl:h-3 xl:w-3'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path d='M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z'></path>
                      </svg>
                    </button>
                    <button className='flex h-6 w-6 items-center justify-center rounded-full bg-gray-50 text-[9px] hover:bg-gray-100 xl:h-7 xl:w-7 xl:text-[10px]'>
                      🔍
                    </button>
                  </div>
                </div>
              </div>

              {/* Social Icons - Top Right */}
              <div className='absolute top-4 right-2 z-20 flex flex-col gap-1.5 xl:top-6 xl:gap-2'>
                <button className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 shadow-lg transition-colors hover:bg-gray-800 xl:h-10 xl:w-10'>
                  <span className='text-[9px] font-bold text-white xl:text-[10px]'>
                    in
                  </span>
                </button>
                <button className='flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md transition-shadow hover:shadow-lg xl:h-10 xl:w-10'>
                  <span className='text-[9px] font-bold text-gray-900 xl:text-[10px]'>
                    ig
                  </span>
                </button>
                <button className='flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md transition-shadow hover:shadow-lg xl:h-10 xl:w-10'>
                  <span className='text-[10px] font-bold text-gray-900 xl:text-xs'>
                    𝕏
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
