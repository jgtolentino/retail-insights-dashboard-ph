import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RefreshCw, Calendar, MapPin } from 'lucide-react'
import { useFilters } from '@/contexts/FilterContext'

const PHILIPPINE_REGIONS = [
  'All Regions',
  'Metro Manila',
  'Central Luzon',
  'Central Visayas',
  'Western Visayas',
  'Northern Mindanao',
  'Davao Region',
  'Calabarzon',
  'Ilocos Region',
  'Bicol Region',
  'Eastern Visayas',
  'Zamboanga Peninsula',
  'Soccsksargen',
  'Caraga',
  'Cordillera'
]

export const FilterBar = () => {
  const { filters, updateTimeRange, updateRegion, refreshData } = useFilters()

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <h1 className="text-3xl font-bold text-gray-900">Retail Analytics Dashboard</h1>
      
      <div className="flex flex-wrap gap-2">
        {/* Time Range Buttons */}
        <div className="flex gap-1">
          <Button
            variant={filters.timeRange === 7 ? "default" : "outline"}
            size="sm"
            onClick={() => updateTimeRange(7)}
            className="flex items-center gap-1"
          >
            <Calendar className="h-3 w-3" />
            7 Days
          </Button>
          <Button
            variant={filters.timeRange === 30 ? "default" : "outline"}
            size="sm"
            onClick={() => updateTimeRange(30)}
            className="flex items-center gap-1"
          >
            <Calendar className="h-3 w-3" />
            30 Days
          </Button>
        </div>

        {/* Region Selector */}
        <Select value={filters.region} onValueChange={updateRegion}>
          <SelectTrigger className="w-[180px] h-9">
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              <SelectValue placeholder="Select region" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {PHILIPPINE_REGIONS.map((region) => (
              <SelectItem key={region} value={region}>
                {region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Refresh Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshData}
          className="flex items-center gap-1"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </Button>
      </div>
    </div>
  )
}