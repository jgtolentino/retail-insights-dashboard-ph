import React, { useState, useMemo } from 'react';
import { X, Search, Filter, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useGlobalFilters } from '@/hooks/useGlobalFilters';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FilterSection {
  title: string;
  key: 'brands' | 'regions' | 'categories' | 'stores';
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
  searchable?: boolean;
}

export function FilterDrawer() {
  const {
    isFilterDrawerOpen,
    closeFilterDrawer,
    selectedBrands,
    selectedRegions,
    selectedCategories,
    selectedStores,
    toggleBrand,
    toggleRegion,
    toggleCategory,
    toggleStore,
    resetFilters,
    hasActiveFilters,
    getFilterSummary
  } = useGlobalFilters();

  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    brands: true,
    regions: true,
    categories: true,
    stores: false
  });

  // Fetch filter options
  const { data: filterOptions } = useQuery({
    queryKey: ['filter-options'],
    queryFn: async () => {
      const [brandsResult, regionsResult, categoriesResult, storesResult] = await Promise.all([
        supabase.from('products').select('brand').not('brand', 'is', null),
        supabase.from('transactions').select('store_location').not('store_location', 'is', null),
        supabase.from('products').select('category').not('category', 'is', null),
        supabase.from('transactions').select('store_id').not('store_id', 'is', null)
      ]);

      return {
        brands: [...new Set(brandsResult.data?.map(p => p.brand) || [])].sort(),
        regions: [...new Set(regionsResult.data?.map(t => {
          const location = t.store_location?.split(',')[0]?.trim();
          return location;
        }).filter(Boolean) || [])].sort(),
        categories: [...new Set(categoriesResult.data?.map(p => p.category) || [])].sort(),
        stores: [...new Set(storesResult.data?.map(t => `Store ${t.store_id}`) || [])].sort()
      };
    }
  });

  const filterSections: FilterSection[] = useMemo(() => [
    {
      title: 'Brands',
      key: 'brands',
      items: filterOptions?.brands || [],
      selected: selectedBrands,
      onToggle: toggleBrand,
      searchable: true
    },
    {
      title: 'Regions',
      key: 'regions', 
      items: filterOptions?.regions || [],
      selected: selectedRegions,
      onToggle: toggleRegion,
      searchable: true
    },
    {
      title: 'Categories',
      key: 'categories',
      items: filterOptions?.categories || [],
      selected: selectedCategories,
      onToggle: toggleCategory,
      searchable: false
    },
    {
      title: 'Stores',
      key: 'stores',
      items: filterOptions?.stores || [],
      selected: selectedStores,
      onToggle: toggleStore,
      searchable: true
    }
  ], [filterOptions, selectedBrands, selectedRegions, selectedCategories, selectedStores]);

  const filteredItems = (section: FilterSection) => {
    const searchTerm = searchTerms[section.key] || '';
    if (!searchTerm || !section.searchable) return section.items;
    
    return section.items.filter(item => 
      item.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!isFilterDrawerOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={closeFilterDrawer}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={closeFilterDrawer}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Filter Summary */}
          {hasActiveFilters() && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Active Filters
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {getFilterSummary()}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resetFilters}
                  className="text-blue-600 border-blue-200 hover:bg-blue-100"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              </div>
            </div>
          )}

          {/* Filter Sections */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {filterSections.map((section) => (
                <Collapsible
                  key={section.key}
                  open={expandedSections[section.key]}
                  onOpenChange={() => toggleSection(section.key)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-2 h-auto font-medium text-left"
                    >
                      <div className="flex items-center space-x-2">
                        <span>{section.title}</span>
                        {section.selected.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {section.selected.length}
                          </Badge>
                        )}
                      </div>
                      {expandedSections[section.key] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="space-y-2">
                    {/* Search */}
                    {section.searchable && (
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder={`Search ${section.title.toLowerCase()}...`}
                          value={searchTerms[section.key] || ''}
                          onChange={(e) => setSearchTerms(prev => ({
                            ...prev,
                            [section.key]: e.target.value
                          }))}
                          className="pl-9 text-sm"
                        />
                      </div>
                    )}

                    {/* Items */}
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {filteredItems(section).map((item) => (
                        <div
                          key={item}
                          className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                          onClick={() => section.onToggle(item)}
                        >
                          <Checkbox
                            checked={section.selected.includes(item)}
                            onChange={() => section.onToggle(item)}
                            className="pointer-events-none"
                          />
                          <Label className="text-sm cursor-pointer flex-1">
                            {item}
                          </Label>
                        </div>
                      ))}
                      
                      {filteredItems(section).length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No {section.title.toLowerCase()} found
                        </p>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </ScrollArea>

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <Button 
              onClick={closeFilterDrawer}
              className="w-full"
              size="sm"
            >
              Apply Filters
            </Button>
            
            {hasActiveFilters() && (
              <Button 
                variant="outline" 
                onClick={resetFilters}
                className="w-full"
                size="sm"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear All Filters
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}