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

export const dashboardService = {
  async getConsumerInsights(
    startDate:    string,
    endDate:      string,
    categories:   string[] | null,
    brands:       string[] | null,
    products:     string[] | null,
    locations:    string[] | null,
    incomeRanges: string[] | null
  ) {
    const { data, error } = await supabase
      .rpc('get_consumer_insights', {
        start_date:        startDate,
        end_date:          endDate,
        category_filters:   categories?.length   ? categories   : null,
        brand_filters:      brands?.length       ? brands       : null,
        product_filters:    products?.length     ? products     : null,
        location_filters:   locations?.length    ? locations    : null,
        income_range_filters: incomeRanges?.length ? incomeRanges : null,
      })

    if (error) throw error
    return data
  },

  async getDashboardData(timeRange: string): Promise<DashboardData> {
    logger.info('Fetching dashboard data', { timeRange })
    
    try {
      // Use fixed end date that matches your data (May 30, 2025)
      const endDate = new Date('2025-05-30T23:59:59Z')
      let startDate = new Date(endDate)
      
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

      console.log('📅 Using date range:', {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        timeRange
      })

      // Get total revenue and transaction count from transactions table
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .select('total_amount, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
      
      if (transactionError) {
        logger.error('Error fetching transactions:', transactionError)
        throw transactionError
      }
      
      const totalRevenue = transactionData?.reduce((sum, transaction) => 
        sum + (transaction.total_amount || 0), 0) || 0
      const totalTransactions = transactionData?.length || 0
      const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0
      
      // Get all transaction items with transaction dates via join
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
      // Use fixed end date that matches your data (May 30, 2025)
      const endDate = new Date('2025-05-30T23:59:59Z')
      let startDate = new Date(endDate)
      let groupBy = 'day' // Default grouping
      
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

  // New method for date-parametric queries using the RPC function
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

  // Helper method to convert preset time ranges to actual dates
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

  // Consumer Insights Methods for Sprint 3
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
        .rpc('get_gender_distribution', {
          start_date: startDate + 'T00:00:00Z',
          end_date: endDate + 'T23:59:59Z'
        })
      
      if (error) {
        logger.error('Error fetching gender distribution:', error)
        throw error
      }
      
      // Add missing total_revenue field
      return (data || []).map(item => ({
        ...item,
        total_revenue: 0 // Placeholder since the RPC doesn't return this
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
