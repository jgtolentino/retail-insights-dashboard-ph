
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useRetailAnalytics = () => {
  const { data: topBrands, isLoading: brandsLoading } = useQuery({
    queryKey: ['top-brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transaction_items')
        .select(`
          subtotal,
          products (
            name,
            brands (
              name,
              is_tbwa_client
            )
          )
        `)
        .not('products.brands.name', 'is', null);

      if (error) throw error;

      // Aggregate sales by brand
      const brandSales: { [key: string]: { sales: number; is_tbwa_client: boolean } } = {};
      
      data.forEach(item => {
        const brandName = item.products?.brands?.name;
        const subtotal = item.subtotal || 0;
        const isTbwaClient = item.products?.brands?.is_tbwa_client || false;
        
        if (brandName) {
          if (!brandSales[brandName]) {
            brandSales[brandName] = { sales: 0, is_tbwa_client: isTbwaClient };
          }
          brandSales[brandName].sales += subtotal;
        }
      });

      return Object.entries(brandSales)
        .map(([name, data]) => ({
          name,
          sales: data.sales,
          is_tbwa_client: data.is_tbwa_client
        }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 6);
    }
  });

  const { data: totalStats, isLoading: statsLoading } = useQuery({
    queryKey: ['total-stats'],
    queryFn: async () => {
      // Get total revenue and transaction count
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('total_amount, items_count');

      if (error) throw error;

      const totalRevenue = transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);
      const totalTransactions = transactions.length;
      const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

      return {
        totalRevenue,
        totalTransactions,
        avgTransaction
      };
    }
  });

  return {
    topBrands: topBrands || [],
    totalStats: totalStats || { totalRevenue: 0, totalTransactions: 0, avgTransaction: 0 },
    isLoading: brandsLoading || statsLoading
  };
};
