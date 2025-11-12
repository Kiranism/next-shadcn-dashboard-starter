import { Users, Phone, Mail, Stethoscope } from "lucide-react"

interface Colleague {
  id: string
  name: string
  role: string
  phone: string
  email: string
  joinedDate: string
}

interface Department {
  id: string
  name: string
  headOfDepartment: string
  staffCount: number
  bedCapacity: number
  occupiedBeds: number
  icon: typeof Stethoscope
}

interface MyDepartmentProps {
  department: Department
  colleagues: Colleague[]
  currentWorker: {
    joinedDate: string
  }
}

export default function MyDepartment({ department, colleagues, currentWorker }: MyDepartmentProps) {
  const Icon = department.icon

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-100 overflow-hidden">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b-2 border-purple-100">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">My Department</h3>
            <p className="text-gray-600 text-sm">Department details and information</p>
          </div>
          <div className="p-3 bg-white border-2 border-purple-200 rounded-xl">
            <Icon className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-100 mb-6">
          <h4 className="text-2xl font-bold text-gray-900 mb-4">{department.name}</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Head of Department</p>
              <p className="font-semibold text-gray-900">{department.headOfDepartment}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">You Joined</p>
              <p className="font-semibold text-gray-900">{new Date(currentWorker.joinedDate).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t-2 border-purple-200">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{department.staffCount}</p>
              <p className="text-xs text-gray-600 mt-1">Total Staff</p>
            </div>
            {department.bedCapacity > 0 && (
              <>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{department.bedCapacity}</p>
                  <p className="text-xs text-gray-600 mt-1">Total Beds</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{department.occupiedBeds}</p>
                  <p className="text-xs text-gray-600 mt-1">Occupied</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Colleagues Section */}
        <div>
          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            My Colleagues ({colleagues.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {colleagues.map((colleague) => (
              <div
                key={colleague.id}
                className="border-2 border-purple-100 rounded-xl p-4 hover:border-purple-300 transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {colleague.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-gray-900 truncate">{colleague.name}</h5>
                    <p className="text-sm text-purple-600 font-medium mb-2">{colleague.role}</p>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-600 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-purple-500" />
                        {colleague.phone}
                      </p>
                      <p className="text-xs text-gray-600 flex items-center gap-1.5 truncate">
                        <Mail className="w-3 h-3 text-purple-500" />
                        {colleague.email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
