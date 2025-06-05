import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { buildCompleteFilterQuery } from '../utils/buildCompleteFilterQuery';
import { useFilterStore } from '../stores/filterStore'; // Changed 'store' to 'stores'
import shallow from 'zustand/shallow';
import { supabase } from '@/integrations/supabase/client';

export interface TransactionData {
  id: number;
  total_amount: number;
  created_at: string;
  store_id: number;
  customer_id?: number;
  store?: {
    name: string;
    city: string;
    region: string;
  };
}

export interface PaginatedTransactionData {
  rows: TransactionData[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationInfo {
  pageNumber: number;
  pageSize: number;
}

export function useFilteredTransactions(paginationInfo: PaginationInfo) {
  const filterSelector = (s: ReturnType<typeof useFilterStore>) => ({
    startDate: s.startDate,
    endDate: s.endDate,
    selectedBrands: s.selectedBrands,
    selectedRegions: s.selectedRegions,
    minConfidence: s.minConfidence,
    // selectedStores and selectedCategories are not in the standard selector
  });

  const filters = useFilterStore(filterSelector, shallow);
  const query = useMemo(() => buildCompleteFilterQuery(filters), [filters]); // String for query key
  const stableQueryKey = useMemo(
    () => ['filteredTransactions', query, paginationInfo],
    [filters, paginationInfo]
  );

  return useQuery({
    queryKey: stableQueryKey,
    queryFn: async (): Promise<PaginatedTransactionData> => {
      const { pageNumber, pageSize } = paginationInfo;

      let transactionsQuery = supabase.from('transactions'); // Base query

      // Apply filters from useFilterStore
      if (filters.startDate && filters.endDate) {
        transactionsQuery = transactionsQuery
          .gte('interaction_date', filters.startDate)
          .lte('interaction_date', filters.endDate);
      }
      if (filters.selectedBrands && filters.selectedBrands.length > 0) {
        transactionsQuery = transactionsQuery.in('brand', filters.selectedBrands); // Assuming 'brand' column
      }
      if (filters.selectedRegions && filters.selectedRegions.length > 0) {
        transactionsQuery = transactionsQuery.in('region', filters.selectedRegions); // Assuming 'region' column
      }
      // selectedStores and selectedCategories from the old stableFilters are not in the standard `filters` object from the store via the standard selector.
      // If they need to be applied, filterSelector would need to include them or another mechanism would be required.
      if (filters.minConfidence !== undefined) {
        transactionsQuery = transactionsQuery.gte('nlp_confidence_score', filters.minConfidence);
      }

      // Get total count first
      const { count, error: countError } = await transactionsQuery.select('*', {
        // Count on the filtered query
        count: 'exact',
        head: true,
      });

      if (countError) {
        throw countError;
      }

      const totalCount = count || 0;

      // Get paginated data
      const startIndex = (pageNumber - 1) * pageSize;
      const endIndex = startIndex + pageSize - 1;

      const { data: transactions, error } = await transactionsQuery // Use the same filtered query for data selection
        .select(
          `
          id,
          total_amount,
          created_at,
          store_id,
          customer_id,
          stores (
            name,
            city,
            region
          )
        `
        )
        .order('created_at', { ascending: false })
        .range(startIndex, endIndex);

      if (error) {
        throw error;
      }

      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        rows: transactions || [],
        totalCount,
        pageNumber,
        pageSize,
        totalPages,
      };
    },
    staleTime: 1000 * 60, // 1 minute
    keepPreviousData: true,
    enabled: paginationInfo.pageNumber > 0 && paginationInfo.pageSize > 0,
  });
}
