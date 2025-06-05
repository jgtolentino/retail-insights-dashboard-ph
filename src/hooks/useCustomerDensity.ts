import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDashboardStore } from '@/stores/dashboardStore';
import { shallow } from 'zustand/shallow';

export interface CustomerDensityData {
  area_name: string;
  area_type: 'barangay' | 'city' | 'province';
  latitude: number;
  longitude: number;
  transactions: number;
  revenue: number;
  unique_customers: number;
  avg_transaction_value: number;
}

// Mock location data for Philippines areas
const philippinesLocations = {
  province: [
    { name: 'Metro Manila', lat: 14.5995, lng: 120.9842 },
    { name: 'Cebu', lat: 10.3157, lng: 123.8854 },
    { name: 'Davao del Sur', lat: 6.8277, lng: 125.3954 },
    { name: 'Cavite', lat: 14.2456, lng: 120.8786 },
    { name: 'Bulacan', lat: 14.8527, lng: 120.816 },
    { name: 'Rizal', lat: 14.6037, lng: 121.3084 },
    { name: 'Laguna', lat: 14.1407, lng: 121.4692 },
    { name: 'Pampanga', lat: 15.0794, lng: 120.62 },
    { name: 'Batangas', lat: 13.9464, lng: 121.1655 },
    { name: 'Negros Occidental', lat: 10.2926, lng: 123.0247 },
  ],
  city: [
    { name: 'Quezon City', lat: 14.676, lng: 121.0437 },
    { name: 'Manila', lat: 14.5995, lng: 120.9842 },
    { name: 'Makati', lat: 14.5547, lng: 121.0244 },
    { name: 'Pasig', lat: 14.5764, lng: 121.0851 },
    { name: 'Taguig', lat: 14.5176, lng: 121.0509 },
    { name: 'Caloocan', lat: 14.6576, lng: 120.9835 },
    { name: 'Cebu City', lat: 10.3157, lng: 123.8854 },
    { name: 'Davao City', lat: 7.1907, lng: 125.4553 },
    { name: 'Antipolo', lat: 14.5842, lng: 121.1763 },
    { name: 'Pasay', lat: 14.5378, lng: 121.0014 },
  ],
  barangay: [
    { name: 'Poblacion, Makati', lat: 14.5651, lng: 121.0341 },
    { name: 'BGC, Taguig', lat: 14.5464, lng: 121.045 },
    { name: 'Cubao, Quezon City', lat: 14.6177, lng: 121.0524 },
    { name: 'Ermita, Manila', lat: 14.5823, lng: 120.9748 },
    { name: 'Lahug, Cebu City', lat: 10.3303, lng: 123.8999 },
    { name: 'Ortigas, Pasig', lat: 14.5873, lng: 121.0615 },
    { name: 'Alabang, Muntinlupa', lat: 14.4166, lng: 121.0447 },
    { name: 'Eastwood, Quezon City', lat: 14.611, lng: 121.0793 },
    { name: 'Greenhills, San Juan', lat: 14.6019, lng: 121.0355 },
    { name: 'Malate, Manila', lat: 14.5706, lng: 120.9904 },
  ],
};

