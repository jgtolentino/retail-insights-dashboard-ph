// Retail Tools - Adapted from StockBot architecture for Philippine retail analytics
import { tool } from 'ai';
import { z } from 'zod';
import { supabaseServerClient } from '@/lib/supabase/serverClient';
import { safeExecute } from '@/lib/utils/safeExecute';

// Tool for getting sales metrics (replaces StockBot's getQuote)
export const getSalesMetrics = tool({
  description: 'Get sales metrics for Philippine retail data with filters',
  parameters: z.object({
    brandId: z.string().optional().describe('Specific brand ID to analyze'),
    dateRange: z.enum(['today', 'week', 'month', 'quarter']).default('week'),
    metric: z.enum(['revenue', 'transactions', 'basket_size']),
    region: z.string().optional().describe('Philippine region (NCR, Luzon, Visayas, Mindanao)')
  }),
  execute: async ({ brandId, dateRange, metric, region }) =>
    safeExecute(async () => {
      const supabase = supabaseServerClient();
      
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      
      switch (dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
      }

      let query = supabase
        .from('transactions')
        .select(`
          *,
          products!inner(
            name,
            brand:brands!inner(name, is_tbwa, category)
          )
        `)
        .gte('transaction_date', startDate.toISOString());

      if (brandId) {
        query = query.eq('products.brands.id', brandId);
      }

      if (region) {
        query = query.eq('region', region);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Process data based on metric
      let result;
      switch (metric) {
        case 'revenue':
          const totalRevenue = data.reduce((sum, t) => sum + (t.price * t.quantity), 0);
          result = {
            value: totalRevenue,
            formatted: `₱${totalRevenue.toLocaleString()}`,
            trend: calculateTrend(data, 'revenue'),
            chartData: generateChartData(data, 'revenue')
          };
          break;
        case 'transactions':
          result = {
            value: data.length,
            formatted: data.length.toLocaleString(),
            trend: calculateTrend(data, 'transactions'),
            chartData: generateChartData(data, 'transactions')
          };
          break;
        case 'basket_size':
          const avgBasket = data.reduce((sum, t) => sum + (t.price * t.quantity), 0) / data.length;
          result = {
            value: avgBasket,
            formatted: `₱${avgBasket.toFixed(2)}`,
            trend: calculateTrend(data, 'basket_size'),
            chartData: generateChartData(data, 'basket_size')
          };
          break;
      }

      return {
        type: 'sales_chart',
        metric,
        dateRange,
        region: region || 'All Philippines',
        data: result,
        visualization: 'line_chart'
      };
    })
});

// Tool for brand performance comparison (replaces StockBot's getFinancials)
export const getBrandPerformance = tool({
  description: 'Compare TBWA client brands vs competitors with market share analysis',
  parameters: z.object({
    category: z.string().optional().describe('Product category to focus on'),
    tbwaOnly: z.boolean().default(false).describe('Show only TBWA client brands'),
    period: z.enum(['week', 'month', 'quarter']).default('month')
  }),
  execute: async ({ category, tbwaOnly, period }) =>
    safeExecute(async () => {
      const supabase = supabaseServerClient();

      let query = supabase
        .from('transactions')
        .select(`
          *,
          products!inner(
            name,
            brand:brands!inner(name, is_tbwa, category)
          )
        `);

      if (category) {
        query = query.eq('products.brands.category', category);
      }

      if (tbwaOnly) {
        query = query.eq('products.brands.is_tbwa', true);
      }

      // Add date filter based on period
      const startDate = new Date();
      switch (period) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
      }

      query = query.gte('transaction_date', startDate.toISOString());

      const { data, error } = await query;
      if (error) throw error;

      // Group by brand and calculate metrics
      const brandMetrics = data.reduce((acc, transaction) => {
        const brandName = transaction.products.brand.name;
        const isTbwa = transaction.products.brand.is_tbwa;
        const revenue = transaction.price * transaction.quantity;

        if (!acc[brandName]) {
          acc[brandName] = {
            name: brandName,
            is_tbwa: isTbwa,
            revenue: 0,
            transactions: 0,
            category: transaction.products.brand.category
          };
        }

        acc[brandName].revenue += revenue;
        acc[brandName].transactions += 1;

        return acc;
      }, {});

      const brandArray = Object.values(brandMetrics);
      const totalMarketRevenue = brandArray.reduce((sum, brand: any) => sum + brand.revenue, 0);

      // Calculate market share and format results
      const results = brandArray
        .map((brand: any) => ({
          ...brand,
          marketShare: (brand.revenue / totalMarketRevenue) * 100,
          avgTransactionValue: brand.revenue / brand.transactions,
          formatted: {
            revenue: `₱${brand.revenue.toLocaleString()}`,
            marketShare: `${((brand.revenue / totalMarketRevenue) * 100).toFixed(1)}%`,
            avgTransaction: `₱${(brand.revenue / brand.transactions).toFixed(2)}`
          }
        }))
        .sort((a, b) => b.revenue - a.revenue);

      return {
        type: 'brand_comparison',
        category: category || 'All Categories',
        period,
        totalMarketSize: totalMarketRevenue,
        tbwaMarketShare: results
          .filter(b => b.is_tbwa)
          .reduce((sum, b) => sum + b.marketShare, 0),
        brands: results,
        visualization: 'bar_chart'
      };
    })
});

