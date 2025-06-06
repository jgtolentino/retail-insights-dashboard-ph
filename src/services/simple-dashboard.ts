import { supabase } from '@/integrations/supabase/client';

export interface DashboardDataResult {
  totalRevenue: number;
  totalTransactions: number;
  avgTransaction: number;
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

export const simpleDashboardService = {
  async getDashboardData(): Promise<DashboardDataResult> {
    try {
      // Get ALL transactions - processing complete dataset
      const { count: totalCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });

      // Get all transactions with proper pagination to handle 18,000 records
      // Processing all 18,000 records with efficient pagination
      const allTransactions = [];
      const batchSize = 1000;

      try {
        for (let offset = 0; offset < totalCount; offset += batchSize) {
          const { data: batch, error: batchError } = await supabase
            .from('transactions')
            .select('*')
            .range(offset, offset + batchSize - 1);

          if (batchError) {
            throw batchError;
          }

          if (batch && batch.length > 0) {
            allTransactions.push(...batch);
          }
        }
      } catch (batchError) {
        throw batchError;
      }

      const transactions = allTransactions;

      if (!transactions || transactions.length === 0) {
        return this.getEmptyDashboardData();
      }

      // Calculate totals from your actual data
      const totalRevenue = transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);
      const totalTransactions = transactions.length;
      const avgTransaction = totalRevenue / totalTransactions;

      }`);
      }`);
      }`);

      // Get actual brand sales from transaction_items, products, and brands tables
      let topBrands = [];

      // Get all transaction items with product and brand info
      const brandItemsQuery = supabase.from('transaction_items').select(
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
          )
        `
      );

      // Process all transactions without limit

      const { data: brandSalesData, error: brandError } = await brandItemsQuery;

      if (brandError) {
        // Fallback to location-based analysis
        const locationSales = new Map<string, number>();
        transactions.forEach(transaction => {
          const location = transaction.store_location || 'Unknown Location';
          const city =
            location.split(',')[1]?.trim() || location.split(',')[0]?.trim() || 'Unknown';
          const existing = locationSales.get(city) || 0;
          locationSales.set(city, existing + (transaction.total_amount || 0));
        });

        topBrands = Array.from(locationSales.entries())
          .map(([name, sales]) => ({
            name,
            sales,
            category: 'Location',
            is_client: false,
            count: transactions.filter(t => (t.store_location || '').includes(name)).length,
          }))
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 10);
      } else {
        // Calculate brand sales from actual product data
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

        topBrands = Array.from(brandSales.entries())
          .map(([name, data]) => ({
            name,
            sales: data.sales,
            category: data.category,
            is_client: data.is_client,
            count: data.count,
          }))
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 15);

        );
      }

      );

      // Create simple time series from created_at dates
      const dailySales = new Map<string, { transactions: number; revenue: number }>();

      transactions.forEach(transaction => {
        const date = new Date(transaction.created_at).toISOString().split('T')[0];
        const existing = dailySales.get(date) || { transactions: 0, revenue: 0 };
        dailySales.set(date, {
          transactions: existing.transactions + 1,
          revenue: existing.revenue + (transaction.total_amount || 0),
        });
      });

      const timeSeriesData = Array.from(dailySales.entries())
        .map(([date, data]) => ({
          date,
          transactions: data.transactions,
          revenue: data.revenue,
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30); // Last 30 days

      return {
        totalRevenue,
        totalTransactions,
        avgTransaction,
        topBrands,
        timeSeriesData,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      return {
        ...this.getEmptyDashboardData(),
        isError: true,
        errorMessage: error instanceof Error ? error.message : 'Failed to load data',
      };
    }
  },

  getEmptyDashboardData(): DashboardDataResult {
    return {
      totalRevenue: 0,
      totalTransactions: 0,
      avgTransaction: 0,
      topBrands: [],
      timeSeriesData: [],
      lastUpdated: new Date().toISOString(),
    };
  },
};
