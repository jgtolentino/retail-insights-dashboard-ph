import { supabase } from '@/integrations/supabase/client'
import { logger } from '@/utils/logger'
import { logDataFetchError } from '@/lib/sentry'
import type { DashboardData } from '@/types/database.types'

export interface TimeSeriesData {
  date: string
  transactions: number
  revenue: number
}

export interface FilterOptions {
  brands?: string[]
  categories?: string[]
  regions?: string[]
  stores?: string[]
}

export const dashboardServiceWithFilters = {
  async getDashboardData(timeRange: string, filters?: FilterOptions): Promise<DashboardData> {
    logger.info('Fetching dashboard data with filters', { timeRange, filters })
    
    try {
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

      // Build transaction query with filters
      let transactionQuery = supabase
        .from('transactions')
        .select('id, total_amount, created_at, store_location')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      // Apply store filter
      if (filters?.stores && filters.stores.length > 0) {
        transactionQuery = transactionQuery.in('store_id', filters.stores)
      }

      // Apply region filter via store location
      if (filters?.regions && filters.regions.length > 0) {
        // Get stores in selected regions first
        const { data: storesInRegions } = await supabase
          .from('stores')
          .select('id')
          .in('region', filters.regions)
        
        if (storesInRegions) {
          const storeIds = storesInRegions.map(s => s.id)
          transactionQuery = transactionQuery.in('store_id', storeIds)
        }
      }

      const { data: transactionData, error: transactionError } = await transactionQuery
      
      if (transactionError) {
        logger.error('Error fetching transactions:', transactionError)
        throw transactionError
      }
      
      const totalRevenue = transactionData?.reduce((sum, transaction) => 
        sum + (transaction.total_amount || 0), 0) || 0
      const totalTransactions = transactionData?.length || 0
      const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0
      
      // Get transaction IDs for filtering items
      const transactionIds = transactionData?.map(t => t.id) || []
      
      // Build transaction items query with filters
      let itemsQuery = supabase
        .from('transaction_items')
        .select(`
          quantity, 
          price, 
          product_id,
          products!inner (
            id,
            name,
            brand_id,
            brands!inner (
              id,
              name,
              category
            )
          )
        `)
        .in('transaction_id', transactionIds)

      // Apply brand filter
      if (filters?.brands && filters.brands.length > 0) {
        itemsQuery = itemsQuery.in('products.brand_id', filters.brands)
      }

      // Apply category filter
      if (filters?.categories && filters.categories.length > 0) {
        itemsQuery = itemsQuery.in('products.brands.category', filters.categories)
      }

      const { data: transactionItems, error: itemsError } = await itemsQuery
      
      if (itemsError) {
        logger.error('Error fetching transaction items:', itemsError)
        throw itemsError
      }
      
      // Calculate brand revenue
      const brandRevenue = new Map<string, { revenue: number, brand: string }>()
      
      transactionItems?.forEach(item => {
        if (item.products?.brands) {
          const brandId = item.products.brands.id
          const brandName = item.products.brands.name
          const revenue = (item.quantity || 0) * (item.price || 0)
          
          if (brandRevenue.has(brandId)) {
            brandRevenue.get(brandId)!.revenue += revenue
          } else {
            brandRevenue.set(brandId, { revenue, brand: brandName })
          }
        }
      })
      
      // Convert to array and sort by revenue
      const topBrands = Array.from(brandRevenue.entries())
        .map(([_, data]) => ({
          brand: data.brand,
          revenue: Math.round(data.revenue * 100) / 100
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
      
      const dashboardData: DashboardData = {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalTransactions,
        avgTransaction: Math.round(avgTransaction * 100) / 100,
        topBrands
      }
      
      logger.info('Dashboard data fetched successfully', dashboardData)
      return dashboardData
      
    } catch (error) {
      logger.error('Error fetching dashboard data:', error)
      logDataFetchError('dashboard_data_with_filters', error as Error, { timeRange, filters })
      throw error
    }
  },

  async getTimeSeriesData(timeRange: string, filters?: FilterOptions): Promise<TimeSeriesData[]> {
    logger.info('Fetching time series data with filters', { timeRange, filters })
    
    try {
      const endDate = new Date('2025-05-30T23:59:59Z')
      let startDate = new Date(endDate)
      let groupBy: 'hour' | 'day' | 'week' = 'day'
      
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

      // Build query with filters
      let query = supabase
        .from('transactions')
        .select('id, created_at, total_amount')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true })

      // Apply store filter
      if (filters?.stores && filters.stores.length > 0) {
        query = query.in('store_id', filters.stores)
      }

      // Apply region filter
      if (filters?.regions && filters.regions.length > 0) {
        const { data: storesInRegions } = await supabase
          .from('stores')
          .select('id')
          .in('region', filters.regions)
        
        if (storesInRegions) {
          const storeIds = storesInRegions.map(s => s.id)
          query = query.in('store_id', storeIds)
        }
      }

      // For brand/category filters, we need to check transaction items
      let { data: transactions, error } = await query
      
      if (error) {
        logger.error('Error fetching time series data:', error)
        throw error
      }

      // If we have brand or category filters, filter transactions based on items
      if ((filters?.brands && filters.brands.length > 0) || 
          (filters?.categories && filters.categories.length > 0)) {
        
        const transactionIds = transactions?.map(t => t.id) || []
        
        let itemsQuery = supabase
          .from('transaction_items')
          .select(`
            transaction_id,
            products!inner (
              brand_id,
              brands!inner (
                id,
                category
              )
            )
          `)
          .in('transaction_id', transactionIds)

        if (filters?.brands && filters.brands.length > 0) {
          itemsQuery = itemsQuery.in('products.brand_id', filters.brands)
        }

        if (filters?.categories && filters.categories.length > 0) {
          itemsQuery = itemsQuery.in('products.brands.category', filters.categories)
        }

        const { data: filteredItems } = await itemsQuery
        
        if (filteredItems) {
          const validTransactionIds = new Set(filteredItems.map(item => item.transaction_id))
          transactions = transactions?.filter(t => validTransactionIds.has(t.id))
        }
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
        
        const existing = timeSeriesMap.get(key) || { transactions: 0, revenue: 0 }
        existing.transactions += 1
        existing.revenue += transaction.total_amount || 0
        timeSeriesMap.set(key, existing)
      })
      
      // Convert to array
      const timeSeriesData: TimeSeriesData[] = Array.from(timeSeriesMap.entries())
        .map(([date, data]) => ({
          date,
          transactions: data.transactions,
          revenue: Math.round(data.revenue * 100) / 100
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
      
      logger.info(`Time series data fetched: ${timeSeriesData.length} data points`)
      return timeSeriesData
      
    } catch (error) {
      logger.error('Error fetching time series data:', error)
      logDataFetchError('time_series_data_with_filters', error as Error, { timeRange, filters })
      throw error
    }
  }
}