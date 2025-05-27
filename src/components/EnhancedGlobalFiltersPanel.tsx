import { useState, useEffect } from 'react';
import { useFilters } from '@/contexts/EnhancedFilterContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Filter, RotateCcw, Info } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { countActiveFilters } from '@/types/filters';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function EnhancedGlobalFiltersPanel({ className = '' }: { className?: string }) {
  const { filters, setFilters, resetFilters, isFilterRelevant } = useFilters();
  const [categories, setCategories] = useState<string[]>(['All']);
  const [brands, setBrands] = useState<string[]>(['All']);
  const [locations, setLocations] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    setLoading(true);
    try {
      const [categoryData, brandData, locationData] = await Promise.all([
        supabase.from('products').select('category').not('category', 'is', null).order('category'),
        supabase.from('brands').select('name').order('name'),
        supabase.from('stores').select('province').not('province', 'is', null).order('province')
      ]);
      
      const uniqueCategories = [...new Set(categoryData.data?.map(p => p.category) || [])];
      setCategories(['All', ...uniqueCategories]);
      
      setBrands(['All', ...(brandData.data?.map(b => b.name) || [])]);
      
      const uniqueLocations = [...new Set(locationData.data?.map(s => s.province) || [])];
      setLocations(['All', ...uniqueLocations]);
    } catch (error) {
      console.error('Error loading filter options:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeFilterCount = countActiveFilters(filters);
  
  const formatDateRange = () => {
    if (!filters.dateRange.start || !filters.dateRange.end) return 'Select dates';
    const start = new Date(filters.dateRange.start).toLocaleDateString();
    const end = new Date(filters.dateRange.end).toLocaleDateString();
    return `${start} - ${end}`;
  };

  // Helper to determine if a filter should be disabled
  const isFilterDisabled = (filterName: keyof typeof filters): boolean => {
    return !isFilterRelevant(filterName);
  };

  return (
    <TooltipProvider>
      <Card className={`p-4 ${className}`}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-lg">Global Filters</h3>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilterCount} active
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">Filters automatically sync to URL and persist between sessions</p>
                </TooltipContent>
              </Tooltip>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="flex items-center gap-2"
                disabled={activeFilterCount === 0}
              >
                <RotateCcw className="h-4 w-4" />
                Reset All
              </Button>
            </div>
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Date Range - Always relevant */}
            <div className={cn("space-y-2", !isFilterRelevant('dateRange') && "opacity-50")}>
              <Label className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Date Range
              </Label>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  disabled={isFilterDisabled('dateRange')}
                >
                  {formatDateRange()}
                </Button>
                {showDatePicker && (
                  <div className="space-y-2 p-2 border rounded-md bg-white shadow-lg">
                    <div>
                      <Label htmlFor="start-date" className="text-xs">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={filters.dateRange.start}
                        onChange={(e) => setFilters({
                          dateRange: { ...filters.dateRange, start: e.target.value }
                        })}
                        className="w-full"
                        max="2025-05-30"
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-date" className="text-xs">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={filters.dateRange.end}
                        onChange={(e) => setFilters({
                          dateRange: { ...filters.dateRange, end: e.target.value }
                        })}
                        className="w-full"
                        min={filters.dateRange.start}
                        max="2025-05-30"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setShowDatePicker(false)}
                      className="w-full"
                    >
                      Apply
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div className={cn("space-y-2", !isFilterRelevant('category') && "opacity-50")}>
              <Label htmlFor="category-filter">
                Category
                {!isFilterRelevant('category') && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 inline-block ml-1 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Not used on this page</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </Label>
              <Select
                value={filters.category}
                onValueChange={(value) => setFilters({ category: value })}
                disabled={loading || isFilterDisabled('category')}
              >
                <SelectTrigger id="category-filter" className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Brand Filter */}
            <div className={cn("space-y-2", !isFilterRelevant('brand') && "opacity-50")}>
              <Label htmlFor="brand-filter">
                Brand
                {!isFilterRelevant('brand') && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 inline-block ml-1 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Not used on this page</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </Label>
              <Select
                value={filters.brand}
                onValueChange={(value) => setFilters({ brand: value })}
                disabled={loading || isFilterDisabled('brand')}
              >
                <SelectTrigger id="brand-filter" className="w-full">
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location Filter */}
            <div className={cn("space-y-2", !isFilterRelevant('location') && "opacity-50")}>
              <Label htmlFor="location-filter">
                Location
                {!isFilterRelevant('location') && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 inline-block ml-1 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Not used on this page</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </Label>
              <Select
                value={filters.location}
                onValueChange={(value) => setFilters({ location: value })}
                disabled={loading || isFilterDisabled('location')}
              >
                <SelectTrigger id="location-filter" className="w-full">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Day Type Filter */}
            <div className={cn("space-y-2", !isFilterRelevant('weekdayWeekend') && "opacity-50")}>
              <Label>
                Day Type
                {!isFilterRelevant('weekdayWeekend') && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 inline-block ml-1 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Not used on this page</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </Label>
              <RadioGroup
                value={filters.weekdayWeekend}
                onValueChange={(value: 'all' | 'weekday' | 'weekend') => 
                  setFilters({ weekdayWeekend: value })
                }
                disabled={loading || isFilterDisabled('weekdayWeekend')}
                className="flex flex-row gap-3"
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="all" id="all-days" />
                  <Label htmlFor="all-days" className="text-sm cursor-pointer">All</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="weekday" id="weekday" />
                  <Label htmlFor="weekday" className="text-sm cursor-pointer">Weekday</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="weekend" id="weekend" />
                  <Label htmlFor="weekend" className="text-sm cursor-pointer">Weekend</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
}