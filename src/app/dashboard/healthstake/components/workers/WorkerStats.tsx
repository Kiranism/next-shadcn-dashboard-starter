import { Users, CheckCircle, Activity, Star } from "lucide-react"

interface WorkerStatsProps {
  totalWorkers: number
  activeWorkers: number
  avgDrives: number
  avgRating: number
}

export default function WorkerStats({ totalWorkers, activeWorkers, avgDrives, avgRating }: WorkerStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200 shadow-sm">
        <Users className="w-8 h-8 mb-3 text-purple-600" />
        <p className="text-purple-700 text-sm font-semibold mb-1">Total Workers</p>
        <p className="text-3xl font-bold text-purple-900">{totalWorkers}</p>
      </div>
      
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200 shadow-sm">
        <CheckCircle className="w-8 h-8 mb-3 text-green-600" />
        <p className="text-green-700 text-sm font-semibold mb-1">Active Workers</p>
        <p className="text-3xl font-bold text-green-900">{activeWorkers}</p>
      </div>
      
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200 shadow-sm">
        <Activity className="w-8 h-8 mb-3 text-blue-600" />
        <p className="text-blue-700 text-sm font-semibold mb-1">Avg Drives/Worker</p>
        <p className="text-3xl font-bold text-blue-900">{avgDrives}</p>
      </div>
      
      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border-2 border-yellow-200 shadow-sm">
        <Star className="w-8 h-8 mb-3 text-yellow-600" />
        <p className="text-yellow-700 text-sm font-semibold mb-1">Avg Rating</p>
        <p className="text-3xl font-bold text-yellow-900">{avgRating.toFixed(1)}</p>
      </div>
    </div>
  )
}
