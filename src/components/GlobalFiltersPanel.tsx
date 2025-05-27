import { useState, useEffect } from 'react';
import { useFilters } from '@/contexts/FilterContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Filter, RotateCcw } from 'lucide-react';
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

export function GlobalFiltersPanel({ className = '' }: { className?: string }) {
  const { filters, setFilters, resetFilters } = useFilters();
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
      // Load categories
      const { data: categoryData } = await supabase
        .from('products')
        .select('category')
        .not('category', 'is', null)
        .order('category');
      
      const uniqueCategories = [...new Set(categoryData?.map(p => p.category) || [])];
      setCategories(['All', ...uniqueCategories]);

      // Load brands
      const { data: brandData } = await supabase
        .from('brands')
        .select('name')
        .order('name');
      
      setBrands(['All', ...(brandData?.map(b => b.name) || [])]);

      // Load locations (provinces)
      const { data: locationData } = await supabase
        .from('stores')
        .select('province')
        .not('province', 'is', null)
        .order('province');
      
      const uniqueLocations = [...new Set(locationData?.map(s => s.province) || [])];
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

  return (
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

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Date Range */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Date Range
            </Label>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start text-left"
                onClick={() => setShowDatePicker(!showDatePicker)}
              >
                {formatDateRange()}
              </Button>
              {showDatePicker && (
                <div className="space-y-2 p-2 border rounded-md bg-white">
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
          <div className="space-y-2">
            <Label htmlFor="category-filter">Category</Label>
            <Select
              value={filters.category}
              onValueChange={(value) => setFilters({ category: value })}
              disabled={loading}
            >
              <SelectTrigger 
                id="category-filter"
                className="w-full"
              >
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
          <div className="space-y-2">
            <Label htmlFor="brand-filter">Brand</Label>
            <Select
              value={filters.brand}
              onValueChange={(value) => setFilters({ brand: value })}
              disabled={loading}
            >
              <SelectTrigger 
                id="brand-filter"
                className="w-full"
              >
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
          <div className="space-y-2">
            <Label htmlFor="location-filter">Location</Label>
            <Select
              value={filters.location}
              onValueChange={(value) => setFilters({ location: value })}
              disabled={loading}
            >
              <SelectTrigger 
                id="location-filter"
                className="w-full"
              >
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
          <div className="space-y-2">
            <Label>Day Type</Label>
            <RadioGroup
              value={filters.weekdayWeekend}
              onValueChange={(value: 'all' | 'weekday' | 'weekend') => 
                setFilters({ weekdayWeekend: value })
              }
              disabled={loading}
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
  );
}