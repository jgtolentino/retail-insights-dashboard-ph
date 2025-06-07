import { tool } from 'ai';
import { z } from 'zod';
import { safeExecute } from '../../utils/safeExecute';
import { getDateRange, processSalesData, fetchBrandComparison, fetchRegionalData, detectRetailAnomalies } from '../../utils/retail';
import { supabaseAdmin } from '../../supabase/serverClient';

/**
 * Production-hardened retail tools for Groq StockBot
 * Philippine retail analytics with comprehensive error handling
 */

export const retailTools = {
  getSalesMetrics: tool({
    description: 'Get sales metrics for Philippine retail data with filters',
    parameters: z.object({
      brandId: z.string().optional().describe('Filter by specific brand ID'),
      dateRange: z.enum(['today', 'week', 'month', 'quarter']).default('week').describe('Date range for metrics'),
      metric: z.enum(['revenue', 'transactions', 'basket_size']).describe('Type of sales metric'),
      region: z.string().optional().describe('Filter by Philippine region')
    }),
    execute: async ({ brandId, dateRange, metric, region }) =>
      safeExecute(async () => {
        const { start, end } = getDateRange(dateRange);
        
        let query = supabaseAdmin
          .from('transactions')
          .select(`
            id,
            total_amount,
            created_at,
            stores!inner(region),
            transaction_items!inner(brand_id)
          `)
          .gte('created_at', start)
          .lte('created_at', end);

        if (brandId) {
          query = query.eq('transaction_items.brand_id', brandId);
        }

        if (region) {
          query = query.eq('stores.region', region);
        }

        const { data, error } = await query;
        if (error) throw error;

        const processedData = processSalesData(data || []);
        const totalTransactions = processedData.length;
        const totalRevenue = processedData.reduce((sum, item) => sum + item.revenue, 0);
        const avgBasketSize = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

        let resultValue: number;
        switch (metric) {
          case 'revenue':
            resultValue = totalRevenue;
            break;
          case 'transactions':
            resultValue = totalTransactions;
            break;
          case 'basket_size':
            resultValue = avgBasketSize;
            break;
        }

        return {
          type: 'sales_chart',
          data: processedData,
          metric,
          value: resultValue,
          period: dateRange,
          region: region || 'All Philippines',
          brandFilter: brandId || 'All brands',
          currency: 'PHP',
          visualization: 'line_chart'
        };
      })
  ),

  getBrandPerformance: tool({
    description: 'Compare TBWA client brands vs competitors performance',
    parameters: z.object({
      brands: z.array(z.string()).optional().describe('Specific brand IDs to compare'),
      metric: z.enum(['revenue', 'growth', 'market_share']).default('revenue').describe('Comparison metric'),
      dateRange: z.enum(['week', 'month', 'quarter']).default('month').describe('Analysis period'),
      includeCompetitors: z.boolean().default(true).describe('Include competitor brands')
    }),
    execute: async (params) =>
      safeExecute(() => fetchBrandComparison(params))
  ),

  getRegionalAnalysis: tool({
    description: 'Analyze performance across Philippine regions',
    parameters: z.object({
      metric: z.string().default('revenue').describe('Metric to analyze'),
      groupBy: z.enum(['region', 'city', 'store']).default('region').describe('Geographic grouping level'),
      dateRange: z.enum(['week', 'month', 'quarter']).default('month').describe('Analysis period')
    }),
    execute: async (params) =>
      safeExecute(() => fetchRegionalData(params))
  ),

  detectAnomalies: tool({
    description: 'Detect unusual patterns or anomalies in retail data',
    parameters: z.object({
      sensitivity: z.number().min(1).max(5).default(3).describe('Sensitivity level (1=low, 5=high)'),
      timeframe: z.enum(['day', 'week', 'month']).default('week').describe('Analysis timeframe')
    }),
    execute: async (params) =>
      safeExecute(() => detectRetailAnomalies(params))
  )
};

export default retailTools;