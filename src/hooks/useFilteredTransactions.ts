import { useQuery } from '@tanstack/react-query';
import { buildCompleteFilterQuery } from '@/lib/filterQueryHelper';
import { useFilterSelectors } from '@/stores/filterStore';

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
  const filters = useFilterSelectors.allFilters();
  
  return useQuery({
    queryKey: ['filteredTransactions', filters, paginationInfo],
    queryFn: async (): Promise<PaginatedTransactionData> => {
      const { pageNumber, pageSize } = paginationInfo;
      
      // Build the complete filtered query
      const baseQuery = await buildCompleteFilterQuery();
      
      // Get total count first
      const { count, error: countError } = await baseQuery
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        throw countError;
      }
      
      const totalCount = count || 0;
      
      // Get paginated data
      const startIndex = (pageNumber - 1) * pageSize;
      const endIndex = startIndex + pageSize - 1;
      
      const { data: transactions, error } = await baseQuery
        .select(`
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
        `)
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