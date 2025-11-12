"use client"

import { useState } from "react"
import WorkerStats from "../workers/WorkerStats"
import WorkerProfile from "../workers/WorkerProfile"
import WorkersList from "../workers/WorkersList"
import InviteModal from "../workers/InviteModal"

export default function HealthWorkersTab({ role }: { role: string }) {
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editedProfile, setEditedProfile] = useState({
    name: "",
    phone: "",
    email: ""
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedForInvite, setSelectedForInvite] = useState<string[]>([])
  const [selectedDrive, setSelectedDrive] = useState<string | null>(null)

  // Current Health Worker's Profile (for Health Worker role)
  const currentWorkerProfile = {
    id: "current-worker-id",
    name: "Dr. Sarah Ahmed",
    role: "Cardiologist",
    phone: "+92-300-1234567",
    email: "sarah.ahmed@hospital.com",
    joinedDate: "2023-06-15",
    department: "Cardiology",
    drivesAttended: 8,
    rating: 4.8,
    feedbacks: [
      { id: "1", from: "Dr. Imran Khan", date: "2024-03-15", rating: 5, comment: "Excellent work during the eye care camp. Very dedicated and professional." },
      { id: "2", from: "Dr. Fatima Ali", date: "2024-02-20", rating: 4, comment: "Good teamwork skills. Could improve time management." },
      { id: "3", from: "Dr. Ahmed Raza", date: "2024-01-10", rating: 5, comment: "Outstanding performance in maternal health drive." }
    ],
    previousDrives: [
      { id: "1", title: "Eye Care Camp 2024", date: "2024-03-10", beneficiaries: 287 },
      { id: "2", title: "Diabetes Screening Drive", date: "2024-02-15", beneficiaries: 156 },
      { id: "3", title: "Maternal Health Awareness", date: "2024-01-20", beneficiaries: 195 }
    ]
  }

  // Mock health workers data (for Management role)
  const healthWorkers = [
    {
      id: "1",
      name: "Dr. Fatima Ali",
      role: "Ophthalmologist",
      status: "active",
      drivesParticipated: 12,
      rating: 4.8
    },
    {
      id: "2",
      name: "Dr. Ali Hassan",
      role: "General Practitioner",
      status: "active",
      drivesParticipated: 18,
      rating: 4.6
    },
    {
      id: "3",
      name: "Nurse Sara Khan",
      role: "Registered Nurse",
      status: "active",
      drivesParticipated: 15,
      rating: 4.9
    },
    {
      id: "4",
      name: "Dr. Usman Shah",
      role: "Endocrinologist",
      status: "active",
      drivesParticipated: 15,
      rating: 4.7
    },
    {
      id: "5",
      name: "Zainab Ali",
      role: "Nutritionist",
      status: "active",
      drivesParticipated: 10,
      rating: 4.6
    },
    {
      id: "6",
      name: "Hassan Mahmood",
      role: "Optometrist",
      status: "active",
      drivesParticipated: 6,
      rating: 4.4
    }
  ]

  // Mock drives data for invite modal
  const drives = [
    {
      id: "1",
      title: "Eye Care Camp 2024",
      date: "2024-12-25",
      location: "Community Center, Johar Town",
      status: "upcoming",
      volunteersCount: 8
    },
    {
      id: "2",
      title: "Diabetes Screening Drive",
      date: "2024-12-15",
      location: "Model Town Health Center",
      status: "upcoming",
      volunteersCount: 6
    },
    {
      id: "3",
      title: "Child Vaccination Campaign",
      date: "2024-11-08",
      location: "Primary School, Faisal Town",
      status: "ongoing",
      volunteersCount: 10
    },
    {
      id: "4",
      title: "Mental Health Awareness Workshop",
      date: "2024-12-20",
      location: "Community Hall, DHA",
      status: "upcoming",
      volunteersCount: 4
    }
  ]

  const handleSaveProfile = () => {
    console.log("Saving profile:", editedProfile)
    setIsEditingProfile(false)
  }

  const handleEditProfile = () => {
    setEditedProfile({
      name: currentWorkerProfile.name,
      phone: currentWorkerProfile.phone,
      email: currentWorkerProfile.email
    })
    setIsEditingProfile(true)
  }

  const handleProfileChange = (field: string, value: string) => {
    setEditedProfile(prev => ({ ...prev, [field]: value }))
  }

  const handleInviteWorkers = () => {
    console.log("Inviting workers:", selectedForInvite, "to drive:", selectedDrive)
    setShowInviteModal(false)
    setSelectedForInvite([])
    setSelectedDrive(null)
  }

  const handleToggleWorkerForInvite = (workerId: string) => {
    setSelectedForInvite(prev => 
      prev.includes(workerId)
        ? prev.filter(id => id !== workerId)
        : [...prev, workerId]
    )
  }

  const handleInviteWorker = (workerId: string) => {
    setSelectedForInvite([workerId])
    setShowInviteModal(true)
  }

  const handleInviteMultiple = () => {
    setSelectedForInvite([])
    setShowInviteModal(true)
  }

  const stats = {
    totalWorkers: healthWorkers.length,
    activeWorkers: healthWorkers.filter(w => w.status === "active").length,
    avgDrives: Math.round(healthWorkers.reduce((acc, w) => acc + w.drivesParticipated, 0) / healthWorkers.length),
    avgRating: healthWorkers.reduce((acc, w) => acc + w.rating, 0) / healthWorkers.length
  }

  return (
    <div className="space-y-6">
      {role === "Management" ? (
        <>
          {/* Management View - Statistics */}
          <WorkerStats {...stats} />

          {/* Workers List with Search and Invite */}
          <WorkersList 
            workers={healthWorkers}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onInviteClick={handleInviteMultiple}
            onInviteWorker={handleInviteWorker}
          />

          {/* Invite Modal */}
          {showInviteModal && (
            <InviteModal
              workers={healthWorkers}
              drives={drives}
              selectedWorkers={selectedForInvite}
              selectedDrive={selectedDrive}
              onToggleWorker={handleToggleWorkerForInvite}
              onSelectDrive={setSelectedDrive}
              onSend={handleInviteWorkers}
              onClose={() => {
                setShowInviteModal(false)
                setSelectedForInvite([])
                setSelectedDrive(null)
              }}
            />
          )}
        </>
      ) : (
        // Health Worker View - Personal Profile
        <WorkerProfile
          profile={currentWorkerProfile}
          isEditing={isEditingProfile}
          editedValues={editedProfile}
          onEdit={handleEditProfile}
          onCancel={() => setIsEditingProfile(false)}
          onSave={handleSaveProfile}
          onChange={handleProfileChange}
        />
      )}
    </div>
  )
}
