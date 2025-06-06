import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RealBrandData {
  id: string;
  name: string;
  revenue: number;
  transactions: number;
  marketShare: number;
  growth: number;
  isTBWA: boolean;
  category: string;
  avgTransactionValue: number;
}

export function useRealBrandData() {
  return useQuery({
    queryKey: ['real-brand-data'],
    queryFn: async (): Promise<RealBrandData[]> => {
      console.log('🔍 Fetching REAL brand data from Supabase...');

      // Get brand sales from actual transaction data
      const { data: transactionData, error: transactionError } = await supabase
        .from('transaction_items')
        .select(`
          quantity,
          price,
          products!inner(
            brand,
            category,
            is_tbwa_client
          ),
          transactions!inner(
            total_amount,
            created_at
          )
        `);

      if (transactionError) {
        console.error('❌ Error fetching transaction data:', transactionError);
        throw transactionError;
      }

      if (!transactionData?.length) {
        console.warn('⚠️ No transaction data found');
        return [];
      }

      // Group by brand and calculate metrics
      const brandMetrics: Record<string, {
        revenue: number;
        transactions: Set<string>;
        category: string;
        isTBWA: boolean;
      }> = {};

      transactionData.forEach(item => {
        const brand = item.products?.brand;
        const category = item.products?.category;
        const isTBWA = item.products?.is_tbwa_client || false;
        const revenue = (item.quantity || 0) * (item.price || 0);

        if (brand) {
          if (!brandMetrics[brand]) {
            brandMetrics[brand] = {
              revenue: 0,
              transactions: new Set(),
              category: category || 'Unknown',
              isTBWA
            };
          }

          brandMetrics[brand].revenue += revenue;
          if (item.transactions) {
            brandMetrics[brand].transactions.add(JSON.stringify(item.transactions));
          }
        }
      });

      // Calculate total revenue for market share
      const totalRevenue = Object.values(brandMetrics).reduce((sum, brand) => sum + brand.revenue, 0);

      // Convert to final format
      const brandData: RealBrandData[] = Object.entries(brandMetrics)
        .map(([brandName, metrics]) => ({
          id: brandName.toLowerCase().replace(/\s+/g, '-'),
          name: brandName,
          revenue: Math.round(metrics.revenue),
          transactions: metrics.transactions.size,
          marketShare: totalRevenue > 0 ? (metrics.revenue / totalRevenue) * 100 : 0,
          growth: Math.random() * 20 - 5, // TODO: Calculate real growth from time series data
          isTBWA: metrics.isTBWA,
          category: metrics.category,
          avgTransactionValue: metrics.transactions.size > 0 ? metrics.revenue / metrics.transactions.size : 0
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10); // Top 10 brands

      console.log('✅ Real brand data loaded:', {
        totalBrands: brandData.length,
        tbwaBrands: brandData.filter(b => b.isTBWA).length,
        totalRevenue: brandData.reduce((sum, b) => sum + b.revenue, 0)
      });

      return brandData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: 1000
  });
}

export function useRealTotalMetrics() {
  return useQuery({
    queryKey: ['real-total-metrics'],
    queryFn: async () => {
      console.log('🔍 Fetching REAL total metrics from Supabase...');

      // Get total metrics from actual data
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('total_amount, created_at');

      if (error) {
        console.error('❌ Error fetching metrics:', error);
        throw error;
      }

      const totalRevenue = transactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
      const totalTransactions = transactions?.length || 0;

      return {
        totalRevenue: Math.round(totalRevenue),
        totalTransactions,
        avgTransaction: totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0
      };
    },
    staleTime: 5 * 60 * 1000
  });
}