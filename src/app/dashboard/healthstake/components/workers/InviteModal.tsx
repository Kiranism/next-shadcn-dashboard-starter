import { X, Send, Calendar, MapPin, Users } from "lucide-react"

interface Worker {
  id: string
  name: string
  role: string
}

interface Drive {
  id: string
  title: string
  date: string
  location: string
  status: string
  volunteersCount: number
}

interface InviteModalProps {
  workers: Worker[]
  drives: Drive[]
  selectedWorkers: string[]
  selectedDrive: string | null
  onToggleWorker: (id: string) => void
  onSelectDrive: (id: string) => void
  onSend: () => void
  onClose: () => void
}

export default function InviteModal({ 
  workers, 
  drives,
  selectedWorkers, 
  selectedDrive,
  onToggleWorker, 
  onSelectDrive,
  onSend, 
  onClose 
}: InviteModalProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming": return "bg-blue-100 text-blue-700"
      case "ongoing": return "bg-yellow-100 text-yellow-700"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  const canSend = selectedWorkers.length > 0 && selectedDrive !== null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-purple-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Invite Workers to Health Drive</h3>
            <p className="text-sm text-gray-600 mt-1">Select workers and a drive to send invitations</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content - Two Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-purple-100 max-h-[60vh]">
          {/* Left Column - Select Workers */}
          <div className="p-6 overflow-y-auto">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Select Workers ({selectedWorkers.length} selected)
            </h4>
            <div className="space-y-2">
              {workers.map((worker) => (
                <div
                  key={worker.id}
                  className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedWorkers.includes(worker.id)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-purple-100 hover:border-purple-300 bg-white'
                  }`}
                  onClick={() => onToggleWorker(worker.id)}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedWorkers.includes(worker.id)}
                      onChange={() => onToggleWorker(worker.id)}
                      className="w-4 h-4 text-purple-600 border-purple-300 rounded focus:ring-purple-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="w-9 h-9 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-xs">
                      {worker.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{worker.name}</p>
                      <p className="text-xs text-gray-600 truncate">{worker.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Select Drive */}
          <div className="p-6 overflow-y-auto">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Select Drive
            </h4>
            <div className="space-y-2">
              {drives.filter(d => d.status === "upcoming" || d.status === "ongoing").map((drive) => (
                <div
                  key={drive.id}
                  className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedDrive === drive.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-purple-100 hover:border-purple-300 bg-white'
                  }`}
                  onClick={() => onSelectDrive(drive.id)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="drive"
                      checked={selectedDrive === drive.id}
                      onChange={() => onSelectDrive(drive.id)}
                      className="mt-1 w-4 h-4 text-purple-600 border-purple-300 focus:ring-purple-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-semibold text-sm text-gray-900">{drive.title}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(drive.status)}`}>
                          {drive.status}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(drive.date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-600 flex items-center gap-1.5">
                          <MapPin className="w-3 h-3" />
                          {drive.location}
                        </p>
                        <p className="text-xs text-gray-600 flex items-center gap-1.5">
                          <Users className="w-3 h-3" />
                          {drive.volunteersCount} volunteers
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-purple-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedWorkers.length > 0 && selectedDrive ? (
                <p>
                  Ready to invite <span className="font-semibold">{selectedWorkers.length} worker{selectedWorkers.length !== 1 ? 's' : ''}</span> to the selected drive
                </p>
              ) : (
                <p className="text-gray-500">
                  {selectedWorkers.length === 0 ? "Select at least one worker" : "Select a drive to invite workers to"}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={onSend}
                disabled={!canSend}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                Send Invitations
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