export function useCustomerDensity(aggregationLevel: 'barangay' | 'city' | 'province' = 'city') {
  // Subscribe to filters from new Zustand store
  const filters = useDashboardStore(state => state.filters, shallow);

  // Filters are already memoized in the store
  const stableFilters = useMemo(
    () => ({
      dateRange: filters.dateRange,
      selectedBrands: filters.selectedBrands,
      selectedCategories: filters.selectedCategories,
      selectedRegions: filters.selectedRegions,
    }),
    [filters]
  );

  // Stabilize the query key to prevent unnecessary re-renders
  const stableQueryKey = useMemo(
    () => ['customerDensity', aggregationLevel, JSON.stringify(stableFilters)],
    [aggregationLevel, stableFilters]
  );

  return useQuery({
    queryKey: stableQueryKey,
    queryFn: async () => {
      // Get all transactions with customer and store data
      let query = supabase.from('transactions').select(`
          id,
          total_amount,
          customer_age,
          store_location,
          created_at
        `);

      // Apply date range filter
      if (stableFilters.dateRange.start) {
        query = query.gte('created_at', stableFilters.dateRange.start);
      }
      if (stableFilters.dateRange.end) {
        query = query.lte('created_at', stableFilters.dateRange.end);
      }

      // Note: Region filter is applied after fetching since we need to check the stores relationship

      const { data: transactions, error } = await query;

      if (error) {
        console.error('Error fetching customer density:', error);
        throw error;
      }

      if (!transactions || transactions.length === 0) return [];

      // Apply region filter if needed by parsing store_location
      let regionFilteredTransactions = transactions;
      if (stableFilters.selectedRegions.length > 0) {
        regionFilteredTransactions = transactions.filter(transaction => {
          const locationParts = transaction.store_location?.split(',') || [];
          const region = locationParts.length > 1 ? locationParts[1].trim() : '';
          return stableFilters.selectedRegions.includes(region);
        });
      }

      // Apply brand/category filters if needed
      let filteredTransactions = regionFilteredTransactions;

      if (stableFilters.selectedBrands.length > 0 || stableFilters.selectedCategories.length > 0) {
        let itemsQuery = supabase
          .from('transaction_items')
          .select('transaction_id, brand_id, category');

        if (stableFilters.selectedBrands.length > 0) {
          itemsQuery = itemsQuery.in(
            'brand_id',
            stableFilters.selectedBrands.map(b => parseInt(b))
          );
        }

        if (stableFilters.selectedCategories.length > 0) {
          itemsQuery = itemsQuery.in('category', stableFilters.selectedCategories);
        }

        const { data: filteredItems } = await itemsQuery;

        if (filteredItems) {
          const validTransactionIds = new Set(filteredItems.map(item => item.transaction_id));
          filteredTransactions = regionFilteredTransactions.filter(t =>
            validTransactionIds.has(t.id)
          );
        }
      }

      // Get locations for the selected aggregation level
      const locations = philippinesLocations[aggregationLevel];

      // Simulate customer density data based on transaction patterns
      const densityData: CustomerDensityData[] = locations.map((location, index) => {
        // Simulate different density patterns
        const baseDensity = Math.random() * 0.8 + 0.2; // 0.2-1.0
        const isMetroManila =
          location.name.includes('Manila') ||
          location.name.includes('Makati') ||
          location.name.includes('Quezon City') ||
          location.name.includes('BGC') ||
          location.name.includes('Taguig');

        const densityMultiplier = isMetroManila ? 2.5 : 1;

        // Calculate metrics based on filtered transactions
        const locationTransactions = Math.floor(
          (filteredTransactions.length / locations.length) * baseDensity * densityMultiplier
        );

        const revenue =
          filteredTransactions
            .slice(
              index * Math.floor(filteredTransactions.length / locations.length),
              (index + 1) * Math.floor(filteredTransactions.length / locations.length)
            )
            .reduce((sum, t) => sum + (t.total_amount || 0), 0) *
          baseDensity *
          densityMultiplier;

        const uniqueCustomers = Math.floor(locationTransactions * 0.7); // 70% unique customer rate

        return {
          area_name: location.name,
          area_type: aggregationLevel,
          latitude: location.lat + (Math.random() - 0.5) * 0.1, // Add slight randomization
          longitude: location.lng + (Math.random() - 0.5) * 0.1,
          transactions: locationTransactions,
          revenue: Math.round(revenue * 100) / 100,
          unique_customers: uniqueCustomers,
          avg_transaction_value:
            locationTransactions > 0 ? Math.round((revenue / locationTransactions) * 100) / 100 : 0,
        };
      });

      // Sort by transaction volume
      return densityData.sort((a, b) => b.transactions - a.transactions);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}
