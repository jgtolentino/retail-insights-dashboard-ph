import { supabase } from '@/integrations/supabase/client'

interface DashboardData {
  totalRevenue: number
  totalTransactions: number
  avgTransaction: number
  topBrands: Array<{
    name: string
    sales: number
    is_tbwa: boolean
  }>
}

export const dashboardService = {
  async getDashboardData(timeRange: string): Promise<DashboardData> {
    console.log('Fetching data from Supabase...')
    
    try {
      // Get aggregated brand data
      const { data: brandData, error: brandError } = await supabase
        .from('brands')
        .select(`
          name,
          is_tbwa,
          products (
            transaction_items (
              quantity,
              price
            )
          )
        `)
      
      if (brandError) throw brandError
      
      // Calculate sales for each brand
      const topBrands = brandData?.map(brand => {
        const sales = brand.products?.reduce((total, product) => {
          const productSales = product.transaction_items?.reduce((sum, item) => {
            return sum + (item.quantity * item.price)
          }, 0) || 0
          return total + productSales
        }, 0) || 0
        
        return {
          name: brand.name,
          sales: sales,
          is_tbwa: brand.is_tbwa || false
        }
      }).sort((a, b) => b.sales - a.sales) || []
      
      // Calculate totals
      const totalRevenue = topBrands.reduce((sum, brand) => sum + brand.sales, 0)
      const totalTransactions = brandData?.reduce((sum, brand) => {
        return sum + (brand.products?.reduce((total, product) => {
          return total + (product.transaction_items?.length || 0)
        }, 0) || 0)
      }, 0) || 0
      
      const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0
      
      console.log('Supabase data:', { totalRevenue, totalTransactions, topBrands })
      
      return {
        totalRevenue,
        totalTransactions,
        avgTransaction,
        topBrands
      }
    } catch (error) {
      console.error('Error fetching from Supabase:', error)
      
      // Return mock data as fallback
      return {
        totalRevenue: 92125,
        totalTransactions: 175,
        avgTransaction: 526,
        topBrands: [
          { name: 'Marlboro', sales: 18500, is_tbwa: false },
          { name: 'Philip Morris', sales: 15300, is_tbwa: false },
          { name: 'Fortune', sales: 12400, is_tbwa: false },
          { name: 'Hope', sales: 11200, is_tbwa: false },
          { name: 'More', sales: 9800, is_tbwa: false },
          { name: 'Champion', sales: 8900, is_tbwa: false },
          { name: 'Alaska', sales: 7500, is_tbwa: false },
          { name: 'Bear Brand', sales: 4525, is_tbwa: false }
        ]
      }
    }
  }
}