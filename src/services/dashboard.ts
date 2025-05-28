
import { supabase } from '@/integrations/supabase/client';

export interface TimeSeriesData {
  date: string;
  transactions: number;
  revenue: number;
}

export interface TopBrandData {
  name: string;
  sales: number;
}

export interface DashboardData {
  totalRevenue: number;
  totalTransactions: number;
  avgTransaction: number;
  topBrands: TopBrandData[];
}

export interface GenderDistributionData {
  gender: string;
  customer_count: number;
  total_revenue: number;
}

export interface AgeDistributionData {
  age_group: string;
  count: number;
  percentage: number;
}

export interface PurchaseBehaviorData {
  age_group: string;
  avg_transaction_value: number;
  purchase_frequency: number;
  preferred_categories: string[];
}

export const dashboardService = {
  async getDashboardData(dateRange: string): Promise<DashboardData> {
    console.log('🔍 Fetching dashboard data for range:', dateRange);
    
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case '1d':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      console.log('📅 Date range:', { startDate: startDate.toISOString(), endDate: endDate.toISOString() });

      // Fetch transactions in the date range
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (transactionsError) {
        console.error('❌ Error fetching transactions:', transactionsError);
        throw transactionsError;
      }

      console.log('📊 Transactions fetched:', transactions?.length || 0);

      // Calculate totals
      const totalRevenue = transactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
      const totalTransactions = transactions?.length || 0;
      const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

      // Fetch transaction items with brands for top brands analysis
      const { data: items, error: itemsError } = await supabase
        .from('transaction_items')
        .select(`
          price,
          quantity,
          transaction_id,
          products!inner (
            name,
            brands!inner (
              name,
              is_tbwa
            )
          )
        `)
        .in('transaction_id', transactions?.map(t => t.id) || []);

      if (itemsError) {
        console.error('❌ Error fetching transaction items:', itemsError);
        // Don't throw here, just log and continue with empty brands
      }

      console.log('🛍️ Transaction items fetched:', items?.length || 0);

      // Calculate top brands
      const brandSales: Record<string, number> = {};
      
      if (items) {
        items.forEach(item => {
          const brandName = item.products?.brands?.name;
          const subtotal = (item.price || 0) * (item.quantity || 0);
          
          if (brandName) {
            brandSales[brandName] = (brandSales[brandName] || 0) + subtotal;
          }
        });
      }

      const topBrands = Object.entries(brandSales)
        .map(([name, sales]) => ({ name, sales }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 10);

      console.log('🏆 Top brands calculated:', topBrands);

      const result = {
        totalRevenue,
        totalTransactions,
        avgTransaction,
        topBrands
      };

      console.log('✅ Dashboard data result:', result);
      return result;

    } catch (error) {
      console.error('💥 Error in getDashboardData:', error);
      // Return mock data to prevent app crashes
      return {
        totalRevenue: 0,
        totalTransactions: 0,
        avgTransaction: 0,
        topBrands: []
      };
    }
  },

  async getTimeSeriesData(dateRange: string): Promise<TimeSeriesData[]> {
    console.log('📈 Fetching time series data for range:', dateRange);
    
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case '1d':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      const { data: dailyTrends, error } = await supabase
        .rpc('get_daily_trends', {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        });

      if (error) {
        console.error('❌ Error calling get_daily_trends:', error);
        throw error;
      }

      const timeSeriesData = dailyTrends?.map(trend => ({
        date: trend.day,
        transactions: trend.tx_count,
        revenue: Number(trend.daily_revenue || 0)
      })) || [];

      console.log('📈 Time series data:', timeSeriesData);
      return timeSeriesData;

    } catch (error) {
      console.error('💥 Error in getTimeSeriesData:', error);
      return [];
    }
  },

  async getTimeSeriesDataByDateRange(startDate: string, endDate: string): Promise<TimeSeriesData[]> {
    console.log('📈 Fetching time series data for custom range:', { startDate, endDate });
    
    try {
      const { data: dailyTrends, error } = await supabase
        .rpc('get_daily_trends', {
          start_date: startDate,
          end_date: endDate
        });

      if (error) {
        console.error('❌ Error calling get_daily_trends:', error);
        throw error;
      }

      const timeSeriesData = dailyTrends?.map(trend => ({
        date: trend.day,
        transactions: trend.tx_count,
        revenue: Number(trend.daily_revenue || 0)
      })) || [];

      console.log('📈 Custom time series data:', timeSeriesData);
      return timeSeriesData;

    } catch (error) {
      console.error('💥 Error in getTimeSeriesDataByDateRange:', error);
      return [];
    }
  },

  async getGenderDistribution(startDate: string, endDate: string): Promise<GenderDistributionData[]> {
    console.log('👥 Fetching gender distribution data');
    
    try {
      const { data, error } = await supabase
        .rpc('get_gender_distribution', {
          start_date: startDate,
          end_date: endDate
        });

      if (error) {
        console.error('❌ Error calling get_gender_distribution:', error);
        throw error;
      }

      // Transform the data to include total_revenue (we'll calculate it if needed later)
      const result = data?.map(item => ({
        gender: item.gender,
        customer_count: item.customer_count,
        total_revenue: 0 // We can calculate this if needed later
      })) || [];

      console.log('👥 Gender distribution data:', result);
      return result;

    } catch (error) {
      console.error('💥 Error in getGenderDistribution:', error);
      return [];
    }
  },

  async getAgeDistribution(startDate: string, endDate: string): Promise<AgeDistributionData[]> {
    console.log('📊 Fetching age distribution data');
    
    try {
      const { data, error } = await supabase
        .rpc('get_age_distribution', {
          start_date: startDate,
          end_date: endDate
        });

      if (error) {
        console.error('❌ Error calling get_age_distribution:', error);
        throw error;
      }

      const result = data?.map(item => ({
        age_group: item.age_group,
        count: item.count,
        percentage: item.percentage
      })) || [];

      console.log('📊 Age distribution data:', result);
      return result;

    } catch (error) {
      console.error('💥 Error in getAgeDistribution:', error);
      return [];
    }
  },

  async getPurchaseBehaviorByAge(startDate: string, endDate: string): Promise<PurchaseBehaviorData[]> {
    console.log('🛒 Fetching purchase behavior by age');
    
    try {
      const { data, error } = await supabase
        .rpc('get_purchase_behavior_by_age', {
          start_date: startDate,
          end_date: endDate
        });

      if (error) {
        console.error('❌ Error calling get_purchase_behavior_by_age:', error);
        throw error;
      }

      const result = data?.map(item => ({
        age_group: item.age_group,
        avg_transaction_value: item.avg_transaction_value,
        purchase_frequency: item.purchase_frequency,
        preferred_categories: item.preferred_categories
      })) || [];

      console.log('🛒 Purchase behavior data:', result);
      return result;

    } catch (error) {
      console.error('💥 Error in getPurchaseBehaviorByAge:', error);
      return [];
    }
  }
};
