import { useEffect, useState, useMemo } from 'react';
import { useDashboardStore, useFilters, useFilterActions } from '@/stores/dashboardStore';
import { useEmergencyRenderLimit } from '@/hooks/debugging/useEmergencyRenderLimit';
import { useBrands } from '@/hooks/useBrands';
import Select, { MultiValue, Options } from 'react-select';
import { supabase } from '@/integrations/supabase/client';

const toOptions = (arr: string[]): Options<{ label: string; value: string }> =>
  arr.map(v => ({ label: v, value: v }));

export function GlobalFiltersPanel() {
  // 🚨 EMERGENCY: Prevent infinite loops from crashing browser
  useEmergencyRenderLimit('GlobalFiltersPanel');

  // 🔍 DEBUGGING: Monitor renders for infinite loop detection
  // Debug hook removed: useRenderMonitor

  // ✅ NEW ARCHITECTURE: Direct Zustand store access (no prop drilling!)
  const filters = useFilters();
  const { updateFilters, resetFilters } = useFilterActions();

  // Track what causes re-renders (development only)
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log('Filter panel render - store subscription');
  }

  // Fetch dynamic brand data from Supabase
  const { data: allBrands = [], isLoading: brandsLoading } = useBrands();

  // Local state for dropdown options (not reactive, just data)
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [allRegions, setAllRegions] = useState<string[]>([]);
  const [allStores, setAllStores] = useState<string[]>([]);

  // ✅ FIXED: Memoize ALL options to prevent new objects every render
  const categoryOptions = useMemo(() => toOptions(allCategories), [allCategories]);
  const brandOptions = useMemo(() => toOptions(allBrands), [allBrands]);
  const regionOptions = useMemo(() => toOptions(allRegions), [allRegions]);
  const storeOptions = useMemo(() => toOptions(allStores), [allStores]);

  // ✅ FIXED: Memoize selected values (these were the main culprits!)
  const selectedCategoryValues = useMemo(() => toOptions(filters.categories), [filters.categories]);
  const selectedBrandValues = useMemo(() => toOptions(filters.brands), [filters.brands]);
  const selectedRegionValues = useMemo(() => toOptions(filters.regions), [filters.regions]);
  const selectedStoreValues = useMemo(() => toOptions(filters.stores), [filters.stores]);

  // ✅ NEW PATTERN: Direct store updates (no useEffect, no callback deps!)
  const handleCategoriesChange = (vals: MultiValue<{ label: string; value: string }>) => {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log('Filter change - categories');
    }
    updateFilters({ categories: vals.map(v => v.value) });
  };

  const handleBrandsChange = (vals: MultiValue<{ label: string; value: string }>) => {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log('Filter change - brands');
    }
    updateFilters({ brands: vals.map(v => v.value) });
  };

  const handleRegionsChange = (vals: MultiValue<{ label: string; value: string }>) => {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log('Filter change - regions');
    }
    updateFilters({ regions: vals.map(v => v.value) });
  };

  const handleStoresChange = (vals: MultiValue<{ label: string; value: string }>) => {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log('Filter change - stores');
    }
    updateFilters({ stores: vals.map(v => v.value) });
  };

  // ✅ DATA FETCHING: Only runs once, no dependencies on reactive state
  useEffect(() => {
    const fetchAllData = async () => {
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log('GlobalFiltersPanel - data-fetch');
      }

      try {
        // Fetch categories
        const { data: categoriesData } = await supabase
          .from('brands')
          .select('category')
          .neq('category', null);

        if (categoriesData) {
          const uniqueCategories = [
            ...new Set(categoriesData.map(b => b.category).filter(Boolean)),
          ].sort();
          setAllCategories(uniqueCategories);
        }

        // Fetch regions
        const { data: regionsData } = await supabase
          .from('customers')
          .select('region')
          .neq('region', null);

        if (regionsData) {
          const uniqueRegions = [...new Set(regionsData.map(c => c.region).filter(Boolean))].sort();
          setAllRegions(uniqueRegions);
        }

        // Fetch stores
        const { data: storesData } = await supabase.from('stores').select('name').neq('name', null);

        if (storesData) {
          const uniqueStores = [...new Set(storesData.map(s => s.name).filter(Boolean))].sort();
          setAllStores(uniqueStores);
        }
      } catch (error) {
        // Fallback data
        setAllCategories(['Dairy', 'Beverages', 'Snacks', 'Personal Care', 'Household']);
      }
    };

    fetchAllData();
  }, []); // ✅ NO DEPENDENCIES - runs once only

  return (
    <div className="flex flex-wrap items-start gap-6 rounded bg-white p-4 shadow">
      <div className="w-56">
        <label htmlFor="category-filter" className="mb-1 block text-sm font-medium text-gray-700">Categories</label>
        <Select
          id="category-filter"
          isMulti
          options={categoryOptions}
          value={selectedCategoryValues}
          onChange={handleCategoriesChange}
          placeholder="All categories…"
          data-testid="category-filter"
        />
      </div>

      <div className="w-56">
        <label htmlFor="brand-filter" className="mb-1 block text-sm font-medium text-gray-700">Brands</label>
        <Select
          id="brand-filter"
          isMulti
          isLoading={brandsLoading}
          options={brandOptions}
          value={selectedBrandValues}
          onChange={handleBrandsChange}
          placeholder={
            brandsLoading ? 'Loading brands...' : `All brands (${allBrands.length} available)…`
          }
          data-testid="brand-filter"
          className="brand-filter"
        />
      </div>

      <div className="w-56">
        <label htmlFor="region-filter" className="mb-1 block text-sm font-medium text-gray-700">Regions</label>
        <Select
          id="region-filter"
          isMulti
          options={regionOptions}
          value={selectedRegionValues}
          onChange={handleRegionsChange}
          placeholder="All regions…"
        />
      </div>

      <div className="w-56">
        <label htmlFor="store-filter" className="mb-1 block text-sm font-medium text-gray-700">Stores</label>
        <Select
          id="store-filter"
          isMulti
          options={storeOptions}
          value={selectedStoreValues}
          onChange={handleStoresChange}
          placeholder="All stores…"
        />
      </div>

      <button
        onClick={resetFilters}
        className="ml-auto mt-6 rounded bg-red-50 px-3 py-1 text-red-700"
      >
        Reset All
      </button>
    </div>
  );
}