// Tool for regional analysis (Philippine-specific)
export const getRegionalAnalysis = tool({
  description: 'Analyze performance across Philippine regions (NCR, Luzon, Visayas, Mindanao)',
  parameters: z.object({
    metric: z.enum(['revenue', 'transactions', 'growth']).default('revenue'),
    compareWith: z.enum(['last_week', 'last_month', 'last_quarter']).default('last_week')
  }),
  execute: async ({ metric, compareWith }) =>
    safeExecute(async () => {
      const supabase = supabaseServerClient();

      // Get current period data
      const currentStartDate = new Date();
      const compareStartDate = new Date();
      const compareEndDate = new Date();

      switch (compareWith) {
        case 'last_week':
          currentStartDate.setDate(currentStartDate.getDate() - 7);
          compareStartDate.setDate(compareStartDate.getDate() - 14);
          compareEndDate.setDate(compareEndDate.getDate() - 7);
          break;
        case 'last_month':
          currentStartDate.setMonth(currentStartDate.getMonth() - 1);
          compareStartDate.setMonth(compareStartDate.getMonth() - 2);
          compareEndDate.setMonth(compareEndDate.getMonth() - 1);
          break;
        case 'last_quarter':
          currentStartDate.setMonth(currentStartDate.getMonth() - 3);
          compareStartDate.setMonth(compareStartDate.getMonth() - 6);
          compareEndDate.setMonth(compareEndDate.getMonth() - 3);
          break;
      }

      const [currentData, compareData] = await Promise.all([
        supabase
          .from('transactions')
          .select('*')
          .gte('transaction_date', currentStartDate.toISOString()),
        supabase
          .from('transactions')
          .select('*')
          .gte('transaction_date', compareStartDate.toISOString())
          .lt('transaction_date', compareEndDate.toISOString())
      ]);

      if (currentData.error || compareData.error) {
        throw currentData.error || compareData.error;
      }

      // Group by region
      const processRegionalData = (data: any[]) => {
        return data.reduce((acc, transaction) => {
          const region = transaction.region || 'Unknown';
          if (!acc[region]) {
            acc[region] = { revenue: 0, transactions: 0 };
          }
          acc[region].revenue += transaction.price * transaction.quantity;
          acc[region].transactions += 1;
          return acc;
        }, {});
      };

      const currentRegions = processRegionalData(currentData.data);
      const compareRegions = processRegionalData(compareData.data);

      // Calculate growth rates
      const regionAnalysis = Object.keys(currentRegions).map(region => {
        const current = currentRegions[region];
        const compare = compareRegions[region] || { revenue: 0, transactions: 0 };
        
        const revenueGrowth = compare.revenue > 0 
          ? ((current.revenue - compare.revenue) / compare.revenue) * 100 
          : 0;
        
        const transactionGrowth = compare.transactions > 0 
          ? ((current.transactions - compare.transactions) / compare.transactions) * 100 
          : 0;

        return {
          region,
          current: {
            revenue: current.revenue,
            transactions: current.transactions,
            avgTransaction: current.revenue / current.transactions
          },
          growth: {
            revenue: revenueGrowth,
            transactions: transactionGrowth
          },
          formatted: {
            revenue: `₱${current.revenue.toLocaleString()}`,
            transactions: current.transactions.toLocaleString(),
            revenueGrowth: `${revenueGrowth > 0 ? '+' : ''}${revenueGrowth.toFixed(1)}%`,
            transactionGrowth: `${transactionGrowth > 0 ? '+' : ''}${transactionGrowth.toFixed(1)}%`
          }
        };
      });

      return {
        type: 'regional_heatmap',
        metric,
        compareWith,
        regions: regionAnalysis.sort((a, b) => b.current.revenue - a.current.revenue),
        visualization: 'philippines_map'
      };
    })
});

