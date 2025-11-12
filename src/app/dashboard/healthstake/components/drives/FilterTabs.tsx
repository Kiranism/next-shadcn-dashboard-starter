interface FilterTabsProps {
  role: string
  filterStatus: string
  onFilterChange: (status: string) => void
  invitedCount?: number
}

export default function FilterTabs({ role, filterStatus, onFilterChange, invitedCount = 0 }: FilterTabsProps) {
  const managementFilters = ["all", "upcoming", "ongoing", "completed"]
  const workerFilters = ["all", "invited", "volunteered", "upcoming", "completed"]
  
  const filters = role === "Management" ? managementFilters : workerFilters

  return (
    <div className="bg-white rounded-xl shadow-md border border-purple-100 p-2">
      <div className="flex flex-wrap gap-2">
        {filters.map((status) => (
          <button
            key={status}
            onClick={() => onFilterChange(status)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filterStatus === status
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {status === "invited" && invitedCount > 0 && ` (${invitedCount})`}
          </button>
        ))}
      </div>
    </div>
  )
}
