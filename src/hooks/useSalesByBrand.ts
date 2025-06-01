import { useQuery } from '@tanstack/react-query';
import { buildCompleteFilterQuery } from '@/lib/filterQueryHelper';
import { useFilterSelectors } from '@/stores/filterStore';
import { supabase } from '@/integrations/supabase/client';

export interface SalesByBrandData {
  brand_id: string;
  brand_name: string;
  total_revenue: number;
  transaction_count: number;
}

export function useSalesByBrand() {
  // Subscribe to all filters to trigger refetch when they change
  const filters = useFilterSelectors.allFilters();

  return useQuery({
    queryKey: ['salesByBrand', filters],
    queryFn: async (): Promise<SalesByBrandData[]> => {
      // Start with base filtered query
      const filteredQuery = await buildCompleteFilterQuery();
      
      // Get transaction data with revenue
      const { data: transactions, error: transactionError } = await filteredQuery
        .select('id, total_amount');
      
      if (transactionError) {
        throw transactionError;
      }

      if (!transactions || transactions.length === 0) {
        return [];
      }

      // Get transaction IDs for the next query
      const transactionIds = transactions.map(t => t.id);

      // Now get transaction items with brands for these transactions
      const { data: transactionItems, error: itemsError } = await supabase
        .from('transaction_items')
        .select(`
          quantity,
          price,
          transaction_id,
          products!inner (
            id,
            brand_id,
            brands!inner (
              id,
              name
            )
          )
        `)
        .in('transaction_id', transactionIds);

      if (itemsError) {
        throw itemsError;
      }

      if (!transactionItems) {
        return [];
      }

      // Calculate revenue by brand
      const brandRevenue = new Map<string, { 
        brand_name: string; 
        total_revenue: number; 
        transaction_count: number; 
        transactions: Set<number>;
      }>();

      transactionItems.forEach(item => {
        if (item.products?.brands) {
          const brandId = item.products.brands.id.toString();
          const brandName = item.products.brands.name;
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
              transactions: new Set([item.transaction_id])
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
    staleTime: 1000 * 60 * 5, // 5 minutes
    keepPreviousData: true,
  });
}