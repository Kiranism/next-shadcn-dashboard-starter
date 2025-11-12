import { Heart, Users, Activity, CheckCircle } from "lucide-react"

interface DriveStatsProps {
  totalDrives: number
  upcomingCount: number
  ongoingCount: number
  completedCount: number
  totalVolunteers: number
}

export default function DriveStats({ totalDrives, upcomingCount, ongoingCount, completedCount, totalVolunteers }: DriveStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border-2 border-purple-200">
        <Heart className="w-7 h-7 mb-2 text-purple-600" />
        <p className="text-3xl font-bold text-purple-900">{totalDrives}</p>
        <p className="text-purple-700 text-sm font-semibold mt-1">Total Drives</p>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border-2 border-blue-200">
        <Activity className="w-7 h-7 mb-2 text-blue-600" />
        <p className="text-3xl font-bold text-blue-900">{upcomingCount}</p>
        <p className="text-blue-700 text-sm font-semibold mt-1">Upcoming</p>
      </div>

      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-5 border-2 border-yellow-200">
        <Heart className="w-7 h-7 mb-2 text-yellow-600" />
        <p className="text-3xl font-bold text-yellow-900">{ongoingCount}</p>
        <p className="text-yellow-700 text-sm font-semibold mt-1">Ongoing</p>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border-2 border-green-200">
        <CheckCircle className="w-7 h-7 mb-2 text-green-600" />
        <p className="text-3xl font-bold text-green-900">{completedCount}</p>
        <p className="text-green-700 text-sm font-semibold mt-1">Completed</p>
      </div>

      <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-5 border-2 border-pink-200">
        <Users className="w-7 h-7 mb-2 text-pink-600" />
        <p className="text-3xl font-bold text-pink-900">{totalVolunteers}</p>
        <p className="text-pink-700 text-sm font-semibold mt-1">Volunteers</p>
      </div>
    </div>
  )
}
