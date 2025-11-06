"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

export default function Testimonial() {
  return (
    <section className="w-full bg-gray-50 py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Testimonial Text */}
          <div className="space-y-4">
            <p className="text-gray-600 leading-relaxed">
              "I couldn't have asked for better care. From the moment I walked in, the staff was welcoming and
              attentive. They answered all my concerns, explain my options, and guide me through every step of my
              treatment."
            </p>
            <p className="text-gray-900 font-semibold">— Patient Name</p>

            {/* Navigation */}
            <div className="flex gap-4 pt-4">
              <button className="p-2 border border-gray-300 rounded-full hover:bg-gray-100 transition">
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
              <button className="p-2 border border-gray-300 rounded-full hover:bg-gray-100 transition">
                <ChevronRight size={20} className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* Testimonial Image */}
          <div className="flex justify-end">
            <div className="w-64 h-80 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl shadow-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full mx-auto mb-4 opacity-30"></div>
                <p className="text-gray-400 text-sm">Testimonial Image</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
