import { supabase } from '@/integrations/supabase/client'
import { logger } from '@/utils/logger'
import type { DashboardData } from '@/types/database.types'

export interface TimeSeriesData {
  date: string
  transactions: number
  revenue: number
}

export interface DailyTrendsData {
  day: string
  tx_count: number
  daily_revenue: number
  avg_tx: number
}

export interface AgeDistributionData {
  age_bucket: string
  customer_count: number
}

export interface GenderDistributionData {
  gender: string
  customer_count: number
  total_revenue: number
}

export interface PurchaseBehaviorData {
  age_group: string
  avg_transaction_value: number
  purchase_frequency: number
  preferred_categories: string[]
}

// Enhanced dashboard data interface
export interface DashboardDataResult {
  totalRevenue: number;
  totalTransactions: number;
  avgTransaction: number;
  topBrands: Array<{ name: string; sales: number; count?: number }>;
  timeSeriesData: TimeSeriesData[];
  isError?: boolean;
  errorMessage?: string;
  lastUpdated?: string;
}

export const dashboardService = {
  async getDashboardData(timeRange: string = '30d'): Promise<DashboardDataResult> {
    const maxAttempts = 3;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        logger.info('Fetching dashboard data', { timeRange, attempt: attempts });

        const { data, error } = await supabase
          .from('transactions')
          .select(`
            *,
            transaction_items (
              *,
              products (
                *,
                brands (name)
              )
            )
          `)
          .order('created_at', { ascending: false })
          .limit(1000);

        if (error) {
          logger.error('Supabase query error', error);
          throw error;
        }

        if (!data || data.length === 0) {
          logger.warn('No transaction data found');
          return this.getEmptyDashboardData();
        }

        logger.info('Successfully fetched dashboard data', { recordCount: data.length });
        return this.processTransactionData(data);

      } catch (error) {
        logger.error(`Dashboard data fetch attempt ${attempts} failed`, error);
        
        if (attempts === maxAttempts) {
          return {
            ...this.getEmptyDashboardData(),
            isError: true,
            errorMessage: error instanceof Error ? error.message : 'Unknown error occurred'
          };
        }

        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)));
      }
    }

    return this.getEmptyDashboardData();
  },

  getEmptyDashboardData(): DashboardDataResult {
    return {
      totalRevenue: 0,
      totalTransactions: 0,
      avgTransaction: 0,
      topBrands: [],
      timeSeriesData: [],
      lastUpdated: new Date().toISOString()
    };
  },

  processTransactionData(transactions: any[]): DashboardDataResult {
    try {
      if (!Array.isArray(transactions)) {
        logger.warn('Invalid transactions data format');
        return this.getEmptyDashboardData();
      }

      // Safe data processing with validation
      const totalRevenue = transactions.reduce((sum, t) => {
        const amount = Number(t.total_amount) || 0;
        return sum + amount;
      }, 0);

      const brandSales = new Map<string, { sales: number; count: number }>();
      
      transactions.forEach(transaction => {
        if (!transaction.transaction_items || !Array.isArray(transaction.transaction_items)) {
          return;
        }

        transaction.transaction_items.forEach((item: any) => {
          const brandName = item.products?.brands?.name || 'Unknown';
          const itemAmount = (Number(item.quantity) || 0) * (Number(item.price) || 0);
          
          const existing = brandSales.get(brandName) || { sales: 0, count: 0 };
          brandSales.set(brandName, {
            sales: existing.sales + itemAmount,
            count: existing.count + 1
          });
        });
      });

      const topBrands = Array.from(brandSales.entries())
        .map(([name, data]) => ({ 
          name, 
          sales: data.sales,
          count: data.count 
        }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 10);

      const result: DashboardDataResult = {
        totalRevenue,
        totalTransactions: transactions.length,
        avgTransaction: transactions.length > 0 ? totalRevenue / transactions.length : 0,
        topBrands,
        timeSeriesData: this.generateTimeSeriesData(transactions),
        lastUpdated: new Date().toISOString()
      };

      logger.info('Successfully processed transaction data', {
        totalRevenue,
        transactionCount: transactions.length,
        brandCount: topBrands.length
      });

      return result;

    } catch (error) {
      logger.error('Error processing transaction data', error);
      return {
        ...this.getEmptyDashboardData(),
        isError: true,
        errorMessage: 'Failed to process transaction data'
      };
    }
  },

  generateTimeSeriesData(transactions: any[]): TimeSeriesData[] {
    try {
      if (!Array.isArray(transactions) || transactions.length === 0) {
        return [];
      }

      const dailyData = new Map<string, { transactions: number; revenue: number }>();

      transactions.forEach(transaction => {
        if (!transaction.created_at) return;

        const date = new Date(transaction.created_at).toISOString().split('T')[0];
        const amount = Number(transaction.total_amount) || 0;

        const existing = dailyData.get(date) || { transactions: 0, revenue: 0 };
        dailyData.set(date, {
          transactions: existing.transactions + 1,
          revenue: existing.revenue + amount
        });
      });

      return Array.from(dailyData.entries())
        .map(([date, data]) => ({
          date,
          transactions: data.transactions,
          revenue: data.revenue
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

    } catch (error) {
      logger.error('Error generating time series data', error);
      return [];
    }
  },

  async getConsumerInsights(
    startDate:    string,
    endDate:      string,
    categories:   string[] | null,
    brands:       string[] | null,
    products:     string[] | null,
    locations:    string[] | null,
    incomeRanges: string[] | null
  ) {
    try {
      // Build query with filters
      let query = supabase
        .from('transactions')
        .select(`
          *,
          transaction_items(
            *,
            products(
              *,
              brands(*)
            )
          )
        `)
        .gte('created_at', startDate + 'T00:00:00Z')
        .lte('created_at', endDate + 'T23:59:59Z')

      // Apply location filter if provided
      if (locations?.length) {
        query = query.in('store_location', locations)
      }

      const { data, error } = await query

      if (error) throw error

      // Process the data locally to apply other filters
      const filteredData = data?.filter(transaction => {
        // Apply other filters as needed
        return true // placeholder
      })

      return filteredData || []
    } catch (error) {
      logger.error('Error fetching consumer insights:', error)
      throw error
    }
  },

  async getDashboardData(timeRange: string): Promise<DashboardData> {
    logger.info('Fetching dashboard data', { timeRange })
    
    try {
      let startDate: Date, endDate: Date
      
      if (timeRange === 'all') {
        // Get actual min/max dates from data
        const { data: dateRange, error: dateError } = await supabase
          .from('transactions')
          .select('created_at')
          .order('created_at', { ascending: true })
          .limit(1)
          
        const { data: maxDateRange, error: maxDateError } = await supabase
          .from('transactions')
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(1)
        
        if (dateError || maxDateError) {
          throw dateError || maxDateError
        }
        
        startDate = new Date(dateRange?.[0]?.created_at || '2024-06-01T00:00:00Z')
        endDate = new Date(maxDateRange?.[0]?.created_at || '2025-05-30T23:59:59Z')
      } else {
        // Use existing logic for relative date ranges
        endDate = new Date('2025-05-30T23:59:59Z')
        startDate = new Date(endDate)
        
        switch (timeRange) {
          case '1d':
            startDate.setDate(endDate.getDate() - 1)
            break
          case '7d':
            startDate.setDate(endDate.getDate() - 7)
            break
          case '30d':
            startDate.setDate(endDate.getDate() - 30)
            break
          case '90d':
            startDate.setDate(endDate.getDate() - 90)
            break
          default:
            startDate.setDate(endDate.getDate() - 30)
        }
      }

      console.log('📅 Using date range:', {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        timeRange
      })

      // Get total transaction count using count query (no 1000 row limit)
      const { count: totalTransactions, error: countError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
      
      if (countError) {
        logger.error('Error counting transactions:', countError)
        throw countError
      }
      
      // Get total revenue using aggregate query (to avoid row limits)
      const { data: revenueData, error: revenueError } = await supabase
        .rpc('get_total_revenue_for_period', {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        })
      
      let totalRevenue = 0
      if (revenueError) {
        // Fallback: fetch sample data and estimate
        logger.warn('Revenue RPC not available, using sample estimation')
        const { data: sampleData, error: sampleError } = await supabase
          .from('transactions')
          .select('total_amount')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .limit(1000)
        
        if (!sampleError && sampleData) {
          const sampleRevenue = sampleData.reduce((sum, transaction) => 
            sum + (transaction.total_amount || 0), 0)
          // Estimate total revenue based on sample
          totalRevenue = sampleRevenue * ((totalTransactions || 0) / sampleData.length)
        }
      } else {
        totalRevenue = revenueData || 0
      }
      const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0
      
      // Get transaction items with transaction dates via join (limited for performance)
      const { data: transactionItems, error: itemsError } = await supabase
        .from('transaction_items')
        .select(`
          quantity, 
          price, 
          product_id,
          transactions!inner(created_at)
        `)
        .gte('transactions.created_at', startDate.toISOString())
        .lte('transactions.created_at', endDate.toISOString())
        .limit(5000) // Increase limit for better brand data
      
      if (itemsError) {
        logger.error('Error fetching transaction items:', itemsError)
        throw itemsError
      }
      
      // Get all products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, brand_id')
      
      if (productsError) {
        logger.error('Error fetching products:', productsError)
        throw productsError
      }
      
      // Get all brands
      const { data: brands, error: brandsError } = await supabase
        .from('brands')
        .select('*')
      
      if (brandsError) {
        logger.error('Error fetching brands:', brandsError)
        throw brandsError
      }
      
      // Create lookup maps for efficient data joining
      const productMap = new Map(products?.map(p => [p.id, p]) || [])
      const brandMap = new Map(brands?.map(b => [b.id, b]) || [])
      
      // Calculate sales by brand using proper ID matching
      const brandSalesMap = new Map<string, { sales: number, is_tbwa: boolean }>()
      
      transactionItems?.forEach(item => {
        const product = productMap.get(item.product_id)
        if (product) {
          const brand = brandMap.get(product.brand_id)
          if (brand) {
            // Ensure values are numbers
            const quantity = Number(item.quantity) || 0
            const price = Number(item.price) || 0
            const sales = quantity * price
            
            const existing = brandSalesMap.get(brand.name)
            
            if (existing) {
              existing.sales += sales
            } else {
              brandSalesMap.set(brand.name, {
                sales: sales,
                is_tbwa: brand.is_tbwa || false
              })
            }
          }
        }
      })
      
      // Convert to array and sort by sales - ensure sales is a number
      const topBrands = Array.from(brandSalesMap.entries())
        .map(([name, data]) => ({
          name,
          sales: Number(data.sales), // Explicitly convert to number
          is_tbwa: data.is_tbwa
        }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 15) // Show top 15 brands
      
      console.log('🔢 Sales values check:', topBrands.slice(0, 3).map(b => `${b.name}: ${b.sales} (${typeof b.sales})`))
      
      logger.info('Successfully fetched dashboard data', { 
        totalRevenue, 
        totalTransactions, 
        avgTransaction,
        brandsCount: topBrands.length 
      })
      
      return {
        totalRevenue,
        totalTransactions,
        avgTransaction,
        topBrands
      }
    } catch (error) {
      logger.error('Failed to fetch dashboard data', error)
      console.error('Dashboard service error:', error)
      
      // Return empty data when there's an error
      return {
        totalRevenue: 0,
        totalTransactions: 0,
        avgTransaction: 0,
        topBrands: []
      }
    }
  },

  async getTimeSeriesData(timeRange: string): Promise<TimeSeriesData[]> {
    logger.info('Fetching time series data', { timeRange })
    
    try {
      let startDate: Date, endDate: Date
      let groupBy = 'day' // Default grouping
      
      if (timeRange === 'all') {
        // Get actual min/max dates from data for time series
        const { data: dateRange, error: dateError } = await supabase
          .from('transactions')
          .select('created_at')
          .order('created_at', { ascending: true })
          .limit(1)
          
        const { data: maxDateRange, error: maxDateError } = await supabase
          .from('transactions')
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(1)
        
        if (dateError || maxDateError) {
          throw dateError || maxDateError
        }
        
        startDate = new Date(dateRange?.[0]?.created_at || '2024-06-01T00:00:00Z')
        endDate = new Date(maxDateRange?.[0]?.created_at || '2025-05-30T23:59:59Z')
        groupBy = 'week' // Use weekly grouping for full data range
      } else {
        // Use existing logic for relative date ranges
        endDate = new Date('2025-05-30T23:59:59Z')
        startDate = new Date(endDate)
        
        switch (timeRange) {
          case '1d':
            startDate.setDate(endDate.getDate() - 1)
            groupBy = 'hour'
            break
          case '7d':
            startDate.setDate(endDate.getDate() - 7)
            groupBy = 'day'
            break
          case '30d':
            startDate.setDate(endDate.getDate() - 30)
            groupBy = 'day'
            break
          case '90d':
            startDate.setDate(endDate.getDate() - 90)
            groupBy = 'week'
            break
          default:
            startDate.setDate(endDate.getDate() - 30)
        }
      }

      // Get transactions directly for time series
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('id, created_at, total_amount')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true })
      
      if (error) {
        logger.error('Error fetching time series data:', error)
        throw error
      }

      // Group data by time period
      const timeSeriesMap = new Map<string, { transactions: number, revenue: number }>()
      
      transactions?.forEach(transaction => {
        const transactionDate = transaction.created_at
        if (!transactionDate) return
        
        const date = new Date(transactionDate)
        let key: string
        
        if (groupBy === 'hour') {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`
        } else if (groupBy === 'day') {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        } else { // week
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`
        }
        
        const revenue = Number(transaction.total_amount) || 0
        const existing = timeSeriesMap.get(key)
        
        if (existing) {
          existing.transactions += 1
          existing.revenue += revenue
        } else {
          timeSeriesMap.set(key, {
            transactions: 1,
            revenue: revenue
          })
        }
      })
      
      // Convert to array and sort by date
      const timeSeriesData = Array.from(timeSeriesMap.entries())
        .map(([date, data]) => ({
          date,
          transactions: data.transactions,
          revenue: Math.round(data.revenue)
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
      
      logger.info('Successfully fetched time series data', { 
        dataPoints: timeSeriesData.length,
        groupBy 
      })
      
      return timeSeriesData
    } catch (error) {
      logger.error('Failed to fetch time series data', error)
      console.error('Time series service error:', error)
      // Return empty array to prevent dashboard crash
      return []
    }
  },

  async getTimeSeriesDataByDateRange(startDate: string, endDate: string): Promise<TimeSeriesData[]> {
    logger.info('Fetching time series data by date range', { startDate, endDate })
    
    try {
      // Call the new RPC function
      const { data: dailyTrends, error } = await supabase
        .rpc('get_daily_trends', {
          start_date: startDate + 'T00:00:00Z',
          end_date: endDate + 'T23:59:59Z'
        })
      
      if (error) {
        logger.error('Error fetching daily trends:', error)
        throw error
      }

      // Transform the data to match TimeSeriesData interface
      const timeSeriesData: TimeSeriesData[] = (dailyTrends || []).map((item: DailyTrendsData) => ({
        date: item.day,
        transactions: Number(item.tx_count),
        revenue: Math.round(Number(item.daily_revenue))
      }))
      
      logger.info('Successfully fetched time series data by date range', { 
        dataPoints: timeSeriesData.length,
        startDate,
        endDate
      })
      
      return timeSeriesData
    } catch (error) {
      logger.error('Failed to fetch time series data by date range', error)
      console.error('Time series by date range service error:', error)
      return []
    }
  },

  convertTimeRangeTodates(timeRange: string): { startDate: string, endDate: string } {
    // Use fixed end date that matches your data (May 30, 2025)
    const endDate = '2025-05-30'
    const endDateObj = new Date('2025-05-30T23:59:59Z')
    let startDate = new Date(endDateObj)
    
    switch (timeRange) {
      case '1d':
        startDate.setDate(endDateObj.getDate() - 1)
        break
      case '7d':
        startDate.setDate(endDateObj.getDate() - 7)
        break
      case '30d':
        startDate.setDate(endDateObj.getDate() - 30)
        break
      case '90d':
        startDate.setDate(endDateObj.getDate() - 90)
        break
      default:
        startDate.setDate(endDateObj.getDate() - 30)
    }
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate
    }
  },

  async getAgeDistribution(
    startDate: string, 
    endDate: string, 
    bucketSize: number = 10,
    filters?: {
      categories?: string[];
      brands?: string[];
      genders?: string[];
      ageGroups?: string[];
    }
  ): Promise<AgeDistributionData[]> {
    logger.info('Fetching age distribution data', { startDate, endDate, bucketSize })
    
    try {
      const { data, error } = await supabase
        .rpc('get_age_distribution', {
          start_date: startDate + 'T00:00:00Z',
          end_date: endDate + 'T23:59:59Z',
          bucket_size: bucketSize
        })
      
      if (error) {
        logger.error('Error fetching age distribution:', error)
        throw error
      }
      
      return data || []
    } catch (error) {
      logger.error('Failed to fetch age distribution data', error)
      return []
    }
  },

  async getGenderDistribution(
    startDate: string, 
    endDate: string,
    filters?: {
      categories?: string[];
      brands?: string[];
      ageGroups?: string[];
    }
  ): Promise<GenderDistributionData[]> {
    logger.info('Fetching gender distribution data', { startDate, endDate })
    
    try {
      const { data, error } = await supabase
        .rpc('get_consumer_profile' as any, {
          p_start: startDate + 'T00:00:00Z',
          p_end: endDate + 'T23:59:59Z'
        })
      
      if (error) {
        logger.error('Error fetching consumer profile:', error)
        throw error
      }
      
      // Extract gender distribution from consumer profile
      let genderDistribution: any[] = []
      if (data && typeof data === 'object') {
        genderDistribution = (data as any).gender_distribution || []
      }
      
      // Convert to expected format
      return genderDistribution.map(item => ({
        gender: item.gender,
        customer_count: item.customer_count || item.count || 0,
        total_revenue: item.total_revenue || 0
      }))
    } catch (error) {
      logger.error('Failed to fetch gender distribution data', error)
      return []
    }
  },

  async getPurchaseBehaviorByAge(startDate: string, endDate: string): Promise<PurchaseBehaviorData[]> {
    logger.info('Fetching purchase behavior by age data', { startDate, endDate })
    
    try {
      const { data, error } = await supabase
        .rpc('get_purchase_behavior_by_age', {
          start_date: startDate + 'T00:00:00Z',
          end_date: endDate + 'T23:59:59Z'
        })
      
      if (error) {
        logger.error('Error fetching purchase behavior by age:', error)
        throw error
      }
      
      return data || []
    } catch (error) {
      logger.error('Failed to fetch purchase behavior by age data', error)
      return []
    }
  }
}
