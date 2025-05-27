import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface FilterState {
  timeRange: number // days
  region: string
  barangay: string | null
  refreshTrigger: number
}

interface FilterContextType {
  filters: FilterState
  updateTimeRange: (days: number) => void
  updateRegion: (region: string) => void
  updateBarangay: (barangay: string | null) => void
  refreshData: () => void
}

const FilterContext = createContext<FilterContextType | undefined>(undefined)

export const useFilters = () => {
  const context = useContext(FilterContext)
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider')
  }
  return context
}

interface FilterProviderProps {
  children: ReactNode
}

export const FilterProvider: React.FC<FilterProviderProps> = ({ children }) => {
  const [filters, setFilters] = useState<FilterState>({
    timeRange: 7,
    region: 'All Regions',
    barangay: null,
    refreshTrigger: 0
  })

  const updateTimeRange = (days: number) => {
    setFilters(prev => ({ ...prev, timeRange: days }))
  }

  const updateRegion = (region: string) => {
    setFilters(prev => ({ 
      ...prev, 
      region, 
      barangay: region === 'All Regions' ? null : prev.barangay 
    }))
  }

  const updateBarangay = (barangay: string | null) => {
    setFilters(prev => ({ ...prev, barangay }))
  }

  const refreshData = () => {
    setFilters(prev => ({ ...prev, refreshTrigger: prev.refreshTrigger + 1 }))
  }

  return (
    <FilterContext.Provider
      value={{
        filters,
        updateTimeRange,
        updateRegion,
        updateBarangay,
        refreshData
      }}
    >
      {children}
    </FilterContext.Provider>
  )
}