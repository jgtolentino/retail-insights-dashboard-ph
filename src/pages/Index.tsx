import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RefreshCw, TrendingUp, Calendar, BarChart3, CalendarDays, Store } from 'lucide-react';
// LineChart removed - now exclusively in Trends Explorer
import { simpleDashboardService } from '@/services/simple-dashboard';
import { behavioralDashboardService } from '@/services/behavioral-dashboard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TransactionCounter } from '@/components/TransactionCounter';
import { DashboardErrorBoundary } from '@/components/DashboardErrorBoundary';
import { HierarchicalBrandView } from '@/components/charts/HierarchicalBrandView';
import { SmartBrandFilter } from '@/components/charts/SmartBrandFilter';
import { DebugDataLoader } from '@/components/DebugDataLoader';
import { QuickDataCheck } from '@/components/QuickDataCheck';
// AI Panel disabled for production
// import { AIPanel } from '@/components/AIPanel'
// import { type DashboardData } from '@/services/aiService'
import { useBundleData } from '@/hooks/useBundleData';
import { warnInfiniteLoop } from '@/utils/devWarnings';

type DateRange = '1d' | '7d' | '30d' | '90d' | 'all' | 'custom';
// ChartMetric type removed - charts moved to Trends Explorer

interface Store {
  id: number;
  name: string;
  location: string;
}

