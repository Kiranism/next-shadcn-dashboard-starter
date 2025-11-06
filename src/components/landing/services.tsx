"use client"

import { Heart, Stethoscope, Zap, Bone, Activity } from "lucide-react"

export default function Services() {
  const services = [
    {
      title: "Primary Care",
      description: "Comprehensive healthcare for all your basic medical needs",
      icon: Stethoscope,
      color: "from-indigo-100 to-indigo-50",
    },
    {
      title: "Pediatrics",
      description: "Specialized care for children and infants",
      icon: Heart,
      color: "from-purple-100 to-purple-50",
    },
    {
      title: "Cardiology",
      description: "Heart and cardiovascular disease treatment",
      icon: Heart,
      color: "from-pink-100 to-pink-50",
    },
    {
      title: "Orthopedics",
      description: "Bone and joint care expertise",
      icon: Bone,
      color: "from-indigo-100 to-indigo-50",
    },
    {
      title: "Dermatology",
      description: "Skin health and beauty treatments",
      icon: Activity,
      color: "from-purple-100 to-purple-50",
    },
    {
      title: "Physical Therapy",
      description: "Rehabilitation and recovery services",
      icon: Zap,
      color: "from-pink-100 to-pink-50",
    },
  ]

  return (
    <section className="w-full bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">What medical service we offer</h2>
          <p className="text-gray-500 text-sm max-w-2xl mx-auto">
            From routine check-ups to specialized treatments, we provide comprehensive healthcare services tailored to
            your unique needs
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, idx) => {
            const Icon = service.icon
            return (
              <div key={idx} className="bg-white rounded-2xl p-8 hover:shadow-lg transition">
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${service.color} rounded-lg flex items-center justify-center mb-4`}
                >
                  <Icon size={24} className="text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-gray-500 text-sm">{service.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
