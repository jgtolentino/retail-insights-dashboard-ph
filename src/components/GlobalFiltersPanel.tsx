import { useEffect, useState } from 'react';
import { useFilterStore, useFilterActions } from '@/stores/filterStore';
import { useBrands } from '@/hooks/useBrands';
import Select, { MultiValue, Options } from 'react-select';
import { supabase } from '@/integrations/supabase/client';

const toOptions = (arr: string[]): Options<{ label: string; value: string }> =>
  arr.map(v => ({ label: v, value: v }));

export function GlobalFiltersPanel() {
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

  return (
    <div className="flex flex-wrap items-start gap-6 rounded bg-white p-4 shadow">
      <div className="w-56">
        <label className="mb-1 block text-sm font-medium text-gray-700">Categories</label>
        <Select
          isMulti
          options={toOptions(allCategories)}
          value={toOptions(selectedCategories)}
          onChange={(vals: MultiValue<any>) => setSelectedCategories(vals.map(v => v.value))}
          placeholder="All categories…"
          data-testid="category-filter"
        />
      </div>

      <div className="w-56">
        <label className="mb-1 block text-sm font-medium text-gray-700">Brands</label>
        <Select
          isMulti
          isLoading={brandsLoading}
          options={toOptions(allBrands)}
          value={toOptions(selectedBrands)}
          onChange={(vals: MultiValue<any>) => setSelectedBrands(vals.map(v => v.value))}
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
          options={toOptions(allRegions)}
          value={toOptions(selectedRegions)}
          onChange={(vals: MultiValue<any>) => setSelectedRegions(vals.map(v => v.value))}
          placeholder="All regions…"
        />
      </div>

      <div className="w-56">
        <label className="mb-1 block text-sm font-medium text-gray-700">Stores</label>
        <Select
          isMulti
          options={toOptions(allStores)}
          value={toOptions(selectedStores)}
          onChange={(vals: MultiValue<any>) => setSelectedStores(vals.map(v => v.value))}
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