export default function Index() {
  const [data, setData] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    avgTransaction: 0,
    uniqueCustomers: 0,
    suggestionAcceptanceRate: 0,
    substitutionRate: 0,
    suggestionsOffered: 0,
    suggestionsAccepted: 0,
    topBrands: [],
  });
  // timeSeriesData removed - charts moved to Trends Explorer
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('all');
  // chartMetric state removed - charts moved to Trends Explorer
  const [filteredBrands, setFilteredBrands] = useState<any[]>([]);

  // Stabilize the callback to prevent unnecessary re-renders
  const handleFilteredDataChange = useCallback((brands: any[]) => {
    setFilteredBrands(brands);
  }, []);
  const [viewMode, setViewMode] = useState<'hierarchical' | 'filtered'>('hierarchical');

  // Custom date range state
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  // Store filtering state
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);

  // Derive top brand from existing data instead of making duplicate API call
  const topBrandData =
    data.topBrands && data.topBrands.length > 0
      ? {
          brand_name: data.topBrands[0].name,
          revenue: data.topBrands[0].sales,
          transaction_count: null,
        }
      : null;

  // Replace bundleData state and useEffect with useBundleData hook
  const { data: bundleData, isLoading: bundleLoading } = useBundleData(!loading);

  // Add development warnings for other useEffect hooks
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      warnInfiniteLoop('Index', 'data.totalTransactions');
    }
    fetchStores();
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      warnInfiniteLoop('Index', 'dateRange, customStartDate, customEndDate, selectedStoreId');
    }
    fetchData();
  }, [dateRange, customStartDate, customEndDate, selectedStoreId]);

  const fetchStores = async () => {
    try {
      setLoadingStores(true);
      const { data: storesData, error } = await supabase
        .from('transactions')
        .select('store_id, store_location')
        .not('store_id', 'is', null)
        .not('store_location', 'is', null);

      if (error) throw error;

      // Group by store_id and get unique stores
      const uniqueStores = new Map<number, Store>();
      storesData?.forEach(item => {
        if (item.store_id && item.store_location) {
          uniqueStores.set(item.store_id, {
            id: item.store_id,
            name: `Store ${item.store_id}`,
            location: item.store_location,
          });
        }
      });

      setStores(Array.from(uniqueStores.values()).sort((a, b) => a.id - b.id));
    } catch (error) {
      console.error('❌ Error fetching stores:', error);
      setStores([]);
    } finally {
      setLoadingStores(false);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let dashboardData;
      let startDate, endDate;

      // Calculate date range
      const now = new Date();
      if (dateRange === 'custom' && customStartDate && customEndDate) {
        startDate = customStartDate;
        endDate = customEndDate;
      } else if (dateRange !== 'custom') {
        switch (dateRange) {
          case '1d':
            startDate = new Date(now.setDate(now.getDate() - 1)).toISOString().split('T')[0];
            break;
          case '7d':
            startDate = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
            break;
          case '30d':
            startDate = new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0];
            break;
          case '90d':
            startDate = new Date(now.setDate(now.getDate() - 90)).toISOString().split('T')[0];
            break;
          default:
            startDate = undefined;
            endDate = undefined;
        }
        if (startDate && !endDate) {
          endDate = new Date().toISOString().split('T')[0];
        }
      } else {
        // Custom range selected but dates not set yet
        return;
      }

      // Try behavioral dashboard first, fallback to simple dashboard
      try {
        dashboardData = await behavioralDashboardService.getDashboardSummary(
          startDate,
          endDate,
          selectedStoreId || undefined
        );
        console.log(
          '🧠 Using behavioral dashboard data',
          selectedStoreId ? `for store ${selectedStoreId}` : 'for all stores'
        );
      } catch (error) {
        console.warn('⚠️ Behavioral dashboard unavailable, falling back to simple dashboard');
        dashboardData = await simpleDashboardService.getDashboardData();
      }

      console.log('📊 Dashboard data received:', dashboardData);
      console.log('📈 Time series data:', dashboardData?.timeSeriesData?.length || 0, 'records');
      console.log('🔢 TRANSACTION COUNT DEBUG:', {
        totalTransactions: dashboardData?.totalTransactions,
        totalRevenue: dashboardData?.totalRevenue,
        avgTransaction: dashboardData?.avgTransaction,
        dateRange,
        dateRangeUsed: dateRange,
      });

      // Ensure we have valid data with fallbacks
      setData(
        dashboardData || {
          totalRevenue: 0,
          totalTransactions: 0,
          avgTransaction: 0,
          uniqueCustomers: 0,
          suggestionAcceptanceRate: 0,
          substitutionRate: 0,
          suggestionsOffered: 0,
          suggestionsAccepted: 0,
          topBrands: [],
        }
      );

      // timeSeriesData removed - charts moved to Trends Explorer
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data. Please check your connection.');
      // Set fallback data
      setData({
        totalRevenue: 0,
        totalTransactions: 0,
        avgTransaction: 0,
        topBrands: [],
      });
      // timeSeriesData cleanup removed
    } finally {
      setLoading(false);
    }
  }, [dateRange, customStartDate, customEndDate, selectedStoreId]);

  const handleRefresh = () => {
    fetchData();
  };

  const handleDateRangeChange = useCallback(
    (newRange: DateRange) => {
      setDateRange(newRange);
      if (newRange === 'custom') {
        setShowCustomDatePicker(true);
        // Set default custom dates to last 30 days but don't trigger fetch yet
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);

        // Only set dates if they're not already set to prevent unnecessary re-renders
        const newEndDate = endDate.toISOString().split('T')[0];
        const newStartDate = startDate.toISOString().split('T')[0];

        if (customEndDate !== newEndDate) setCustomEndDate(newEndDate);
        if (customStartDate !== newStartDate) setCustomStartDate(newStartDate);
      } else {
        setShowCustomDatePicker(false);
        // Clear custom dates when not in custom mode to prevent stale data
        if (customStartDate) setCustomStartDate('');
        if (customEndDate) setCustomEndDate('');
      }
    },
    [customStartDate, customEndDate]
  );

  const handleCustomDateApply = () => {
    if (customStartDate && customEndDate) {
      fetchData();
    }
  };

  const dateRangeOptions = [
    { value: 'all' as DateRange, label: 'All Time' },
    { value: '1d' as DateRange, label: 'Today' },
    { value: '7d' as DateRange, label: '7 Days' },
    { value: '30d' as DateRange, label: '30 Days' },
    { value: '90d' as DateRange, label: '90 Days' },
    { value: 'custom' as DateRange, label: 'Custom Range' },
  ];

  // Chart functions removed - charts moved to Trends Explorer

  const getDateRangeLabel = () => {
    const baseLabel =
      dateRange === 'custom' && customStartDate && customEndDate
        ? `${customStartDate} to ${customEndDate}`
        : dateRangeOptions.find(opt => opt.value === dateRange)?.label || 'Unknown';

    const storeLabel = selectedStoreId
      ? ` • ${stores.find(s => s.id === selectedStoreId)?.name || `Store ${selectedStoreId}`}`
      : ' • All Stores';

    return baseLabel + storeLabel;
  };

  // renderChart function removed - charts moved to Trends Explorer

  // AI dashboard data - Disabled for production
  /*
  const aiDashboardData: DashboardData = {
    transactions: {
      total: data.totalTransactions,
      growth: timeSeriesData.length > 1 ? 
        ((timeSeriesData[timeSeriesData.length - 1]?.transactions - timeSeriesData[0]?.transactions) / timeSeriesData[0]?.transactions * 100) || 0 : 0,
      avgBasketSize: data.avgTransaction,
    },
    revenue: {
      total: data.totalRevenue,
      growth: timeSeriesData.length > 1 ? 
        ((timeSeriesData[timeSeriesData.length - 1]?.revenue - timeSeriesData[0]?.revenue) / timeSeriesData[0]?.revenue * 100) || 0 : 0,
      trend: timeSeriesData.map(d => d.revenue),
    },
    products: {
      topSellers: data.topBrands.map(brand => ({ name: brand.name, sales: brand.total_sales })),
      categories: categories.map(cat => ({ name: cat.name, performance: cat.count })),
    },
    customers: {
      ageDistribution: [
        { age: '18-24', count: 120 },
        { age: '25-34', count: 350 },
        { age: '35-44', count: 280 },
        { age: '45-54', count: 180 },
        { age: '55+', count: 70 },
      ],
      genderDistribution: [
        { gender: 'Female', count: 520 },
        { gender: 'Male', count: 480 },
      ],
    },
  };
  */

  return (
    <DashboardErrorBoundary>
      <div className="space-y-6">
        {/* Data Check - Development only to avoid duplicate API calls */}
        {process.env.NODE_ENV === 'development' && <QuickDataCheck />}

        {/* Header with Transaction Counter */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Dashboard Overview</h1>
            <p className="mt-1 text-sm text-gray-600 sm:mt-2 sm:text-base">
              Real-time retail analytics for sari-sari stores
            </p>
          </div>

          {/* Transaction Counter */}
          <TransactionCounter
            currentCount={data.totalTransactions || 0}
            dateRange={dateRange}
            isLoading={loading}
          />
        </div>

        {/* Product Categories - Moved to Product Mix page */}

        {/* AI Insights Panel - Disabled for production */}
        {/* <AIPanel dashboardData={aiDashboardData} className="lg:max-w-md" /> */}

        {/* Error Alert */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {dateRangeOptions.map(option => (
                <Button
                  key={option.value}
                  variant={dateRange === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleDateRangeChange(option.value)}
                  disabled={loading}
                  className="flex items-center gap-1"
                >
                  {option.value === 'custom' && <CalendarDays className="h-3 w-3" />}
                  {option.label}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {/* Store Filter */}
              <Select
                value={selectedStoreId?.toString() || 'all'}
                onValueChange={value =>
                  setSelectedStoreId(value === 'all' ? null : parseInt(value))
                }
                disabled={loading || loadingStores}
              >
                <SelectTrigger className="h-8 w-[180px]">
                  <div className="flex items-center gap-1">
                    <Store className="h-3 w-3" />
                    <SelectValue placeholder="All Stores" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stores</SelectItem>
                  {stores.map(store => (
                    <SelectItem key={store.id} value={store.id.toString()}>
                      {store.name} - {store.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Custom Date Picker */}
          {showCustomDatePicker && (
            <Card className="p-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="min-w-[200px] flex-1">
                  <Label htmlFor="start-date" className="text-sm font-medium">
                    Start Date
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={customStartDate}
                    onChange={e => setCustomStartDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="min-w-[200px] flex-1">
                  <Label htmlFor="end-date" className="text-sm font-medium">
                    End Date
                  </Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={customEndDate}
                    onChange={e => setCustomEndDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={handleCustomDateApply}
                  disabled={!customStartDate || !customEndDate || loading}
                  className="flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Apply Range
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* KPI Cards - Enhanced with behavioral metrics */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {/* Total Revenue Card */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {loading ? '...' : `₱${(data.totalRevenue || 0).toLocaleString()}`}
              </div>
            </CardContent>
          </Card>

          {/* Total Transactions Card */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {loading ? '...' : (data.totalTransactions || 0).toLocaleString()}
              </div>
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-1 text-xs text-gray-400">Raw: {data.totalTransactions}</div>
              )}
            </CardContent>
          </Card>

          {/* Average Transaction Card */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Average Transaction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {loading ? '...' : `₱${Math.round(data.avgTransaction || 0)}`}
              </div>
            </CardContent>
          </Card>

          {/* Suggestion Acceptance Rate Card */}
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-700">
                Suggestion Acceptance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">
                {loading ? '...' : `${(data.suggestionAcceptanceRate || 0).toFixed(1)}%`}
              </div>
              <div className="mt-1 text-xs text-green-600">
                {loading
                  ? '...'
                  : `${data.suggestionsAccepted || 0} of ${data.suggestionsOffered || 0}`}
              </div>
            </CardContent>
          </Card>

          {/* Substitution Rate Card */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-700">Substitution Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">
                {loading ? '...' : `${(data.substitutionRate || 0).toFixed(1)}%`}
              </div>
              <div className="mt-1 text-xs text-blue-600">
                {loading ? '...' : `${data.uniqueCustomers || 0} unique customers`}
              </div>
            </CardContent>
          </Card>

          {/* Top Brand Card */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Top Brand</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="truncate text-xl font-bold text-gray-900">
                  {loading ? '...' : topBrandData?.brand_name || 'N/A'}
                </div>
                <div className="text-xs text-gray-500">
                  {loading
                    ? '...'
                    : topBrandData?.revenue
                      ? `₱${(topBrandData.revenue / 1000).toFixed(0)}K`
                      : 'No data'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Bundle Card */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Top Bundle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="truncate text-base font-bold text-gray-900">
                  {bundleLoading || loading
                    ? '...'
                    : bundleData
                      ? `${bundleData.product_1} + ${bundleData.product_2}`
                      : 'No bundles'}
                </div>
                <div className="text-xs text-gray-500">
                  {bundleLoading || loading
                    ? '...'
                    : bundleData
                      ? `${bundleData.frequency}x • ${bundleData.confidence}%`
                      : 'No data'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trends Explorer Call-to-Action */}
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-blue-900">Explore Detailed Trends</CardTitle>
                <p className="mt-1 text-sm text-blue-700">
                  View comprehensive time series analysis, heatmaps, and trend insights
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <ul className="space-y-1 text-sm text-blue-700">
                  <li>• Day of Week & Weekday vs Weekend analysis</li>
                  <li>• Transaction time heatmaps</li>
                  <li>• Regional and barangay-level trends</li>
                  <li>• Annotated insights and pattern detection</li>
                </ul>
              </div>
              <div className="ml-6">
                <Button
                  onClick={() => (window.location.href = '/trends')}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Open Trends Explorer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Brand Analysis */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Brand Revenue Analysis</CardTitle>
                <p className="text-sm text-gray-500">
                  Interactive drill-down view • Based on {getDateRangeLabel()}
                </p>
              </div>

              {/* View Mode Toggle */}
              <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
                <Button
                  variant={viewMode === 'hierarchical' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('hierarchical')}
                  className="text-xs"
                >
                  Hierarchical
                </Button>
                <Button
                  variant={viewMode === 'filtered' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('filtered')}
                  className="text-xs"
                >
                  Filtered
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-4 w-32 animate-pulse rounded bg-gray-200"></div>
                    <div className="h-6 flex-1 animate-pulse rounded-full bg-gray-200"></div>
                    <div className="h-4 w-12 animate-pulse rounded bg-gray-200"></div>
                  </div>
                ))}
              </div>
            ) : !data.topBrands || data.topBrands.length === 0 ? (
              <div className="space-y-4 py-8 text-center text-gray-500">
                <div>
                  <BarChart3 className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                  <h3 className="mb-2 text-lg font-medium text-gray-900">No Brand Data</h3>
                  <p className="text-sm">No brand sales data found for the selected time period.</p>
                  <p className="mt-1 text-sm">
                    Try a different date range or verify your database has transaction data.
                  </p>
                  {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                </div>
                <div className="flex justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleRefresh}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Data
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDateRangeChange('all')}>
                    Reset to All Time
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {viewMode === 'hierarchical' ? (
                  <HierarchicalBrandView
                    brands={data.topBrands.map((brand, index) => ({
                      id: index.toString(),
                      name: brand.name,
                      sales: brand.sales,
                      category: brand.category || 'Other',
                      is_tbwa: brand.is_tbwa || false,
                    }))}
                  />
                ) : (
                  <div className="space-y-4">
                    <SmartBrandFilter
                      brands={data.topBrands.map((brand, index) => ({
                        id: index.toString(),
                        name: brand.name,
                        sales: brand.sales,
                        category: brand.category || 'Other',
                        is_tbwa: brand.is_tbwa || false,
                      }))}
                      onFilteredDataChange={handleFilteredDataChange}
                    />

                    {/* Filtered Results */}
                    <div className="space-y-2">
                      {filteredBrands.slice(0, 15).map((brand, index) => {
                        const maxSales = Math.max(...filteredBrands.map(b => b.sales));
                        const percentage = (brand.sales / maxSales) * 100;

                        return (
                          <div key={brand.id} className="flex items-center gap-4">
                            <div className="flex w-32 items-center justify-end gap-1 text-right text-sm font-medium">
                              {brand.name}
                              {brand.is_tbwa && (
                                <div
                                  className="h-2 w-2 rounded-full bg-green-500"
                                  title="TBWA Client"
                                />
                              )}
                            </div>
                            <div className="relative h-6 flex-1 rounded-full bg-gray-200">
                              <div
                                className={`flex h-6 items-center justify-end rounded-full pr-2 transition-all duration-300 ${
                                  brand.is_tbwa ? 'bg-green-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${percentage}%` }}
                              >
                                <span className="text-xs font-medium text-white">
                                  ₱{brand.sales.toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div className="w-16 text-right text-sm text-gray-600">
                              {((brand.sales / (data.totalRevenue || 1)) * 100).toFixed(1)}%
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardErrorBoundary>
  );
}
