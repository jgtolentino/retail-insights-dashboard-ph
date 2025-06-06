import { supabase } from '@/integrations/supabase/client';

export interface BehavioralDashboardData {
  totalRevenue: number;
  totalTransactions: number;
  avgTransaction: number;
  uniqueCustomers: number;
  suggestionAcceptanceRate: number;
  substitutionRate: number;
  suggestionsOffered: number;
  suggestionsAccepted: number;
  topBrands: Array<{
    name: string;
    sales: number;
    category?: string;
    is_client?: boolean;
    count?: number;
  }>;
  timeSeriesData: any[];
  isError?: boolean;
  errorMessage?: string;
  lastUpdated?: string;
}

export interface WeeklyDashboardData {
  weekStart: string;
  weekEnd: string;
  weekNumber: number;
  totalRevenue: number;
  totalTransactions: number;
  avgTransaction: number;
  uniqueCustomers: number;
  suggestionAcceptanceRate: number;
  substitutionRate: number;
  suggestionsOffered: number;
  suggestionsAccepted: number;
}

export interface SuggestionFunnelData {
  stage: string;
  count: number;
  percentage: number;
}

export interface BehaviorSuggestion {
  date: string;
  storeId: number;
  storeName: string;
  region: string;
  totalTransactions: number;
  suggestionsOffered: number;
  suggestionsAccepted: number;
  suggestionAcceptanceRate: number;
}

export interface SubstitutionFlow {
  level: 'CATEGORY' | 'BRAND' | 'PRODUCT';
  originalCategory: string;
  substituteCategory: string;
  originalBrand?: string;
  substituteBrand?: string;
  originalProduct?: string;
  substituteProduct?: string;
  reason: string;
  frequency: number;
  substitutionRate: number;
}

