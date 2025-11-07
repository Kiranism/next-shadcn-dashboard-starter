"use client"

import Image from "next/image"

export default function Hero() {
  return (
    <section className="w-full h-screen bg-white p-4 md:p-6 flex items-center justify-center -mt-12 pt-16">
      {/* Main Container with gradient background and rounded corners */}
      <div className="w-full h-[85vh] bg-gradient-to-br from-purple-200 via-pink-100 to-pink-200 rounded-[40px] relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-purple-300/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-300/15 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-full flex items-center relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
            {/* Left Content */}
            <div className="space-y-4">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm">
                <span className="text-purple-600 font-semibold text-[10px]">Trusted</span>
                <span className="text-gray-600 text-[10px]">Best Medical Service in Town</span>
              </div>

              {/* Heading */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-[1.1]">
                Personalized<br />
                Medical Services<br />
                for Better Health
              </h1>

              {/* Schedule Button */}
              <button className="inline-flex items-center gap-2 bg-gray-900 text-white rounded-full px-5 py-2.5 shadow-lg hover:bg-gray-800 transition-colors mt-3">
                <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center">
                  <span className="text-gray-900 text-base font-bold">+</span>
                </div>
                <span className="font-medium text-xs">Schedule an appointment</span>
              </button>

              {/* Patient Card */}
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3 shadow-xl max-w-xs mt-4">
                <div className="flex items-start gap-2.5">
                  <Image 
                    src="/assets/images/doctor1.png" 
                    alt="Patient" 
                    width={45} 
                    height={45}
                    className="rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="text-xs font-bold text-gray-900 mb-0">Mitochondrial Test</h3>
                    <p className="text-[9px] text-gray-500 mb-1.5">Test</p>
                    
                    {/* Chart */}
                    <div className="mb-1.5">
                      <div className="flex gap-0.5 items-end h-8">
                        {[16, 28, 20, 34, 24, 32, 22, 36, 12, 16, 14, 18].map((height, i) => (
                          <div 
                            key={i} 
                            className={`flex-1 rounded-t ${
                              i < 8 ? 'bg-purple-500' : 'bg-gray-300'
                            }`}
                            style={{ height: `${height}px` }}
                          ></div>
                        ))}
                      </div>
                    </div>

                    {/* Avatar group and play button */}
                    <div className="flex items-center gap-1.5">
                      <div className="flex -space-x-1">
                        <div className="w-5 h-5 bg-purple-300 rounded-full border-2 border-white"></div>
                        <div className="w-5 h-5 bg-pink-300 rounded-full border-2 border-white"></div>
                        <div className="w-5 h-5 bg-blue-300 rounded-full border-2 border-white"></div>
                        <div className="w-5 h-5 bg-purple-500 rounded-full border-2 border-white flex items-center justify-center">
                          <span className="text-white text-[7px] font-bold">▶</span>
                        </div>
                      </div>
                      <span className="text-[9px] text-gray-600 font-medium">One Successful</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content - Doctor Image */}
            <div className="relative flex items-center justify-center h-full">
              {/* Decorative circle behind doctor */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-gradient-to-br from-purple-300/25 to-pink-300/25 rounded-full blur-3xl"></div>
              
              {/* Doctor Image Container */}
              <div className="relative z-10">
                <div className="relative w-[620px] h-[620px]">
                  <Image 
                    src="/assets/images/doctor1.png" 
                    alt="DoctorGujar" 
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                
                {/* Floating Profile Card */}
                <div className="absolute left-2 top-[10%] rounded-xl p-3 ">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">Dr</span>
                  </div>
                </div>

                {/* Calling Card */}
                <div className="absolute left-90 bottom-10 bg-white rounded-xl px-3 py-2 shadow-xl flex items-center gap-1.5">
                  <div className="w-15 h-15 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center">
                    <Image 
                      src="/assets/images/doctor1.png" 
                      alt="Caller" 
                      width={62} 
                      height={52}
                      className="object-cover"
                    />
                  </div>
                  
                    <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900 leading-none">Dr. Gujar</span>
                    <span className="text-[10px] font-medium text-gray-900">Calling .......</span>
                    </div>
                  <div className="flex gap-1">
                    <button className="w-7 h-7 bg-gray-50 rounded-full flex items-center justify-center hover:bg-gray-100 text-[10px]">
                      📹
                    </button>
                    <button className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
                      </svg>
                    </button>
                    <button className="w-7 h-7 bg-gray-50 rounded-full flex items-center justify-center hover:bg-gray-100 text-[10px]">
                      🔍
                    </button>
                  </div>
                </div>
              </div>

              {/* Social Icons - Top Right */}
              <div className="absolute top-6 right-2 flex flex-col gap-2 z-20">
                <button className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors shadow-lg">
                  <span className="text-white text-[10px] font-bold">in</span>
                </button>
                <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
                  <span className="text-gray-900 text-[10px] font-bold">ig</span>
                </button>
                <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
                  <span className="text-gray-900 text-xs font-bold">𝕏</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