// Tool for anomaly detection (replaces StockBot's getNews)
export const detectAnomalies = tool({
  description: 'Detect unusual patterns and anomalies in retail sales data',
  parameters: z.object({
    sensitivity: z.enum(['low', 'medium', 'high']).default('medium'),
    timeWindow: z.enum(['hourly', 'daily', 'weekly']).default('daily')
  }),
  execute: async ({ sensitivity, timeWindow }) =>
    safeExecute(async () => {
      const supabase = supabaseServerClient();

      // Get recent data for analysis
      const daysBack = timeWindow === 'hourly' ? 3 : timeWindow === 'daily' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          products!inner(
            name,
            brand:brands!inner(name, category)
          )
        `)
        .gte('transaction_date', startDate.toISOString())
        .order('transaction_date', { ascending: true });

      if (error) throw error;

      // Analyze for anomalies
      const anomalies = detectRetailAnomalies(data, sensitivity, timeWindow);

      return {
        type: 'anomaly_alerts',
        sensitivity,
        timeWindow,
        anomalies: anomalies.map(anomaly => ({
          ...anomaly,
          impact: calculateAnomalyImpact(anomaly),
          recommendations: generateRecommendations(anomaly)
        })),
        visualization: 'alert_cards'
      };
    })
});

// Helper functions
function calculateTrend(data: any[], metric: string): number {
  // Simplified trend calculation
  if (data.length < 2) return 0;
  
  const recent = data.slice(-Math.ceil(data.length / 2));
  const older = data.slice(0, Math.floor(data.length / 2));
  
  const recentValue = recent.reduce((sum, t) => sum + (t.price * t.quantity), 0);
  const olderValue = older.reduce((sum, t) => sum + (t.price * t.quantity), 0);
  
  return olderValue > 0 ? ((recentValue - olderValue) / olderValue) * 100 : 0;
}

function generateChartData(data: any[], metric: string): any[] {
  // Group by date and aggregate
  const grouped = data.reduce((acc, transaction) => {
    const date = new Date(transaction.transaction_date).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = { date, revenue: 0, transactions: 0 };
    }
    acc[date].revenue += transaction.price * transaction.quantity;
    acc[date].transactions += 1;
    return acc;
  }, {});

  return Object.values(grouped).sort((a: any, b: any) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

function detectRetailAnomalies(data: any[], sensitivity: string, timeWindow: string): any[] {
  // Simplified anomaly detection
  const thresholds = {
    low: 2.0,
    medium: 1.5,
    high: 1.0
  };
  
  const threshold = thresholds[sensitivity];
  const anomalies = [];
  
  // Group data by time window and detect spikes/drops
  const grouped = groupByTimeWindow(data, timeWindow);
  const values = Object.values(grouped).map((g: any) => g.revenue);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
  
  Object.entries(grouped).forEach(([period, groupData]: [string, any]) => {
    const zScore = Math.abs((groupData.revenue - mean) / stdDev);
    
    if (zScore > threshold) {
      anomalies.push({
        type: groupData.revenue > mean ? 'spike' : 'drop',
        period,
        value: groupData.revenue,
        severity: zScore > 2 ? 'high' : zScore > 1.5 ? 'medium' : 'low',
        description: `${groupData.revenue > mean ? 'Revenue spike' : 'Revenue drop'} detected in ${period}`,
        affectedTransactions: groupData.transactions
      });
    }
  });
  
  return anomalies;
}

function groupByTimeWindow(data: any[], timeWindow: string): any {
  return data.reduce((acc, transaction) => {
    let key;
    const date = new Date(transaction.transaction_date);
    
    switch (timeWindow) {
      case 'hourly':
        key = `${date.toISOString().split('T')[0]} ${date.getHours()}:00`;
        break;
      case 'daily':
        key = date.toISOString().split('T')[0];
        break;
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = `Week of ${weekStart.toISOString().split('T')[0]}`;
        break;
    }
    
    if (!acc[key]) {
      acc[key] = { revenue: 0, transactions: 0 };
    }
    
    acc[key].revenue += transaction.price * transaction.quantity;
    acc[key].transactions += 1;
    
    return acc;
  }, {});
}

function calculateAnomalyImpact(anomaly: any): string {
  if (anomaly.severity === 'high') {
    return 'Significant impact on overall performance';
  } else if (anomaly.severity === 'medium') {
    return 'Moderate impact requiring attention';
  }
  return 'Minor impact for monitoring';
}

function generateRecommendations(anomaly: any): string[] {
  const recommendations = [];
  
  if (anomaly.type === 'spike') {
    recommendations.push('Investigate supply chain capacity');
    recommendations.push('Analyze promotional activities');
    recommendations.push('Check inventory levels');
  } else {
    recommendations.push('Review pricing strategy');
    recommendations.push('Analyze competitor activities');
    recommendations.push('Check for operational issues');
  }
  
  return recommendations;
}

// Export all tools
export const retailTools = {
  getSalesMetrics,
  getBrandPerformance,
  getRegionalAnalysis,
  detectAnomalies
};