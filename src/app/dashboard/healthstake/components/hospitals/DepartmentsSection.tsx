import { Stethoscope, ChevronDown, Users, Bed } from "lucide-react"

interface Department {
  id: string
  name: string
  headOfDepartment: string
  staffCount: number
  bedCapacity: number
  occupiedBeds: number
  icon: typeof Stethoscope
}

interface DepartmentsSectionProps {
  departments: Department[]
  isExpanded: boolean
  onToggle: () => void
}

export default function DepartmentsSection({ departments, isExpanded, onToggle }: DepartmentsSectionProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Stethoscope className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-bold text-gray-900">Departments & Administration</h3>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
      </button>
      
      {isExpanded && (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {departments.map((dept) => {
            const Icon = dept.icon
            const occupancyRate = dept.bedCapacity > 0 
              ? Math.round((dept.occupiedBeds / dept.bedCapacity) * 100)
              : 0
            
            return (
              <div
                key={dept.id}
                className="border-2 border-purple-100 rounded-xl p-5 hover:border-purple-300 transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
                    <Icon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-900 mb-2">{dept.name}</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Head:</span> {dept.headOfDepartment}
                      </p>
                      <div className="flex items-center gap-4 text-sm flex-wrap">
                        <span className="flex items-center gap-1.5 text-gray-600">
                          <Users className="w-4 h-4 text-purple-500" />
                          <span className="font-semibold">{dept.staffCount}</span> Staff
                        </span>
                        {dept.bedCapacity > 0 && (
                          <>
                            <span className="flex items-center gap-1.5 text-gray-600">
                              <Bed className="w-4 h-4 text-purple-500" />
                              <span className="font-semibold">{dept.occupiedBeds}/{dept.bedCapacity}</span> Beds
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              occupancyRate >= 90 
                                ? "bg-red-100 text-red-700"
                                : occupancyRate >= 70
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-green-100 text-green-700"
                            }`}>
                              {occupancyRate}% Full
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