export const behavioralDashboardService = {
  async getDashboardSummary(
    startDate?: string,
    endDate?: string,
    storeId?: number
  ): Promise<BehavioralDashboardData> {
    try {
      // Call the RPC function
      // Pass NULL for dates when not filtering to get all 18k records
      const { data, error } = await supabase.rpc('get_dashboard_summary', {
        p_start_date: startDate || null,
        p_end_date: endDate || null,
        p_store_id: storeId || null,
      });

      if (error) {
        throw error;
      }

      const summary = data?.[0] || {};

      // Get top brands data using existing logic
      const topBrandsData = await this.getTopBrands(startDate, endDate, storeId);

      // Get time series data
      const timeSeriesData = await this.getTimeSeriesData(startDate, endDate, storeId);

      return {
        totalRevenue: summary.total_revenue || 0,
        totalTransactions: summary.total_transactions || 0,
        avgTransaction: summary.avg_transaction || 0,
        uniqueCustomers: summary.unique_customers || 0,
        suggestionAcceptanceRate: summary.suggestion_acceptance_rate || 0,
        substitutionRate: summary.substitution_rate || 0,
        suggestionsOffered: summary.suggestions_offered || 0,
        suggestionsAccepted: summary.suggestions_accepted || 0,
        topBrands: topBrandsData,
        timeSeriesData: timeSeriesData,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      return {
        totalRevenue: 0,
        totalTransactions: 0,
        avgTransaction: 0,
        uniqueCustomers: 0,
        suggestionAcceptanceRate: 0,
        substitutionRate: 0,
        suggestionsOffered: 0,
        suggestionsAccepted: 0,
        topBrands: [],
        timeSeriesData: [],
        isError: true,
        errorMessage: error instanceof Error ? error.message : 'Failed to load behavioral data',
      };
    }
  },

  async getWeeklySummary(
    startDate?: string,
    endDate?: string,
    storeId?: number
  ): Promise<WeeklyDashboardData[]> {
    try {
      const { data, error } = await supabase.rpc('get_dashboard_summary_weekly', {
        p_start_date: startDate,
        p_end_date: endDate,
        p_store_id: storeId,
      });

      if (error) {
        throw error;
      }

      return (data || []).map((week: any) => ({
        weekStart: week.week_start,
        weekEnd: week.week_end,
        weekNumber: week.week_number,
        totalRevenue: week.total_revenue || 0,
        totalTransactions: week.total_transactions || 0,
        avgTransaction: week.avg_transaction || 0,
        uniqueCustomers: week.unique_customers || 0,
        suggestionAcceptanceRate: week.suggestion_acceptance_rate || 0,
        substitutionRate: week.substitution_rate || 0,
        suggestionsOffered: week.suggestions_offered || 0,
        suggestionsAccepted: week.suggestions_accepted || 0,
      }));
    } catch (error) {
      return [];
    }
  },

  async getSuggestionFunnel(
    startDate?: string,
    endDate?: string,
    storeId?: number
  ): Promise<SuggestionFunnelData[]> {
    try {
      const { data, error } = await supabase.rpc('get_suggestion_funnel', {
        p_start_date: startDate,
        p_end_date: endDate,
        p_store_id: storeId,
      });

      if (error) {
        throw error;
      }

      return (data || []).map((stage: any) => ({
        stage: stage.stage,
        count: stage.count || 0,
        percentage: stage.percentage || 0,
      }));
    } catch (error) {
      return [];
    }
  },

  async getBehaviorSuggestions(
    startDate?: string,
    endDate?: string,
    storeId?: number
  ): Promise<BehaviorSuggestion[]> {
    try {
      let query = supabase
        .from('v_behavior_suggestions')
        .select('*')
        .order('date', { ascending: false });

      if (startDate && endDate) {
        query = query.gte('date', startDate).lte('date', endDate);
      }

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data || []).map((row: any) => ({
        date: row.date,
        storeId: row.store_id,
        storeName: row.store_name,
        region: row.region,
        totalTransactions: row.total_transactions || 0,
        suggestionsOffered: row.suggestions_offered || 0,
        suggestionsAccepted: row.suggestions_accepted || 0,
        suggestionAcceptanceRate: row.suggestion_acceptance_rate || 0,
      }));
    } catch (error) {
      return [];
    }
  },

  async getSubstitutionFlows(
    startDate?: string,
    endDate?: string,
    storeId?: number
  ): Promise<SubstitutionFlow[]> {
    try {
      const { data, error } = await supabase.rpc('get_hierarchical_substitutions', {
        p_start_date: startDate,
        p_end_date: endDate,
        p_store_id: storeId,
      });

      if (error) {
        throw error;
      }

      return (data || []).map((row: any) => ({
        level: row.level as 'CATEGORY' | 'BRAND' | 'PRODUCT',
        originalCategory: row.original_category,
        substituteCategory: row.substitute_category,
        originalBrand: row.original_brand || undefined,
        substituteBrand: row.substitute_brand || undefined,
        originalProduct: row.original_product || undefined,
        substituteProduct: row.substitute_product || undefined,
        reason: row.reason,
        frequency: row.frequency || 0,
        substitutionRate: row.substitution_rate || 0,
      }));
    } catch (error) {
      return [];
    }
  },

  // Helper methods
  async getTopBrands(startDate?: string, endDate?: string, storeId?: number) {
    try {
      // First try transaction_items approach
      let query = supabase.from('transaction_items').select(`
          quantity,
          price,
          products!inner (
            name,
            brands!inner (
              id,
              name,
              category,
              is_client
            )
          )
        `);

      if (startDate && endDate) {
        // Join with transactions to filter by date
        query = supabase
          .from('transaction_items')
          .select(
            `
            quantity,
            price,
            products!inner (
              name,
              brands!inner (
                id,
                name,
                category,
                is_client
              )
            ),
            transactions!inner (
              created_at,
              store_id
            )
          `
          )
          .gte('transactions.created_at', startDate)
          .lte('transactions.created_at', endDate);
      }

      if (storeId) {
        query = query.eq('transactions.store_id', storeId);
      }

      // Process all transactions without limit

      const { data: brandSalesData, error } = await query;

      if (error) {
        throw error;
      }

      if (!brandSalesData || brandSalesData.length === 0) {
        return [];
      }

      const brandSales = new Map<
        string,
        { sales: number; category: string; is_client: boolean; count: number }
      >();

      brandSalesData?.forEach(item => {
        const brand = item.products?.brands;
        if (brand) {
          const brandName = brand.name;
          const itemTotal = (item.quantity || 0) * (item.price || 0);
          const existing = brandSales.get(brandName) || {
            sales: 0,
            category: brand.category || 'Other',
            is_client: brand.is_client || false,
            count: 0,
          };

          brandSales.set(brandName, {
            sales: existing.sales + itemTotal,
            category: brand.category || 'Other',
            is_client: brand.is_client || false,
            count: existing.count + 1,
          });
        }
      });

      return Array.from(brandSales.entries())
        .map(([name, data]) => ({
          name,
          sales: data.sales,
          category: data.category,
          is_client: data.is_client,
          count: data.count,
        }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 15);
    } catch (error) {
      throw error;
    }
  },

  async getTimeSeriesData(startDate?: string, endDate?: string, storeId?: number) {
    try {
      let query = supabase
        .from('transactions')
        .select('created_at, total_amount, store_id')
        .order('created_at', { ascending: true });

      if (startDate && endDate) {
        query = query.gte('created_at', startDate).lte('created_at', endDate);
      }

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      // Process all transactions without limit

      const { data: transactions, error } = await query;

      if (error) {
        return [];
      }

      const dailySales = new Map<string, { transactions: number; revenue: number }>();

      transactions?.forEach(transaction => {
        const date = new Date(transaction.created_at).toISOString().split('T')[0];
        const existing = dailySales.get(date) || { transactions: 0, revenue: 0 };
        dailySales.set(date, {
          transactions: existing.transactions + 1,
          revenue: existing.revenue + (transaction.total_amount || 0),
        });
      });

      return Array.from(dailySales.entries())
        .map(([date, data]) => ({
          date,
          transactions: data.transactions,
          revenue: data.revenue,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      return [];
    }
  },
};
