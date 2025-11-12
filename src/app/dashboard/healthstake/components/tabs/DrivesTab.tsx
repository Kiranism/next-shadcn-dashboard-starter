"use client"

import { useState } from "react"
import DriveStats from "../drives/DriveStats"
import FilterTabs from "../drives/FilterTabs"
import DriveCard from "../drives/DriveCard"

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

export default function DrivesTab({ role }: { role: string }) {
  const [selectedDrive, setSelectedDrive] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const currentWorkerId = "current-worker-id"

  const drives: Drive[] = [
    {
      id: "1",
      title: "Eye Care Camp 2024",
      description: "Free eye checkups and vision screening for underserved communities",
      status: "completed",
      date: "2024-03-10",
      location: "Community Center, Johar Town",
      manager: "Dr. Fatima Ali",
      volunteersCount: 8,
      volunteers: [
        { id: "1", name: "Dr. Fatima Ali", role: "Ophthalmologist", email: "fatima.ali@sehatyarr.com" },
        { id: "2", name: "Dr. Ali Hassan", role: "Optometrist", email: "ali.hassan@sehatyarr.com" },
        { id: "3", name: "Nurse Sara Khan", role: "Registered Nurse", email: "sara.khan@sehatyarr.com" },
        { id: "4", name: "Technician Ahmed", role: "Lab Technician", email: "ahmed@sehatyarr.com" }
      ],
      targetPopulation: 500,
      beneficiaries: 287,
      category: "Eye Care",
      invitedWorkers: [currentWorkerId],
      isVolunteered: true
    },
    {
      id: "2",
      title: "Diabetes Screening Drive",
      description: "Blood sugar testing and diabetes awareness program",
      status: "upcoming",
      date: "2024-12-15",
      location: "Model Town Health Center",
      manager: "Dr. Imran Khan",
      volunteersCount: 6,
      volunteers: [
        { id: "5", name: "Dr. Imran Khan", role: "Endocrinologist", email: "imran.khan@sehatyarr.com" },
        { id: "6", name: "Nurse Ayesha", role: "Registered Nurse", email: "ayesha@sehatyarr.com" }
      ],
      targetPopulation: 300,
      category: "Diabetes Care",
      invitedWorkers: [currentWorkerId],
      isVolunteered: false
    },
    {
      id: "3",
      title: "Maternal Health Awareness",
      description: "Prenatal care and maternal health education sessions",
      status: "completed",
      date: "2024-02-20",
      location: "Women's Health Center, Gulberg",
      manager: "Dr. Saima Akhtar",
      volunteersCount: 5,
      volunteers: [
        { id: "7", name: "Dr. Saima Akhtar", role: "Gynecologist", email: "saima.akhtar@sehatyarr.com" },
        { id: "8", name: "Midwife Zainab", role: "Certified Midwife", email: "zainab@sehatyarr.com" }
      ],
      targetPopulation: 200,
      beneficiaries: 195,
      category: "Maternal Health",
      isVolunteered: true
    },
    {
      id: "4",
      title: "Child Vaccination Campaign",
      description: "Free vaccination drive for children under 5 years",
      status: "ongoing",
      date: "2024-11-08",
      location: "Primary School, Faisal Town",
      manager: "Dr. Ayesha Khan",
      volunteersCount: 10,
      volunteers: [
        { id: "9", name: "Dr. Ayesha Khan", role: "Pediatrician", email: "ayesha.khan@sehatyarr.com" },
        { id: "10", name: "Nurse Hiba", role: "Registered Nurse", email: "hiba@sehatyarr.com" }
      ],
      targetPopulation: 400,
      beneficiaries: 412,
      category: "Child Health",
      isVolunteered: false
    },
    {
      id: "5",
      title: "Mental Health Awareness Workshop",
      description: "Counseling sessions and mental health education",
      status: "upcoming",
      date: "2024-12-20",
      location: "Community Hall, DHA",
      manager: "Dr. Hassan Raza",
      volunteersCount: 4,
      volunteers: [
        { id: "11", name: "Dr. Hassan Raza", role: "Psychiatrist", email: "hassan.raza@sehatyarr.com" },
        { id: "12", name: "Counselor Maryam", role: "Clinical Psychologist", email: "maryam@sehatyarr.com" }
      ],
      targetPopulation: 250,
      category: "Mental Health",
      isVolunteered: false
    }
  ]

  const handleVolunteer = (driveId: string) => {
    console.log(`Volunteering for drive: ${driveId}`)
  }

  const handleDeclineInvite = (driveId: string) => {
    console.log(`Declining invitation for drive: ${driveId}`)
  }

  const filteredDrives = filterStatus === "all" 
    ? drives 
    : filterStatus === "invited"
    ? drives.filter(d => d.invitedWorkers?.includes(currentWorkerId) && !d.isVolunteered)
    : filterStatus === "volunteered"
    ? drives.filter(d => d.isVolunteered)
    : drives.filter(d => d.status === filterStatus)

  const stats = {
    totalDrives: drives.length,
    upcomingCount: drives.filter(d => d.status === "upcoming").length,
    ongoingCount: drives.filter(d => d.status === "ongoing").length,
    completedCount: drives.filter(d => d.status === "completed").length,
    totalVolunteers: drives.reduce((sum, d) => sum + d.volunteersCount, 0)
  }

  const invitedCount = drives.filter(d => d.invitedWorkers?.includes(currentWorkerId) && !d.isVolunteered).length

  return (
    <div className="space-y-6">
      {/* Statistics Overview - Management Only */}
      {role === "Management" && <DriveStats {...stats} />}

      {/* Filter Tabs */}
      <FilterTabs 
        role={role}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        invitedCount={invitedCount}
      />

      {/* Drives List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredDrives.map((drive) => (
          <DriveCard
            key={drive.id}
            drive={drive}
            role={role}
            currentWorkerId={currentWorkerId}
            selectedDrive={selectedDrive}
            onSelectDrive={(id) => setSelectedDrive(selectedDrive === id ? null : id)}
            onVolunteer={handleVolunteer}
            onDeclineInvite={handleDeclineInvite}
          />
        ))}
      </div>

      {filteredDrives.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border-2 border-purple-100">
          <p className="text-gray-500">No drives found for this filter</p>
        </div>
      )}
    </div>
  )
}
