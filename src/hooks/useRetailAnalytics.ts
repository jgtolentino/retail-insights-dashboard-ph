import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface RetailAnalytics {
  totalRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
  topBrands: Array<{
    brand: string;
    revenue: number;
    transactions: number;
  }>;
}

export async function useRetailAnalytics(): Promise<RetailAnalytics> {
  try {
    const { data, error } = await supabase
      .from('retail_analytics')
      .select('*')
      .order('revenue', { ascending: false });

    if (error) {
      logger.error('Error fetching retail analytics:', error);
      return {
        totalRevenue: 0,
        totalTransactions: 0,
        averageTransactionValue: 0,
        topBrands: []
      };
    }

    const totalRevenue = data?.reduce((sum, item) => sum + item.revenue, 0) || 0;
    const totalTransactions = data?.reduce((sum, item) => sum + item.transactions, 0) || 0;
    const averageTransactionValue = totalRevenue / totalTransactions || 0;

    const topBrands = data?.slice(0, 10).map(item => ({
      brand: item.brand,
      revenue: item.revenue,
      transactions: item.transactions
    })) || [];

    return {
      totalRevenue,
      totalTransactions,
      averageTransactionValue,
      topBrands
    };
  } catch (error) {
    logger.error('Error in useRetailAnalytics:', error);
    return {
      totalRevenue: 0,
      totalTransactions: 0,
      averageTransactionValue: 0,
      topBrands: []
    };
  }
}
