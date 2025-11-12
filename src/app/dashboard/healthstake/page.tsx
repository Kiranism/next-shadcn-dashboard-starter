"use client"

import { useState } from "react"
import { Building2, Users, Activity, ChevronDown } from "lucide-react"
import HospitalsTab from "./components/tabs/HospitalsTab"
import DrivesTab from "./components/tabs/DrivesTab"
import HealthWorkersTab from "./components/tabs/HealthWorkersTab"

type Role = "Management" | "Health Worker"
type Tab = "Hospitals" | "Health Drives" | "Health Workers"

export default function HealthStakePage() {
  const [currentRole, setCurrentRole] = useState<Role>("Management")
  const [activeTab, setActiveTab] = useState<Tab>("Hospitals")
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false)

  const roles: Role[] = ["Management", "Health Worker"]

  const tabs: { name: Tab; icon: typeof Building2 }[] = [
    { name: "Hospitals", icon: Building2 },
    { name: "Health Drives", icon: Activity },
    { name: "Health Workers", icon: Users },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                Health Stake Management
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Manage hospitals, health drives, and health workers
              </p>
            </div>

            {/* Role Selector */}
            <div className="relative">
              <button
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-purple-200 rounded-xl hover:border-purple-300 transition-all shadow-sm hover:shadow-md min-w-[180px] justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                  <span className="text-sm font-semibold text-gray-900">{currentRole}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isRoleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-full bg-white border border-purple-100 rounded-xl shadow-lg overflow-hidden z-10">
                  {roles.map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        setCurrentRole(role)
                        setIsRoleDropdownOpen(false)
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                        currentRole === role
                          ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 font-semibold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          currentRole === role ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-300'
                        }`}></div>
                        {role}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden">
          {/* Tab Headers */}
          <div className="border-b border-purple-100 bg-gradient-to-r from-purple-50/50 via-pink-50/30 to-purple-50/50">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.name}
                    onClick={() => setActiveTab(tab.name)}
                    className={`flex-1 min-w-[120px] sm:min-w-0 px-4 sm:px-6 py-4 flex items-center justify-center gap-2 text-sm sm:text-base font-medium transition-all ${
                      activeTab === tab.name
                        ? 'text-purple-700 border-b-3 border-purple-600 bg-white/70'
                        : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50/30'
                    }`}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">{tab.name}</span>
                    <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6 sm:p-8 lg:p-10">
            {activeTab === "Hospitals" && <HospitalsTab role={currentRole} />}
            {activeTab === "Health Drives" && <DrivesTab role={currentRole} />}
            {activeTab === "Health Workers" && <HealthWorkersTab role={currentRole} />}
          </div>
        </div>
      </div>
    </div>
  )
}
