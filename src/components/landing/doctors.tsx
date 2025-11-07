"use client"

import { ChevronLeft, ChevronRight, Hospital } from "lucide-react"
import { useState, useEffect } from "react"

export default function Hospitals() {
  const [currentIndex, setCurrentIndex] = useState(2)

  const hospitals = [
    { name: "Aga Khan University Hospital", location: "Karachi", icon: "🏥" },
    { name: "Shaukat Khanum Memorial Cancer Hospital", location: "Lahore", icon: "🏥" },
    { name: "Indus Hospital", location: "Karachi", icon: "🏥", featured: true },
    { name: "Shifa International Hospital", location: "Islamabad", icon: "🏥" },
    { name: "Liaquat National Hospital", location: "Karachi", icon: "🏥" },
  ]

  // Auto-play carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % hospitals.length)
    }, 3000) // Change every 3 seconds

    return () => clearInterval(interval)
  }, [hospitals.length])

  return (
    <section className="w-full bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Partner Hospitals Across Pakistan</h2>
          <p className="text-gray-500 text-sm">Connecting you with leading healthcare institutions nationwide</p>
        </div>

        {/* Hospitals Carousel */}
        <div className="relative py-8">
          <div className="flex justify-center items-center gap-4">
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + hospitals.length) % hospitals.length)}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0 z-20"
            >
              <ChevronLeft size={24} className="text-gray-700" />
            </button>

            <div className="flex gap-6 items-center justify-center overflow-visible">
              {hospitals.map((hospital, idx) => {
                const isCenter = idx === currentIndex
                return (
                  <div
                    key={idx}
                    className={`transition-all duration-500 ease-in-out ${
                      isCenter ? "scale-110 z-10 opacity-100" : "scale-90 opacity-50"
                    }`}
                  >
                    <div
                      className={`w-48 h-56 rounded-2xl flex flex-col items-center justify-center text-center p-6 ${
                        isCenter ? "bg-gradient-to-br from-purple-500 to-pink-500 shadow-2xl" : "bg-white shadow-md"
                      }`}
                    >
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                        isCenter ? "bg-white/20" : "bg-purple-50"
                      }`}>
                        <Hospital size={32} className={isCenter ? "text-white" : "text-purple-600"} />
                      </div>
                      <h3 className={`font-bold text-base mb-2 leading-tight ${isCenter ? "text-white" : "text-gray-900"}`}>
                        {hospital.name}
                      </h3>
                      <p className={`text-sm ${isCenter ? "text-purple-100" : "text-gray-500"}`}>
                        {hospital.location}
                      </p>
                      <div className="flex gap-1 mt-4">
                        <div className={`w-2 h-2 rounded-full ${isCenter ? "bg-white" : "bg-gray-300"}`}></div>
                        <div className={`w-2 h-2 rounded-full ${isCenter ? "bg-white" : "bg-gray-300"}`}></div>
                        <div className={`w-2 h-2 rounded-full ${isCenter ? "bg-white" : "bg-gray-300"}`}></div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % hospitals.length)}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0 z-20"
            >
              <ChevronRight size={24} className="text-gray-700" />
            </button>
          </div>

          {/* Indicator Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {hospitals.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentIndex ? "bg-purple-600 w-6" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
