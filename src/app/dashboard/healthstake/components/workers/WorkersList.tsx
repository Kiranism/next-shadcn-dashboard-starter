import { Search, UserPlus, Send } from "lucide-react"

interface Worker {
  id: string
  name: string
  role: string
  status: string
  drivesParticipated: number
  rating: number
}

interface WorkersListProps {
  workers: Worker[]
  searchQuery: string
  onSearchChange: (query: string) => void
  onInviteClick: () => void
  onInviteWorker: (workerId: string) => void
}

export default function WorkersList({ 
  workers, 
  searchQuery, 
  onSearchChange, 
  onInviteClick,
  onInviteWorker
}: WorkersListProps) {
  const filteredWorkers = workers.filter(worker =>
    worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    worker.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="bg-white rounded-xl shadow-md border border-purple-100 p-6">
      {/* Header with Search and Invite */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-lg font-bold text-gray-900">Health Workers ({workers.length})</h3>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {/* Search Bar */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search workers..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 border-2 border-purple-100 rounded-lg focus:outline-none focus:border-purple-300 text-sm"
            />
          </div>
          
          {/* Invite Button */}
          <button
            onClick={onInviteClick}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Workers</span>
          </button>
        </div>
      </div>

      {/* Workers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWorkers.map((worker) => (
          <div
            key={worker.id}
            className="p-4 border-2 border-purple-100 rounded-lg hover:border-purple-300 transition-all hover:shadow-md"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                {worker.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{worker.name}</p>
                <p className="text-sm text-purple-600 truncate">{worker.role}</p>
              </div>
            </div>
            <div className="space-y-1 text-sm text-gray-600 mb-3">
              <p>Drives: <span className="font-semibold">{worker.drivesParticipated}</span></p>
              <p>Rating: <span className="font-semibold">{worker.rating}/5.0</span></p>
              <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                worker.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
              }`}>
                {worker.status}
              </span>
            </div>
            {/* Invite Button for Individual Worker */}
            <button
              onClick={() => onInviteWorker(worker.id)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              Invite to Drive
            </button>
          </div>
        ))}
      </div>

      {/* No Results Message */}
      {filteredWorkers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No workers found matching your search</p>
        </div>
      )}
    </div>
  )
}
