import { Building2, Calendar, Phone, Mail, Activity, Star, MessageSquare } from "lucide-react"

interface WorkerProfileProps {
  profile: {
    name: string
    role: string
    phone: string
    email: string
    joinedDate: string
    department: string
    drivesAttended: number
    rating: number
    feedbacks: { id: string; from: string; date: string; rating: number; comment: string }[]
    previousDrives: { id: string; title: string; date: string; beneficiaries: number }[]
  }
  isEditing: boolean
  editedValues: { name: string; phone: string; email: string }
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
  onChange: (field: string, value: string) => void
}

export default function WorkerProfile({ 
  profile, 
  isEditing, 
  editedValues, 
  onEdit, 
  onCancel, 
  onSave, 
  onChange 
}: WorkerProfileProps) {
  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200 shadow-md">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">My Profile</h2>
            <p className="text-gray-600">View and manage your personal information</p>
          </div>
          {!isEditing ? (
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Save
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedValues.name}
                  onChange={(e) => onChange("name", e.target.value)}
                  className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                />
              ) : (
                <p className="text-gray-900 font-medium">{profile.name}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Phone Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editedValues.phone}
                  onChange={(e) => onChange("phone", e.target.value)}
                  className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                />
              ) : (
                <p className="text-gray-900 font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4 text-purple-600" />
                  {profile.phone}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Email Address</label>
              {isEditing ? (
                <input
                  type="email"
                  value={editedValues.email}
                  onChange={(e) => onChange("email", e.target.value)}
                  className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                />
              ) : (
                <p className="text-gray-900 font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4 text-purple-600" />
                  {profile.email}
                </p>
              )}
            </div>
          </div>

          {/* Fixed Information */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Role</label>
              <p className="text-gray-900 font-medium">{profile.role}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Department</label>
              <p className="text-gray-900 font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-600" />
                {profile.department}
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Joined Date</label>
              <p className="text-gray-900 font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                {new Date(profile.joinedDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200 shadow-sm">
          <Activity className="w-8 h-8 mb-3 text-green-600" />
          <p className="text-green-700 text-sm font-semibold mb-1">Drives Attended</p>
          <p className="text-3xl font-bold text-green-900">{profile.drivesAttended}</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border-2 border-yellow-200 shadow-sm">
          <Star className="w-8 h-8 mb-3 text-yellow-600" />
          <p className="text-yellow-700 text-sm font-semibold mb-1">My Rating</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-yellow-900">{profile.rating}</p>
            <div className="flex gap-0.5 pb-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= profile.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200 shadow-sm">
          <MessageSquare className="w-8 h-8 mb-3 text-blue-600" />
          <p className="text-blue-700 text-sm font-semibold mb-1">Feedbacks</p>
          <p className="text-3xl font-bold text-blue-900">{profile.feedbacks.length}</p>
        </div>
      </div>

      {/* Previous Drives */}
      <div className="bg-white rounded-xl shadow-md border border-purple-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-600" />
          Previous Drives
        </h3>
        <div className="space-y-3">
          {profile.previousDrives.map((drive) => (
            <div
              key={drive.id}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200"
            >
              <div>
                <p className="font-semibold text-gray-900">{drive.title}</p>
                <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(drive.date).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-purple-700">Beneficiaries</p>
                <p className="text-xl font-bold text-purple-900">{drive.beneficiaries}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feedbacks Received */}
      <div className="bg-white rounded-xl shadow-md border border-purple-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-purple-600" />
          Feedbacks Received
        </h3>
        <div className="space-y-4">
          {profile.feedbacks.map((feedback) => (
            <div
              key={feedback.id}
              className="p-4 bg-gradient-to-br from-blue-50/50 to-purple-50/50 rounded-lg border border-blue-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900">{feedback.from}</p>
                  <p className="text-sm text-gray-600">{new Date(feedback.date).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= feedback.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-gray-700">{feedback.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
