import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface TimeSeriesData {
  daily: any[];
  weekly: any[];
  monthly: any[];
  byProduct: any[];
  totalProcessed: number;
  dateRange: { start: string; end: string };
}

interface ProcessingProgress {
  processed: number;
  total: number;
  percentage: number;
}

export class TransactionTimeSeriesProcessor {
  private supabaseUrl: string;
  private supabaseKey: string;
  private cache: Map<string, TimeSeriesData> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
  }

  async processAllTransactions(
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<TimeSeriesData> {
    const cacheKey = 'all_transactions';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // Get total count first
      const { count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });

      const total = count || 0;
      let processed = 0;

      // Fetch transactions in batches
      const batchSize = 1000;
      const batches = Math.ceil(total / batchSize);

      const dailyData = new Map<string, any>();
      const weeklyData = new Map<string, any>();
      const monthlyData = new Map<string, any>();
      const productData = new Map<string, any>();

      let minDate = new Date();
      let maxDate = new Date(0);

      for (let i = 0; i < batches; i++) {
        const { data: transactions, error } = await supabase
          .from('transactions')
          .select(
            `
            id,
            created_at,
            total_amount,
            transaction_items (
              quantity,
              price,
              product_id,
              products (
                id,
                name,
                brand_id
              )
            )
          `
          )
          .range(i * batchSize, (i + 1) * batchSize - 1)
          .order('created_at', { ascending: true });

        if (error) throw error;

        transactions?.forEach(transaction => {
          const date = new Date(transaction.created_at);
          minDate = date < minDate ? date : minDate;
          maxDate = date > maxDate ? date : maxDate;

          // Process daily data
          const dailyKey = date.toISOString().split('T')[0];
          this.updateTimeSeriesData(dailyData, dailyKey, transaction);

          // Process weekly data
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          const weeklyKey = weekStart.toISOString().split('T')[0];
          this.updateTimeSeriesData(weeklyData, weeklyKey, transaction);

          // Process monthly data
          const monthlyKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          this.updateTimeSeriesData(monthlyData, monthlyKey, transaction);

          // Process product data
          transaction.transaction_items?.forEach((item: any) => {
            if (item.products) {
              const productKey = item.products.id;
              this.updateProductData(productData, productKey, item, transaction);
            }
          });
        });

        processed += transactions?.length || 0;
        onProgress?.({
          processed,
          total,
          percentage: Math.round((processed / total) * 100),
        });
      }

      const result: TimeSeriesData = {
        daily: this.convertTimeSeriesMapToArray(dailyData),
        weekly: this.convertTimeSeriesMapToArray(weeklyData),
        monthly: this.convertTimeSeriesMapToArray(monthlyData),
        byProduct: this.convertProductMapToArray(productData),
        totalProcessed: processed,
        dateRange: {
          start: minDate.toISOString().split('T')[0],
          end: maxDate.toISOString().split('T')[0],
        },
      };

      this.cacheData(cacheKey, result);
      return result;
    } catch (error) {
      logger.error('Error processing transactions:', error);
      throw error;
    }
  }

  private updateTimeSeriesData(map: Map<string, any>, key: string, transaction: any) {
    const existing = map.get(key) || {
      date: key,
      revenue: 0,
      transactionCount: 0,
      quantity: 0,
      avgTransactionValue: 0,
    };

    existing.revenue += transaction.total_amount || 0;
    existing.transactionCount += 1;
    existing.quantity +=
      transaction.transaction_items?.reduce(
        (sum: number, item: any) => sum + (item.quantity || 0),
        0
      ) || 0;
    existing.avgTransactionValue = existing.revenue / existing.transactionCount;

    map.set(key, existing);
  }

  private updateProductData(
    map: Map<string, any>,
    productKey: string,
    item: any,
    transaction: any
  ) {
    const existing = map.get(productKey) || {
      productId: productKey,
      productName: item.products.name,
      series: [],
      totalRevenue: 0,
      totalQuantity: 0,
    };

    const date = new Date(transaction.created_at).toISOString().split('T')[0];
    const revenue = (item.quantity || 0) * (item.price || 0);

    existing.totalRevenue += revenue;
    existing.totalQuantity += item.quantity || 0;

    const seriesPoint = existing.series.find((p: any) => p.date === date);
    if (seriesPoint) {
      seriesPoint.revenue += revenue;
      seriesPoint.quantity += item.quantity || 0;
    } else {
      existing.series.push({
        date,
        revenue,
        quantity: item.quantity || 0,
      });
    }

    map.set(productKey, existing);
  }

  private convertTimeSeriesMapToArray(map: Map<string, any>): any[] {
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  private convertProductMapToArray(map: Map<string, any>): any[] {
    return Array.from(map.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  private getCachedData(key: string): TimeSeriesData | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private cacheData(key: string, data: TimeSeriesData) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  generateSummaryStats(data: TimeSeriesData) {
    const allTransactions = data.daily.reduce((sum, day) => sum + day.transactionCount, 0);
    const totalRevenue = data.daily.reduce((sum, day) => sum + day.revenue, 0);
    const totalQuantity = data.daily.reduce((sum, day) => sum + day.quantity, 0);

    return {
      totalRevenue,
      totalTransactions: allTransactions,
      avgTransactionValue: totalRevenue / allTransactions,
      totalQuantity,
    };
  }
}
