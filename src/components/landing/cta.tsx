"use client"

import { Users, Link2, CheckSquare, Target, BarChart3 } from "lucide-react"

export default function CTA() {
  return (
    <section className="w-full bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Join our community of 120,000+ businesses
          </h2>
          <p className="text-gray-500 text-sm">
            Trusted by healthcare providers worldwide
          </p>
        </div>
 
        {/* Icons Grid */}
        <div className="flex flex-wrap items-center justify-center gap-16 md:gap-20">
          {/* Expert */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users className="w-7 h-7 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Expert</span>
          </div>

          {/* Verified */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center">
              <Link2 className="w-7 h-7 text-gray-500" />
            </div>
            <span className="text-sm font-medium text-gray-600">Verified</span>
          </div>

          {/* Businesses */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckSquare className="w-7 h-7 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Businesses</span>
          </div>

          {/* Growth */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center">
              <Target className="w-7 h-7 text-red-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Growth</span>
          </div>

          {/* Results */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Results</span>
          </div>
        </div>
      </div>
    </section>
  )
}
