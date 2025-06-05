import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useFilterStore, useFilterActions } from '@/stores/filterStore';
import { useBrands } from '@/hooks/useBrands';
import Select, { MultiValue, Options } from 'react-select';
import { supabase } from '@/integrations/supabase/client';

const toOptions = (arr: string[]): Options<{ label: string; value: string }> =>
  arr.map(v => ({ label: v, value: v }));

export function GlobalFiltersPanel() {
  // Debug render counter to identify infinite loops
  const renderCount = useRef(0);
  renderCount.current += 1;

  // Use the correct filter store (not the old FilterContext)
  const selectedBrands = useFilterStore(state => state.selectedBrands);
  const selectedCategories = useFilterStore(state => state.selectedCategories);
  const selectedRegions = useFilterStore(state => state.selectedRegions);
  const selectedStores = useFilterStore(state => state.selectedStores);

  const {
    setSelectedBrands,
    setSelectedCategories,
    setSelectedRegions,
    setSelectedStores,
    resetAllFilters,
  } = useFilterActions();

  // Fetch dynamic brand data from Supabase
  const { data: allBrands = [], isLoading: brandsLoading } = useBrands();

  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [allRegions, setAllRegions] = useState<string[]>([]);
  const [allStores, setAllStores] = useState<string[]>([]);

  // 🔥 FIX: Memoize toOptions calls to prevent new object creation on every render
  const categoryOptions = useMemo(() => toOptions(allCategories), [allCategories]);
  const brandOptions = useMemo(() => toOptions(allBrands), [allBrands]);
  const regionOptions = useMemo(() => toOptions(allRegions), [allRegions]);
  const storeOptions = useMemo(() => toOptions(allStores), [allStores]);

  // 🔥 FIX: Memoize selected values to prevent new object creation on every render
  const selectedCategoryValues = useMemo(() => toOptions(selectedCategories), [selectedCategories]);
  const selectedBrandValues = useMemo(() => toOptions(selectedBrands), [selectedBrands]);
  const selectedRegionValues = useMemo(() => toOptions(selectedRegions), [selectedRegions]);
  const selectedStoreValues = useMemo(() => toOptions(selectedStores), [selectedStores]);

  // Stabilize callback functions to prevent unnecessary re-renders
  const handleCategoriesChange = useCallback(
    (vals: MultiValue<{ label: string; value: string }>) =>
      setSelectedCategories(vals.map(v => v.value)),
    [setSelectedCategories]
  );

  const handleBrandsChange = useCallback(
    (vals: MultiValue<{ label: string; value: string }>) =>
      setSelectedBrands(vals.map(v => v.value)),
    [setSelectedBrands]
  );

  const handleRegionsChange = useCallback(
    (vals: MultiValue<{ label: string; value: string }>) =>
      setSelectedRegions(vals.map(v => v.value)),
    [setSelectedRegions]
  );

  const handleStoresChange = useCallback(
    (vals: MultiValue<{ label: string; value: string }>) =>
      setSelectedStores(vals.map(v => v.value)),
    [setSelectedStores]
  );

  useEffect(() => {
    // Fetch dynamic categories from brands table instead (products table has no category column)
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('brands')
        .select('category')
        .neq('category', null);

      if (!error && data) {
        const uniqueCategories = [...new Set(data.map(b => b.category).filter(Boolean))].sort();
        setAllCategories(uniqueCategories);
      } else {
        // Fallback to common categories if brands query fails
        setAllCategories(['Dairy', 'Beverages', 'Snacks', 'Personal Care', 'Household']);
      }
    };

    // Fetch dynamic regions from Supabase
    const fetchRegions = async () => {
      const { data, error } = await supabase.from('customers').select('region').neq('region', null);

      if (!error && data) {
        const uniqueRegions = [...new Set(data.map(c => c.region).filter(Boolean))].sort();
        setAllRegions(uniqueRegions);
      }
    };

    // Fetch dynamic stores from Supabase
    const fetchStores = async () => {
      const { data, error } = await supabase.from('stores').select('name').neq('name', null);

      if (!error && data) {
        const uniqueStores = [...new Set(data.map(s => s.name).filter(Boolean))].sort();
        setAllStores(uniqueStores);
      }
    };

    fetchCategories();
    fetchRegions();
    fetchStores();
  }, []);

  // Debug logging after all hooks are called (rules of hooks compliance)
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 GlobalFiltersPanel rendered ${renderCount.current} times`);

    // Safety break for infinite loops
    if (renderCount.current > 100) {
      console.error('🚨 INFINITE LOOP DETECTED in GlobalFiltersPanel!');
      return <div>Infinite loop detected in GlobalFiltersPanel - check console</div>;
    }
  }

  return (
    <div className="flex flex-wrap items-start gap-6 rounded bg-white p-4 shadow">
      <div className="w-56">
        <label className="mb-1 block text-sm font-medium text-gray-700">Categories</label>
        <Select
          isMulti
          options={categoryOptions}
          value={selectedCategoryValues}
          onChange={handleCategoriesChange}
          placeholder="All categories…"
          data-testid="category-filter"
        />
      </div>

      <div className="w-56">
        <label className="mb-1 block text-sm font-medium text-gray-700">Brands</label>
        <Select
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
        <label className="mb-1 block text-sm font-medium text-gray-700">Regions</label>
        <Select
          isMulti
          options={regionOptions}
          value={selectedRegionValues}
          onChange={handleRegionsChange}
          placeholder="All regions…"
        />
      </div>

      <div className="w-56">
        <label className="mb-1 block text-sm font-medium text-gray-700">Stores</label>
        <Select
          isMulti
          options={storeOptions}
          value={selectedStoreValues}
          onChange={handleStoresChange}
          placeholder="All stores…"
        />
      </div>

      <button
        onClick={resetAllFilters}
        className="ml-auto mt-6 rounded bg-red-50 px-3 py-1 text-red-700"
      >
        Reset All
      </button>
    </div>
  );
}
