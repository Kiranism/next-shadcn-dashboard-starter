"use client"

import { useState } from "react"
import { 
  Heart,
  Stethoscope,
  Activity,
  AlertCircle
} from "lucide-react"
import HospitalOverview from "../hospitals/HospitalOverview"
import MyDepartment from "../hospitals/MyDepartment"
import FacilitiesSection from "../hospitals/FacilitiesSection"
import MedicalEquipment from "../hospitals/MedicalEquipment"
import DepartmentsSection from "../hospitals/DepartmentsSection"

export default function HospitalsTab({ role }: { role: string }) {
  const [editingMachine, setEditingMachine] = useState<string | null>(null)
  const [expandedSection, setExpandedSection] = useState<string>("overview")

  // Single Hospital Data
  const hospital = {
    name: "Shaukat Khanum Memorial Hospital",
    address: "7-A, Block R-3, Johar Town",
    city: "Lahore",
    phone: "+92-42-35905000",
    email: "info@shaukatkhanum.org.pk",
    established: "1994",
    totalBeds: 195,
    occupiedBeds: 167,
    totalStaff: 450,
    totalDepartments: 12
  }

  // Health Worker's own data
  const currentWorker = {
    department: "Cardiology",
    joinedDate: "2023-06-15"
  }

  // Colleagues in same department
  const colleagues = [
    {
      id: "1",
      name: "Dr. Ahmed Khan",
      role: "Head of Department",
      phone: "+92-300-1111111",
      email: "ahmed.khan@hospital.com",
      joinedDate: "2015-03-10"
    },
    {
      id: "2",
      name: "Dr. Sarah Malik",
      role: "Senior Cardiologist",
      phone: "+92-300-2222222",
      email: "sarah.malik@hospital.com",
      joinedDate: "2018-07-22"
    },
    {
      id: "3",
      name: "Nurse Fatima Ali",
      role: "Registered Nurse",
      phone: "+92-300-3333333",
      email: "fatima.ali@hospital.com",
      joinedDate: "2020-01-15"
    },
    {
      id: "4",
      name: "Dr. Hassan Raza",
      role: "Cardiologist",
      phone: "+92-300-4444444",
      email: "hassan.raza@hospital.com",
      joinedDate: "2021-05-08"
    },
    {
      id: "5",
      name: "Technician Ali Ahmed",
      role: "ECG Technician",
      phone: "+92-300-5555555",
      email: "ali.ahmed@hospital.com",
      joinedDate: "2022-09-12"
    }
  ]

  const facilities = [
    {
      id: "1",
      name: "24/7 Emergency Services",
      description: "Round-the-clock emergency medical care",
      available: true
    },
    {
      id: "2",
      name: "Intensive Care Unit (ICU)",
      description: "20 beds with advanced monitoring systems",
      available: true
    },
    {
      id: "3",
      name: "Operation Theaters",
      description: "8 fully equipped surgical theaters",
      available: true
    },
    {
      id: "4",
      name: "Diagnostic Lab",
      description: "Complete pathology and diagnostic services",
      available: true
    },
    {
      id: "5",
      name: "Pharmacy",
      description: "24/7 in-house pharmacy",
      available: true
    },
    {
      id: "6",
      name: "Blood Bank",
      description: "On-site blood storage and transfusion services",
      available: true
    },
    {
      id: "7",
      name: "Cafeteria",
      description: "Food services for patients and visitors",
      available: true
    },
    {
      id: "8",
      name: "Ambulance Services",
      description: "Emergency transport with paramedics",
      available: true
    }
  ]

  const medicalMachines = [
    {
      id: "1",
      name: "MRI Scanner - Siemens Magnetom",
      department: "Radiology",
      status: "working" as const,
      lastMaintenance: "2024-10-15",
      location: "Building A, Floor 2"
    },
    {
      id: "2",
      name: "CT Scanner - GE Revolution",
      department: "Radiology",
      status: "working" as const,
      lastMaintenance: "2024-11-01",
      location: "Building A, Floor 2"
    },
    {
      id: "3",
      name: "Ventilator - Philips Respironics (Unit 1)",
      department: "ICU",
      status: "working" as const,
      lastMaintenance: "2024-10-28",
      location: "Building B, ICU Ward"
    },
    {
      id: "4",
      name: "Ventilator - Philips Respironics (Unit 2)",
      department: "ICU",
      status: "not-working" as const,
      lastMaintenance: "2024-09-20",
      location: "Building B, ICU Ward"
    },
    {
      id: "5",
      name: "X-Ray Machine - Canon Radnext",
      department: "Emergency",
      status: "maintenance" as const,
      lastMaintenance: "2024-11-10",
      location: "Emergency Wing"
    },
    {
      id: "6",
      name: "Ultrasound - Samsung HS70A",
      department: "Obstetrics",
      status: "working" as const,
      lastMaintenance: "2024-10-28",
      location: "Building C, Floor 1"
    },
    {
      id: "7",
      name: "ECG Machine - Philips PageWriter",
      department: "Cardiology",
      status: "working" as const,
      lastMaintenance: "2024-11-05",
      location: "Building A, Floor 3"
    },
    {
      id: "8",
      name: "Dialysis Machine - Fresenius 4008S",
      department: "Nephrology",
      status: "working" as const,
      lastMaintenance: "2024-10-20",
      location: "Building C, Floor 2"
    },
    {
      id: "9",
      name: "Anesthesia Machine - Dräger Fabius",
      department: "Surgery",
      status: "working" as const,
      lastMaintenance: "2024-11-08",
      location: "Operating Theater 3"
    },
    {
      id: "10",
      name: "Defibrillator - Zoll R Series",
      department: "Emergency",
      status: "not-working" as const,
      lastMaintenance: "2024-10-10",
      location: "Emergency Wing"
    }
  ]

  const departments = [
    {
      id: "1",
      name: "Cardiology",
      headOfDepartment: "Dr. Ahmed Khan",
      staffCount: 45,
      bedCapacity: 30,
      occupiedBeds: 27,
      icon: Heart
    },
    {
      id: "2",
      name: "Radiology",
      headOfDepartment: "Dr. Sarah Ali",
      staffCount: 32,
      bedCapacity: 0,
      occupiedBeds: 0,
      icon: Activity
    },
    {
      id: "3",
      name: "Emergency",
      headOfDepartment: "Dr. Bilal Hassan",
      staffCount: 68,
      bedCapacity: 25,
      occupiedBeds: 22,
      icon: AlertCircle
    },
    {
      id: "4",
      name: "General Medicine",
      headOfDepartment: "Dr. Fatima Malik",
      staffCount: 55,
      bedCapacity: 40,
      occupiedBeds: 35,
      icon: Stethoscope
    },
    {
      id: "5",
      name: "Surgery",
      headOfDepartment: "Dr. Hassan Raza",
      staffCount: 60,
      bedCapacity: 35,
      occupiedBeds: 30,
      icon: Activity
    },
    {
      id: "6",
      name: "Pediatrics",
      headOfDepartment: "Dr. Ayesha Khan",
      staffCount: 42,
      bedCapacity: 30,
      occupiedBeds: 25,
      icon: Heart
    },
    {
      id: "7",
      name: "Obstetrics & Gynecology",
      headOfDepartment: "Dr. Saima Akhtar",
      staffCount: 38,
      bedCapacity: 25,
      occupiedBeds: 21,
      icon: Heart
    },
    {
      id: "8",
      name: "ICU",
      headOfDepartment: "Dr. Usman Shah",
      staffCount: 50,
      bedCapacity: 20,
      occupiedBeds: 18,
      icon: AlertCircle
    }
  ]

  const handleStatusChange = (machineId: string, newStatus: string) => {
    console.log(`Updating machine ${machineId} to status: ${newStatus}`)
    setEditingMachine(null)
  }

  const handleEditToggle = (machineId: string) => {
    setEditingMachine(editingMachine === machineId ? null : machineId)
  }

  const myDepartment = departments.find(d => d.name === currentWorker.department)

  return (
    <div className="space-y-6">
      {/* Hospital Overview - Shown to both roles */}
      <HospitalOverview hospital={hospital} />

      {/* Health Worker: My Department Section */}
      {role === "Health Worker" && myDepartment && (
        <MyDepartment 
          department={myDepartment} 
          colleagues={colleagues} 
          currentWorker={currentWorker}
        />
      )}

      {/* Management Only: Facilities Section */}
      {role === "Management" && (
        <FacilitiesSection 
          facilities={facilities}
          isExpanded={expandedSection === "facilities"}
          onToggle={() => setExpandedSection(expandedSection === "facilities" ? "" : "facilities")}
        />
      )}

      {/* Management Only: Medical Machines Section */}
      {role === "Management" && (
        <MedicalEquipment 
          machines={medicalMachines}
          isExpanded={expandedSection === "machines"}
          onToggle={() => setExpandedSection(expandedSection === "machines" ? "" : "machines")}
          editingMachine={editingMachine}
          onEditToggle={handleEditToggle}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Management Only: Departments Section */}
      {role === "Management" && (
        <DepartmentsSection 
          departments={departments}
          isExpanded={expandedSection === "departments"}
          onToggle={() => setExpandedSection(expandedSection === "departments" ? "" : "departments")}
        />
      )}
    </div>
  )
}
