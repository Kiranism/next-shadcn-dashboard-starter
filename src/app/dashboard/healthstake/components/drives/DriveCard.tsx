import { MapPin, Calendar, Users, ChevronRight, TrendingUp, Mail, CheckCircle } from "lucide-react"

interface HealthWorker {
  id: string
  name: string
  role: string
  email: string
}

interface Drive {
  id: string
  title: string
  description: string
  status: "upcoming" | "ongoing" | "completed"
  date: string
  location: string
  manager: string
  volunteersCount: number
  volunteers: HealthWorker[]
  targetPopulation: number
  beneficiaries?: number
  category: string
  invitedWorkers?: string[]
  isVolunteered?: boolean
}

interface DriveCardProps {
  drive: Drive
  role: string
  currentWorkerId: string
  selectedDrive: string | null
  onSelectDrive: (id: string) => void
  onVolunteer: (id: string) => void
  onDeclineInvite: (id: string) => void
}

export default function DriveCard({ 
  drive, 
  role, 
  currentWorkerId,
  selectedDrive, 
  onSelectDrive,
  onVolunteer,
  onDeclineInvite
}: DriveCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming": return "bg-blue-100 text-blue-700"
      case "ongoing": return "bg-yellow-100 text-yellow-700"
      case "completed": return "bg-green-100 text-green-700"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  const isExpanded = selectedDrive === drive.id

  return (
    <div className="bg-white rounded-xl shadow-md border-2 border-purple-100 overflow-hidden hover:shadow-lg transition-all">
      <div 
        className="p-5 cursor-pointer" 
        onClick={() => onSelectDrive(drive.id)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-bold text-gray-900">{drive.title}</h3>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(drive.status)}`}>
                {drive.status}
              </span>
            </div>
            <p className="text-sm text-gray-600">{drive.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-purple-500" />
            <span>{new Date(drive.date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-purple-500" />
            <span>{drive.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4 text-purple-500" />
            <span>{drive.volunteersCount} Volunteers</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <TrendingUp className="w-4 h-4 text-purple-500" />
            <span>{drive.beneficiaries || drive.targetPopulation} People</span>
          </div>
        </div>

        {/* View Details Button */}
        <button
          className="w-full mt-2 py-2 bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 rounded-lg text-purple-700 font-semibold text-sm flex items-center justify-center gap-2 transition-all"
        >
          View Details
          <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
        </button>

        {/* Health Worker: Invitation & Volunteer Buttons */}
        {role === "Health Worker" && (
          <div className="mt-2 space-y-2">
            {drive.invitedWorkers?.includes(currentWorkerId) && !drive.isVolunteered && (
              <div className="p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-semibold mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  You&apos;re invited to this drive!
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onVolunteer(drive.id)
                    }}
                    className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold transition-all"
                  >
                    Accept & Volunteer
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeclineInvite(drive.id)
                    }}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-all"
                  >
                    Decline
                  </button>
                </div>
              </div>
            )}
            
            {drive.isVolunteered && (
              <div className="p-3 bg-green-50 border-2 border-green-200 rounded-lg flex items-center justify-between">
                <p className="text-sm text-green-800 font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  You&apos;ve volunteered for this drive
                </p>
              </div>
            )}

            {!drive.isVolunteered && !drive.invitedWorkers?.includes(currentWorkerId) && drive.status === "upcoming" && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onVolunteer(drive.id)
                }}
                className="w-full py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-lg text-white rounded-lg text-sm font-semibold transition-all"
              >
                Volunteer for this Drive
              </button>
            )}
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t-2 border-purple-100 bg-gradient-to-br from-purple-50/50 to-pink-50/50 p-5">
          {/* Co-workers who participated (Health Worker Only) */}
          {role === "Health Worker" && drive.isVolunteered && (
            <div className="mb-4">
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                Your Co-workers in this Drive ({drive.volunteers.filter(v => v.id !== currentWorkerId).length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                {drive.volunteers.filter(v => v.id !== currentWorkerId).slice(0, 4).map((volunteer) => (
                  <div
                    key={volunteer.id}
                    className="flex items-center gap-2 p-2 bg-white rounded-lg border border-purple-100"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-xs">
                      {volunteer.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs text-gray-900 truncate">{volunteer.name}</p>
                      <p className="text-xs text-gray-600 truncate">{volunteer.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" />
            Volunteer Team ({drive.volunteersCount})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {drive.volunteers.map((volunteer) => (
              <div
                key={volunteer.id}
                className="flex items-center gap-3 p-3 bg-white rounded-lg border border-purple-100"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                  {volunteer.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900">{volunteer.name}</p>
                  <p className="text-xs text-gray-600">{volunteer.role}</p>
                </div>
              </div>
            ))}
          </div>

          {drive.status === "completed" && drive.beneficiaries && (
            <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-semibold mb-1">Drive Completed Successfully!</p>
              <p className="text-xs text-green-700">
                Benefited {drive.beneficiaries} out of {drive.targetPopulation} target population
                ({Math.round((drive.beneficiaries / drive.targetPopulation) * 100)}% achievement)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
