"use client"

export default function Community() {
  const stats = [
    { icon: "👥", label: "Expert" },
    { icon: "🔗", label: "Verified" },
    { icon: "✅", label: "Businesses" },
    { icon: "🎯", label: "Growth" },
    { icon: "📊", label: "Results" },
  ]

  return (
    <section className="w-full bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Join our community of 120,000+ businesses</h2>
          <p className="text-gray-500 text-sm">Trusted by healthcare providers worldwide</p>
        </div>

        {/* Stats Grid */}
        <div className="flex flex-wrap justify-center items-center gap-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2">
              <div className="text-2xl">{stat.icon}</div>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
