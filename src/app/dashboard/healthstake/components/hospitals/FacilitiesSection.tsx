import { Building, ChevronDown, CheckCircle, AlertCircle } from "lucide-react"

interface Facility {
  id: string
  name: string
  description: string
  available: boolean
}

interface FacilitiesSectionProps {
  facilities: Facility[]
  isExpanded: boolean
  onToggle: () => void
}

export default function FacilitiesSection({ facilities, isExpanded, onToggle }: FacilitiesSectionProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Building className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-bold text-gray-900">Hospital Facilities</h3>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
      </button>
      
      {isExpanded && (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {facilities.map((facility) => (
            <div
              key={facility.id}
              className="border-2 border-purple-100 rounded-xl p-4 hover:border-purple-300 transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 mb-1">{facility.name}</h4>
                  <p className="text-sm text-gray-600">{facility.description}</p>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  facility.available 
                    ? "bg-green-100 text-green-700" 
                    : "bg-red-100 text-red-700"
                }`}>
                  {facility.available ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      Available
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5" />
                      Unavailable
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
