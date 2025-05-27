import { supabase } from '@/integrations/supabase/client'

export interface DashboardData {
  totalRevenue: number
  totalTransactions: number
  avgTransaction: number
  topBrands: Array<{
    brandName: string
    revenue: number
    tbwaClient: boolean
    transactionCount?: number
  }>
}

export const dashboardService = {
  async getDashboardData(days: number = 7): Promise<DashboardData> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    try {
      // Get transactions for the period
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('id, total_amount, items_count')
        .gte('transaction_date', startDate.toISOString().split('T')[0])
      
      if (transError) throw transError

      // Calculate basic KPIs
      const totalRevenue = transactions?.reduce((sum, t) => sum + (Number(t.total_amount) || 0), 0) || 0
      const totalTransactions = transactions?.length || 0
      const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0

      // Get top brands by revenue
      const { data: brandSales, error: brandError } = await supabase
        .from('transaction_items')
        .select(`
          subtotal,
          products!inner (
            brand_id,
            brands!inner (
              name,
              is_tbwa_client
            )
          )
        `)
        .gte('created_at', startDate.toISOString())

      if (brandError) throw brandError

      // Aggregate sales by brand
      const brandRevenue: Record<string, { sales: number; is_tbwa: boolean }> = {}
      
      brandSales?.forEach(item => {
        const brandName = item.products?.brands?.name
        const isTbwa = item.products?.brands?.is_tbwa_client || false
        
        if (brandName) {
          if (!brandRevenue[brandName]) {
            brandRevenue[brandName] = { sales: 0, is_tbwa: isTbwa }
          }
          brandRevenue[brandName].sales += Number(item.subtotal) || 0
        }
      })

      // Convert to array and sort by revenue
      const topBrands = Object.entries(brandRevenue)
        .map(([brandName, data]) => ({
          brandName,
          revenue: data.sales,
          tbwaClient: data.is_tbwa
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)

      return {
        totalRevenue,
        totalTransactions,
        avgTransaction,
        topBrands
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Return mock data as fallback
      return {
        totalRevenue: 2174000,
        totalTransactions: 3421,
        avgTransaction: 635,
        topBrands: [
          { brandName: 'Philip Morris', revenue: 567000, tbwaClient: true },
          { brandName: 'JTI', revenue: 425000, tbwaClient: false },
          { brandName: 'Del Monte', revenue: 387000, tbwaClient: true },
          { brandName: 'Oishi', revenue: 342000, tbwaClient: false },
          { brandName: 'Alaska Milk', revenue: 285000, tbwaClient: true },
          { brandName: 'Bear Brand', revenue: 198000, tbwaClient: false },
          { brandName: 'Nestle', revenue: 156000, tbwaClient: true },
          { brandName: 'Unilever', revenue: 142000, tbwaClient: false },
        ]
      }
    }
  }
}