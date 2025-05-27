import { supabase } from '@/integrations/supabase/client'
import { logger } from '@/utils/logger'
import type { DashboardData } from '@/types/database.types'

export const dashboardService = {
  async getDashboardData(timeRange: string): Promise<DashboardData> {
    logger.info('Fetching dashboard data', { timeRange })
    
    try {
      // Get total revenue and transaction count from transactions table
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .select('total_amount')
      
      if (transactionError) {
        logger.error('Error fetching transactions:', transactionError)
        throw transactionError
      }
      
      const totalRevenue = transactionData?.reduce((sum, transaction) => 
        sum + (transaction.total_amount || 0), 0) || 0
      const totalTransactions = transactionData?.length || 0
      const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0
      
      // Get all transaction items
      const { data: transactionItems, error: itemsError } = await supabase
        .from('transaction_items')
        .select('quantity, price, product_id')
      
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
  }
}
