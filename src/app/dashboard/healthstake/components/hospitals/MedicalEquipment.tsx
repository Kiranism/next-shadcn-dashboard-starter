import { Activity, ChevronDown, CheckCircle, AlertCircle, TrendingUp, Calendar, Edit3 } from "lucide-react"

interface MedicalMachine {
  id: string
  name: string
  department: string
  status: "working" | "not-working" | "maintenance"
  lastMaintenance: string
  location: string
}

interface MedicalEquipmentProps {
  machines: MedicalMachine[]
  isExpanded: boolean
  onToggle: () => void
  editingMachine: string | null
  onEditToggle: (id: string) => void
  onStatusChange: (id: string, status: string) => void
}

export default function MedicalEquipment({ 
  machines, 
  isExpanded, 
  onToggle,
  editingMachine,
  onEditToggle,
  onStatusChange
}: MedicalEquipmentProps) {
  const workingMachines = machines.filter(m => m.status === "working").length
  const notWorkingMachines = machines.filter(m => m.status === "not-working").length
  const maintenanceMachines = machines.filter(m => m.status === "maintenance").length

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "working":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
            <CheckCircle className="w-3.5 h-3.5" />
            Working
          </span>
        )
      case "not-working":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
            <AlertCircle className="w-3.5 h-3.5" />
            Not Working
          </span>
        )
      case "maintenance":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
            <Activity className="w-3.5 h-3.5" />
            Maintenance
          </span>
        )
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-bold text-gray-900">Medical Equipment Status</h3>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
      </button>
      
      {isExpanded && (
        <div className="p-6">
          {/* Machine Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border-2 border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <p className="text-green-700 text-sm font-semibold">Working</p>
              </div>
              <p className="text-3xl font-bold text-green-900">{workingMachines}</p>
              <p className="text-green-600 text-xs mt-1">Machines</p>
            </div>
            
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5 border-2 border-red-200">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <p className="text-red-700 text-sm font-semibold">Not Working</p>
              </div>
              <p className="text-3xl font-bold text-red-900">{notWorkingMachines}</p>
              <p className="text-red-600 text-xs mt-1">Machines</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-5 border-2 border-yellow-200">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-6 h-6 text-yellow-600" />
                <p className="text-yellow-700 text-sm font-semibold">Maintenance</p>
              </div>
              <p className="text-3xl font-bold text-yellow-900">{maintenanceMachines}</p>
              <p className="text-yellow-600 text-xs mt-1">Machines</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border-2 border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <p className="text-blue-700 text-sm font-semibold">Operational</p>
              </div>
              <p className="text-3xl font-bold text-blue-900">
                {Math.round((workingMachines / machines.length) * 100)}%
              </p>
              <p className="text-blue-600 text-xs mt-1">Rate</p>
            </div>
          </div>

          {/* Equipment Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-purple-100">
                  <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Equipment Name</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Department</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Location</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Last Maintenance</th>
                  <th className="text-center py-3 px-4 text-sm font-bold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {machines.map((machine) => (
                  <tr key={machine.id} className="border-b border-purple-50 hover:bg-purple-50/50 transition-colors">
                    <td className="py-4 px-4">
                      <p className="font-semibold text-gray-900 text-sm">{machine.name}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                        {machine.department}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-gray-600">{machine.location}</p>
                    </td>
                    <td className="py-4 px-4">
                      {editingMachine === machine.id ? (
                        <select
                          value={machine.status}
                          onChange={(e) => onStatusChange(machine.id, e.target.value)}
                          className="px-3 py-1.5 border-2 border-purple-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-purple-400"
                        >
                          <option value="working">Working</option>
                          <option value="not-working">Not Working</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                      ) : (
                        getStatusBadge(machine.status)
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-gray-600 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {new Date(machine.lastMaintenance).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => onEditToggle(machine.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        {editingMachine === machine.id ? "Cancel" : "Edit"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
