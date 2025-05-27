import { supabase } from '@/integrations/supabase/client'
import { logger } from '@/utils/logger'
import type { DashboardData } from '@/types/database.types'

export interface TimeSeriesData {
  date: string
  transactions: number
  revenue: number
}

export const dashboardService = {
  async getDashboardData(timeRange: string): Promise<DashboardData> {
    logger.info('Fetching dashboard data', { timeRange })
    
    try {
      // Calculate date filter based on timeRange
      const now = new Date()
      let startDate = new Date()
      
      switch (timeRange) {
        case '1d':
          startDate.setDate(now.getDate() - 1)
          break
        case '7d':
          startDate.setDate(now.getDate() - 7)
          break
        case '30d':
          startDate.setDate(now.getDate() - 30)
          break
        case '90d':
          startDate.setDate(now.getDate() - 90)
          break
        default:
          startDate.setDate(now.getDate() - 30)
      }

      // Get total revenue and transaction count from transactions table
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .select('total_amount, created_at')
        .gte('created_at', startDate.toISOString())
      
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
                is_tbwa: brand.is_tbwa_client || false
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
      // Calculate date filter based on timeRange
      const now = new Date()
      let startDate = new Date()
      let groupBy = 'day' // Default grouping
      
      switch (timeRange) {
        case '1d':
          startDate.setDate(now.getDate() - 1)
          groupBy = 'hour'
          break
        case '7d':
          startDate.setDate(now.getDate() - 7)
          groupBy = 'day'
          break
        case '30d':
          startDate.setDate(now.getDate() - 30)
          groupBy = 'day'
          break
        case '90d':
          startDate.setDate(now.getDate() - 90)
          groupBy = 'week'
          break
        default:
          startDate.setDate(now.getDate() - 30)
      }

      // Get transaction items with transaction dates via join
      const { data: transactionItems, error } = await supabase
        .from('transaction_items')
        .select(`
          quantity, 
          price,
          transactions!inner(created_at)
        `)
        .gte('transactions.created_at', startDate.toISOString())
        .order('transactions.created_at', { ascending: true })
      
      if (error) {
        logger.error('Error fetching time series data:', error)
        throw error
      }

      // Group data by time period
      const timeSeriesMap = new Map<string, { transactions: number, revenue: number }>()
      
      transactionItems?.forEach(item => {
        // Access the joined transaction data
        const transactionDate = item.transactions?.created_at
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
        
        const revenue = (Number(item.quantity) || 0) * (Number(item.price) || 0)
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
      return []
    }
  }
}
