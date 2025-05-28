import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import type { ConsumerFilters } from '@/types/filters';
import { countActiveFilters } from '@/types/filters';

interface FiltersPanelProps {
  filters: ConsumerFilters;
  onChange: (updates: Partial<ConsumerFilters>) => void;
  onReset: () => void;
  className?: string;
}

export function FiltersPanel({ filters, onChange, onReset, className = '' }: FiltersPanelProps) {
  const [categories, setCategories] = useState<string[]>(['All']);
  const [brands, setBrands] = useState<string[]>(['All']);
  const [locations, setLocations] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filter Header with Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="font-medium">Filters</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFilterCount} active
            </Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Reset filters
          </Button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Category Filter */}
        <div className="space-y-2">
          <Label htmlFor="category-filter">Category</Label>
          <Select
            value={filters.category}
            onValueChange={(value) => onChange({ category: value })}
            disabled={loading}
          >
            <SelectTrigger 
              id="category-filter"
              className="w-full cursor-pointer"
              style={{ WebkitAppearance: 'none' }}
            >
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="z-50">
              {(categories || []).map((cat) => (
                <SelectItem key={cat} value={cat} className="cursor-pointer">
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
            onValueChange={(value) => onChange({ brand: value })}
            disabled={loading}
          >
            <SelectTrigger 
              id="brand-filter"
              className="w-full cursor-pointer"
              style={{ WebkitAppearance: 'none' }}
            >
              <SelectValue placeholder="Select brand" />
            </SelectTrigger>
            <SelectContent className="z-50">
              {(brands || []).map((brand) => (
                <SelectItem key={brand} value={brand} className="cursor-pointer">
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
            onValueChange={(value) => onChange({ location: value })}
            disabled={loading}
          >
            <SelectTrigger 
              id="location-filter"
              className="w-full cursor-pointer"
              style={{ WebkitAppearance: 'none' }}
            >
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent className="z-50">
              {(locations || []).map((loc) => (
                <SelectItem key={loc} value={loc} className="cursor-pointer">
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Weekday/Weekend Filter */}
        <div className="space-y-2">
          <Label>Day Type</Label>
          <RadioGroup
            value={filters.weekdayWeekend}
            onValueChange={(value: 'all' | 'weekday' | 'weekend') => 
              onChange({ weekdayWeekend: value })
            }
            disabled={loading}
            className="flex flex-col space-y-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all-days" className="cursor-pointer" />
              <Label htmlFor="all-days" className="cursor-pointer">All days</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="weekday" id="weekday" className="cursor-pointer" />
              <Label htmlFor="weekday" className="cursor-pointer">Weekdays</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="weekend" id="weekend" className="cursor-pointer" />
              <Label htmlFor="weekend" className="cursor-pointer">Weekends</Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </div>
  );
}