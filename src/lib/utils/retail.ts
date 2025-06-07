import { supabaseAdmin } from '../supabase/serverClient';

/**
 * Production-ready Philippine retail utilities
 */

export function getDateRange(range: 'today' | 'week' | 'month' | 'quarter') {
  const now = new Date();
  const start = new Date();
  
  switch (range) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(now.getDate() - 7);
      break;
    case 'month':
      start.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      start.setMonth(now.getMonth() - 3);
      break;
  }
  
  return { 
    start: start.toISOString(), 
    end: now.toISOString() 
  };
}

export function processSalesData(records: any[]) {
  return records.map(r => ({
    date: r.created_at ? r.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    revenue: r.total_amount || 0,
    transactions: 1,
    basket_size: (r.total_amount || 0) / Math.max(1, r.item_count || 1)
  }));
}

export async function fetchBrandComparison(params: {
  brands?: string[];
  metric?: 'revenue' | 'growth' | 'market_share';
  dateRange?: 'week' | 'month' | 'quarter';
}) {
  const { start, end } = getDateRange(params.dateRange || 'month');
  
  let query = supabaseAdmin
    .from('transaction_items')
    .select(`
      quantity,
      price,
      brands!inner(id, name, category, is_client),
      transactions!inner(created_at)
    `)
    .gte('transactions.created_at', start)
    .lte('transactions.created_at', end);

  if (params.brands && params.brands.length > 0) {
    query = query.in('brand_id', params.brands);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Group by brand and calculate metrics
  const brandMetrics = data?.reduce((acc, item) => {
    const brandName = item.brands.name;
    const revenue = (item.quantity || 0) * (item.price || 0);

    if (!acc[brandName]) {
      acc[brandName] = {
        name: brandName,
        isClient: item.brands.is_client,
        category: item.brands.category,
        revenue: 0,
        transactions: 0,
      };
    }

    acc[brandName].revenue += revenue;
    acc[brandName].transactions += 1;
    return acc;
  }, {} as Record<string, any>) || {};

  const brands = Object.values(brandMetrics).sort((a: any, b: any) => b.revenue - a.revenue);

  return {
    type: 'brand_comparison',
    data: brands,
    visualization: 'bar_chart',
    period: params.dateRange || 'month',
    metric: params.metric || 'revenue'
  };
}

export async function fetchRegionalData(params: {
  metric?: string;
  groupBy?: 'region' | 'city' | 'store';
  dateRange?: 'week' | 'month' | 'quarter';
}) {
  const { start, end } = getDateRange(params.dateRange || 'month');
  
  const { data, error } = await supabaseAdmin
    .from('transactions')
    .select(`
      id,
      total_amount,
      created_at,
      stores!inner(id, name, city, region)
    `)
    .gte('created_at', start)
    .lte('created_at', end);

  if (error) throw error;

  // Group by the specified dimension
  const grouped = data?.reduce((acc, transaction) => {
    let key: string;
    switch (params.groupBy) {
      case 'region':
        key = transaction.stores.region || 'Unknown';
        break;
      case 'city':
        key = transaction.stores.city || 'Unknown';
        break;
      case 'store':
        key = transaction.stores.name || 'Unknown';
        break;
      default:
        key = transaction.stores.region || 'Unknown';
    }

    if (!acc[key]) {
      acc[key] = {
        name: key,
        revenue: 0,
        transactions: 0,
        stores: new Set(),
      };
    }

    acc[key].revenue += transaction.total_amount || 0;
    acc[key].transactions += 1;
    acc[key].stores.add(transaction.stores.id);
    return acc;
  }, {} as Record<string, any>) || {};

  // Convert to array and add calculated fields
  const regions = Object.values(grouped).map((r: any) => ({
    ...r,
    storeCount: r.stores.size,
    avgTransactionValue: r.transactions > 0 ? r.revenue / r.transactions : 0,
  })).sort((a: any, b: any) => b.revenue - a.revenue);

  return {
    type: 'regional_analysis',
    data: regions,
    visualization: 'map_chart',
    groupBy: params.groupBy || 'region',
    period: params.dateRange || 'month'
  };
}

export async function detectRetailAnomalies(params: {
  sensitivity?: number;
  timeframe?: 'day' | 'week' | 'month';
}) {
  const timeframe = params.timeframe || 'week';
  const sensitivity = params.sensitivity || 3;
  
  // Get current and previous period data
  const now = new Date();
  let currentStart: Date, previousStart: Date, periodDays: number;

  switch (timeframe) {
    case 'day':
      periodDays = 1;
      break;
    case 'week':
      periodDays = 7;
      break;
    case 'month':
      periodDays = 30;
      break;
  }

  currentStart = new Date(now);
  currentStart.setDate(now.getDate() - periodDays);
  
  previousStart = new Date(currentStart);
  previousStart.setDate(currentStart.getDate() - periodDays);

  const [currentData, previousData] = await Promise.all([
    supabaseAdmin
      .from('transactions')
      .select('id, total_amount, created_at')
      .gte('created_at', currentStart.toISOString())
      .lte('created_at', now.toISOString()),
    supabaseAdmin
      .from('transactions')
      .select('id, total_amount, created_at')
      .gte('created_at', previousStart.toISOString())
      .lte('created_at', currentStart.toISOString())
  ]);

  if (currentData.error || previousData.error) {
    throw new Error('Failed to fetch anomaly detection data');
  }

  // Calculate metrics
  const currentMetrics = {
    transactions: currentData.data?.length || 0,
    revenue: currentData.data?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0,
  };

  const previousMetrics = {
    transactions: previousData.data?.length || 0,
    revenue: previousData.data?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0,
  };

  // Calculate percentage changes
  const revenueChange = previousMetrics.revenue > 0 ? 
    ((currentMetrics.revenue - previousMetrics.revenue) / previousMetrics.revenue) * 100 : 0;
  const transactionChange = previousMetrics.transactions > 0 ? 
    ((currentMetrics.transactions - previousMetrics.transactions) / previousMetrics.transactions) * 100 : 0;

  // Detect anomalies based on sensitivity
  const anomalies = [];
  const threshold = Math.max(10, 30 / sensitivity); // Adjustable threshold

  if (Math.abs(revenueChange) > threshold) {
    anomalies.push({
      type: 'revenue_anomaly',
      severity: Math.abs(revenueChange) > threshold * 2 ? 'high' : 'medium',
      description: `Revenue ${revenueChange > 0 ? 'spike' : 'drop'} of ${Math.abs(revenueChange).toFixed(1)}%`,
      change: revenueChange,
      metric: 'revenue'
    });
  }

  if (Math.abs(transactionChange) > threshold) {
    anomalies.push({
      type: 'transaction_anomaly',
      severity: Math.abs(transactionChange) > threshold * 2 ? 'high' : 'medium',
      description: `Transaction ${transactionChange > 0 ? 'surge' : 'decline'} of ${Math.abs(transactionChange).toFixed(1)}%`,
      change: transactionChange,
      metric: 'transactions'
    });
  }

  return {
    type: 'anomaly_detection',
    data: {
      anomalies,
      currentMetrics,
      previousMetrics,
      timeframe,
      sensitivity
    },
    visualization: 'alert_list'
  };
}