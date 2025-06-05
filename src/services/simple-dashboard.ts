import { supabase } from '@/integrations/supabase/client';

export interface DashboardDataResult {
  totalRevenue: number;
  totalTransactions: number;
  avgTransaction: number;
  topBrands: Array<{
    name: string;
    sales: number;
    category?: string;
    is_tbwa?: boolean;
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
      console.log('🔍 Fetching dashboard data from your 18,000 records...');

      // Get ALL transactions - bypass 1000 limit with count
      const { count: totalCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });

      console.log(`📊 Total records available: ${totalCount}`);

      // Get all transactions with proper pagination to handle 18,000 records
      // Supabase has a 1000 record default limit, so we need to paginate
      const allTransactions = [];
      const batchSize = 1000;

      for (let offset = 0; offset < totalCount; offset += batchSize) {
        const { data: batch, error: batchError } = await supabase
          .from('transactions')
          .select('*')
          .range(offset, offset + batchSize - 1);

        if (batchError) {
          console.error(`❌ Error fetching batch at offset ${offset}:`, batchError);
          throw batchError;
        }

        if (batch && batch.length > 0) {
          allTransactions.push(...batch);
        }

        console.log(
          `📦 Fetched batch: ${batch?.length || 0} records (${offset + 1}-${offset + (batch?.length || 0)})`
        );
      }

      const transactions = allTransactions;

      if (!transactions || transactions.length === 0) {
        console.warn('⚠️ No transactions found');
        return this.getEmptyDashboardData();
      }

      console.log(`✅ Found ${transactions.length} transactions`);

      // Calculate totals from your actual data
      const totalRevenue = transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);
      const totalTransactions = transactions.length;
      const avgTransaction = totalRevenue / totalTransactions;

      console.log(`💰 Total Revenue: ₱${totalRevenue.toLocaleString()}`);
      console.log(`📊 Total Transactions: ${totalTransactions.toLocaleString()}`);
      console.log(`📈 Average Transaction: ₱${avgTransaction.toFixed(2)}`);

      // Get actual brand sales from transaction_items, products, and brands tables
      console.log('📦 Fetching brand sales data...');

      let topBrands = [];

      // Get all transaction items with product and brand info
      let brandItemsQuery = supabase.from('transaction_items').select(
        `
          quantity,
          price,
          products!inner (
            name,
            brands!inner (
              id,
              name,
              category,
              is_tbwa
            )
          )
        `
      );

      // Use configurable limit from environment variable, default to no limit
      const transactionLimit = import.meta.env.REACT_APP_TRANSACTION_LIMIT;
      if (transactionLimit && !isNaN(Number(transactionLimit))) {
        brandItemsQuery = brandItemsQuery.limit(Number(transactionLimit));
      }

      const { data: brandSalesData, error: brandError } = await brandItemsQuery;

      if (brandError) {
        console.warn(
          '⚠️ Could not fetch brand data, falling back to location data:',
          brandError.message
        );
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
            is_tbwa: false,
            count: transactions.filter(t => (t.store_location || '').includes(name)).length,
          }))
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 10);
      } else {
        // Calculate brand sales from actual product data
        const brandSales = new Map<
          string,
          { sales: number; category: string; is_tbwa: boolean; count: number }
        >();

        brandSalesData?.forEach(item => {
          const brand = item.products?.brands;
          if (brand) {
            const brandName = brand.name;
            const itemTotal = (item.quantity || 0) * (item.price || 0);
            const existing = brandSales.get(brandName) || {
              sales: 0,
              category: brand.category || 'Other',
              is_tbwa: brand.is_tbwa || false,
              count: 0,
            };

            brandSales.set(brandName, {
              sales: existing.sales + itemTotal,
              category: brand.category || 'Other',
              is_tbwa: brand.is_tbwa || false,
              count: existing.count + 1,
            });
          }
        });

        topBrands = Array.from(brandSales.entries())
          .map(([name, data]) => ({
            name,
            sales: data.sales,
            category: data.category,
            is_tbwa: data.is_tbwa,
            count: data.count,
          }))
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 15);

        console.log('🏆 Top brands with TBWA data:', topBrands.slice(0, 5));
      }

      console.log('🏆 Top locations by sales:', topBrands.slice(0, 3));

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
      console.error('❌ Dashboard service error:', error);
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
