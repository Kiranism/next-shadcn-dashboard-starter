"use client"

export default function Stats() {
  const stats = [
    { number: "30M+", label: "Patients Served" },
    { number: "30%", label: "Growth Rate" },
    { number: "$100M", label: "Revenue" },
    { number: "60+", label: "Countries" },
  ]

  return (
    <section className="w-full bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center">
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{stat.number}</h3>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
