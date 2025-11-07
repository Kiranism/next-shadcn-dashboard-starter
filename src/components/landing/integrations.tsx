"use client"

import { Zap } from "lucide-react"

export default function Integrations() {
  const icons = ["⭐", "❤️", "🔧", "📱", "💻", "🎯", "📊", "⚡", "🔐", "🌐"]

  return (
    <section className="w-full bg-white py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Optimize Your Workflow with 50+ Medical System Integrations
          </h2>
          <p className="text-gray-500 text-sm">Seamlessly connect with your existing tools and platforms</p>
        </div>

        {/* Integration Network */}
        <div className="relative h-80 flex items-center justify-center">
          {/* Center Circle */}
          <div className="absolute w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg z-10">
            <Zap size={40} className="text-white" />
          </div>

          {/* Orbiting Icons Container - Rotates */}
                    {/* Orbiting Icons Container - Rotates */}
          <div className="absolute w-full h-full flex items-center justify-center">
            <div className="relative w-[280px] h-[280px] animate-[spin_50s_linear_infinite]">
              {icons.map((icon, idx) => {
                const angle = (idx / icons.length) * Math.PI * 2
                const radius = 140
                const x = Math.cos(angle) * radius
                const y = Math.sin(angle) * radius
                return (
                  <div
                    key={idx}
                    className="absolute top-1/2 left-1/2 text-4xl"
                    style={{
                      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                    }}
                  >
                    {icon}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
