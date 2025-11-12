import { Building2, MapPin, Phone, Mail, Bed, Users, Building, Activity } from "lucide-react"

interface HospitalOverviewProps {
  hospital: {
    name: string
    address: string
    city: string
    phone: string
    email: string
    established: string
    totalBeds: number
    occupiedBeds: number
    totalStaff: number
    totalDepartments: number
  }
}

export default function HospitalOverview({ hospital }: HospitalOverviewProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-100 overflow-hidden">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 sm:p-8 border-b-2 border-purple-100">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{hospital.name}</h2>
            <p className="text-gray-600 text-sm">Established {hospital.established}</p>
          </div>
          <div className="p-3 bg-white border-2 border-purple-200 rounded-xl">
            <Building2 className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border-2 border-purple-100">
            <Bed className="w-6 h-6 text-purple-600 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{hospital.totalBeds}</p>
            <p className="text-gray-600 text-xs mt-1">Total Beds</p>
          </div>
          <div className="bg-white rounded-xl p-4 border-2 border-purple-100">
            <Users className="w-6 h-6 text-purple-600 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{hospital.totalStaff}</p>
            <p className="text-gray-600 text-xs mt-1">Total Staff</p>
          </div>
          <div className="bg-white rounded-xl p-4 border-2 border-purple-100">
            <Building className="w-6 h-6 text-purple-600 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{hospital.totalDepartments}</p>
            <p className="text-gray-600 text-xs mt-1">Departments</p>
          </div>
          <div className="bg-white rounded-xl p-4 border-2 border-purple-100">
            <Activity className="w-6 h-6 text-purple-600 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{Math.round((hospital.occupiedBeds / hospital.totalBeds) * 100)}%</p>
            <p className="text-gray-600 text-xs mt-1">Occupancy</p>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-gray-700">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-purple-500" />
          <span>{hospital.address}, {hospital.city}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Phone className="w-4 h-4 text-purple-500" />
          <span>{hospital.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Mail className="w-4 h-4 text-purple-500" />
          <span>{hospital.email}</span>
        </div>
      </div>
    </div>
  )
}
