import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { buildCompleteFilterQuery } from '../utils/buildCompleteFilterQuery';
import { useFilterStore } from '../stores/filterStore'; // Changed 'store' to 'stores'
import shallow from 'zustand/traditional';
import { supabase } from '@/integrations/supabase/client';

export interface SalesByBrandData {
  brand_id: string;
  brand_name: string;
  total_revenue: number;
  transaction_count: number;
}

export function useSalesByBrand() {
  /* -----------------------------------------
   Stable selector → memoised query string
------------------------------------------*/
  const filterSelector = (s: ReturnType<typeof useFilterStore>) => ({
    startDate: s.startDate,
    endDate: s.endDate,
    selectedBrands: s.selectedBrands,
    selectedRegions: s.selectedRegions,
    minConfidence: s.minConfidence,
  });

  const filters = useFilterStore(filterSelector, shallow); // filters from zustand
  const query = useMemo(() => buildCompleteFilterQuery(filters), [filters]); // SQL Query string
  const stableQueryKey = useMemo(() => ['salesByBrand', query], [filters]); // queryKey uses the SQL query string, dependent on filters

  return useQuery({
    queryKey: stableQueryKey,
    queryFn: async (): Promise<SalesByBrandData[]> => {
      let transactionsQuery = supabase.from('transactions').select('id, total_amount');

      if (filters.startDate && filters.endDate) {
        transactionsQuery = transactionsQuery
          .gte('interaction_date', filters.startDate)
          .lte('interaction_date', filters.endDate);
      }
      // Important: Verify the correct column names for brands and regions on the 'transactions' table.
      // buildCompleteFilterQuery used 'brand' and 'region'. Assuming these are direct columns.
      if (filters.selectedBrands && filters.selectedBrands.length > 0) {
        transactionsQuery = transactionsQuery.in('brand', filters.selectedBrands); // Or 'brand_id' if that's the column
      }
      if (filters.selectedRegions && filters.selectedRegions.length > 0) {
        transactionsQuery = transactionsQuery.in('region', filters.selectedRegions);
      }
      if (filters.minConfidence !== undefined) {
        transactionsQuery = transactionsQuery.gte('nlp_confidence_score', filters.minConfidence);
      }

      const { data: transactions, error: transactionError } = await transactionsQuery;

      if (transactionError) {
        throw transactionError;
      }

      if (!transactions || transactions.length === 0) {
        return [];
      }

      // Get transaction IDs for the next query
      const transactionIds = transactions.map(t => t.id);

      // Get transaction items without foreign key joins
      const { data: transactionItems, error: itemsError } = await supabase
        .from('transaction_items')
        .select('quantity, price, transaction_id, product_id, brand_id')
        .in('transaction_id', transactionIds);

      if (itemsError) {
        throw itemsError;
      }

      if (!transactionItems) {
        return [];
      }

      // Get unique brand IDs to fetch brand names
      const brandIds = [...new Set(transactionItems.map(item => item.brand_id).filter(Boolean))];

      // Get brand names separately
      const { data: brands, error: brandsError } = await supabase
        .from('brands')
        .select('id, name')
        .in('id', brandIds);

      if (brandsError) {
        throw brandsError;
      }

      // Create brand lookup map
      const brandLookup = new Map<number, string>();
      brands?.forEach(brand => {
        brandLookup.set(brand.id, brand.name);
      });

      // Calculate revenue by brand
      const brandRevenue = new Map<
        string,
        {
          brand_name: string;
          total_revenue: number;
          transaction_count: number;
          transactions: Set<number>;
        }
      >();

      transactionItems.forEach(item => {
        if (item.brand_id) {
          const brandId = item.brand_id.toString();
          const brandName = brandLookup.get(item.brand_id) || `Brand ${item.brand_id}`;
          const itemRevenue = (item.quantity || 0) * (item.price || 0);

          if (brandRevenue.has(brandId)) {
            const existing = brandRevenue.get(brandId)!;
            existing.total_revenue += itemRevenue;
            existing.transactions.add(item.transaction_id);
          } else {
            brandRevenue.set(brandId, {
              brand_name: brandName,
              total_revenue: itemRevenue,
              transaction_count: 0,
              transactions: new Set([item.transaction_id]),
            });
          }
        }
      });

      // Convert to array and add transaction counts
      const result: SalesByBrandData[] = Array.from(brandRevenue.entries())
        .map(([brand_id, data]) => ({
          brand_id,
          brand_name: data.brand_name,
          total_revenue: Math.round(data.total_revenue * 100) / 100,
          transaction_count: data.transactions.size,
        }))
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 10); // Top 10 brands

      return result;
    },
    staleTime: 1000 * 10, // 10 seconds - refresh more frequently for filtering
    refetchOnWindowFocus: false,
  });
}
