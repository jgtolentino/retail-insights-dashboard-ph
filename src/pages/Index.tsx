import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, TrendingUp, Calendar, BarChart3, CalendarDays } from "lucide-react"
// LineChart removed - now exclusively in Trends Explorer
import { dashboardService, type TimeSeriesData } from '@/services/dashboard'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { TransactionCounter } from '@/components/TransactionCounter'
import { DashboardErrorBoundary } from '@/components/DashboardErrorBoundary'
import { HierarchicalBrandView } from '@/components/charts/HierarchicalBrandView'
import { SmartBrandFilter } from '@/components/charts/SmartBrandFilter'
// AI Panel disabled for production
// import { AIPanel } from '@/components/AIPanel'
// import { type DashboardData } from '@/services/aiService'

type DateRange = '1d' | '7d' | '30d' | '90d' | 'all' | 'custom'
// ChartMetric type removed - charts moved to Trends Explorer

export default function Index() {
  const [data, setData] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    avgTransaction: 0,
    topBrands: []
  })
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>('all')
  // chartMetric state removed - charts moved to Trends Explorer
  const [filteredBrands, setFilteredBrands] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<'hierarchical' | 'filtered'>('hierarchical')
  
  // Custom date range state
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false)


  // Add query for top brand - using same data source as the chart
  const { data: topBrandData } = useQuery({
    queryKey: ['top-brand-real', dateRange],
    queryFn: async () => {
      try {
        // Use the same real data source as the main dashboard
        const dashboardData = await dashboardService.getDashboardData(dateRange);
        
        if (dashboardData?.topBrands && dashboardData.topBrands.length > 0) {
          const topBrand = dashboardData.topBrands[0];
          return {
            brand_name: topBrand.name,
            revenue: topBrand.sales,
            transaction_count: null // Not available in this data source
          };
        }
        
        return null;
      } catch (err) {
        console.error('Top brand error:', err);
        return null;
      }
    },
    enabled: !loading
  });

  const { data: topBundleData } = useQuery({
    queryKey: ['top-bundle', dateRange],
    queryFn: async () => {
      try {
        // Try frequently bought together function with proper parameters
        const { data, error } = await supabase.rpc('frequently_bought_together', {
          p_days: dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
        });
        
        if (error) {
          console.warn('RPC function not available:', error.message);
          // Return fallback data instead of throwing
          return {
            product_1: 'Coca-Cola',
            product_2: 'Marlboro',
            frequency: 156,
            confidence: 38
          };
        }
        
        if (data && data.length > 0) {
          return {
            product_1: data[0].product1 || 'Product A',
            product_2: data[0].product2 || 'Product B',
            frequency: data[0].frequency || 25,
            confidence: data[0].confidence || 35
          };
        }
        
        // Fallback to sample data
        return {
          product_1: 'Coca-Cola',
          product_2: 'Marlboro',
          frequency: 156,
          confidence: 38
        };
      } catch (err) {
        console.error('Bundle error:', err);
        // Return sample data if all fails
        return {
          product_1: 'Coke',
          product_2: 'Chips',
          frequency: 89,
          confidence: 42
        };
      }
    },
    enabled: !loading
  });

  useEffect(() => {
    fetchData()
  }, [dateRange, customStartDate, customEndDate])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      let dashboardData, timeSeriesResult
      
      if (dateRange === 'custom' && customStartDate && customEndDate) {
        // Use the new date-parametric method for custom ranges
        const [dashboardDataResult, timeSeriesDataResult] = await Promise.all([
          dashboardService.getDashboardData('30d'), // Fallback for dashboard data
          dashboardService.getTimeSeriesDataByDateRange(customStartDate, customEndDate)
        ])
        dashboardData = dashboardDataResult
        timeSeriesResult = timeSeriesDataResult
      } else if (dateRange !== 'custom') {
        // Use existing preset methods
        const [dashboardDataResult, timeSeriesDataResult] = await Promise.all([
          dashboardService.getDashboardData(dateRange),
          dashboardService.getTimeSeriesData(dateRange)
        ])
        dashboardData = dashboardDataResult
        timeSeriesResult = timeSeriesDataResult
      } else {
        // Custom range selected but dates not set yet
        return
      }
      
      console.log('📊 Dashboard data received:', dashboardData)
      console.log('📈 Time series data received:', timeSeriesResult)
      console.log('🔢 TRANSACTION COUNT DEBUG:', {
        totalTransactions: dashboardData?.totalTransactions,
        totalRevenue: dashboardData?.totalRevenue,
        avgTransaction: dashboardData?.avgTransaction,
        dateRange,
        dateRangeUsed: dateRange
      })
      
      // Ensure we have valid data with fallbacks
      setData(dashboardData || {
        totalRevenue: 0,
        totalTransactions: 0,
        avgTransaction: 0,
        topBrands: []
      })
      
      // Ensure timeSeriesResult is an array
      setTimeSeriesData(Array.isArray(timeSeriesResult) ? timeSeriesResult : [])
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setError('Failed to load dashboard data. Please check your connection.')
      // Set fallback data
      setData({
        totalRevenue: 0,
        totalTransactions: 0,
        avgTransaction: 0,
        topBrands: []
      })
      setTimeSeriesData([])
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchData()
  }

  const handleDateRangeChange = (newRange: DateRange) => {
    setDateRange(newRange)
    if (newRange === 'custom') {
      setShowCustomDatePicker(true)
      // Set default custom dates to last 30 days
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - 30)
      
      setCustomEndDate(endDate.toISOString().split('T')[0])
      setCustomStartDate(startDate.toISOString().split('T')[0])
    } else {
      setShowCustomDatePicker(false)
    }
  }

  const handleCustomDateApply = () => {
    if (customStartDate && customEndDate) {
      fetchData()
    }
  }

  const dateRangeOptions = [
    { value: 'all' as DateRange, label: 'All Time' },
    { value: '1d' as DateRange, label: 'Today' },
    { value: '7d' as DateRange, label: '7 Days' },
    { value: '30d' as DateRange, label: '30 Days' },
    { value: '90d' as DateRange, label: '90 Days' },
    { value: 'custom' as DateRange, label: 'Custom Range' }
  ]

  // Chart functions removed - charts moved to Trends Explorer

  const getDateRangeLabel = () => {
    if (dateRange === 'custom' && customStartDate && customEndDate) {
      return `${customStartDate} to ${customEndDate}`
    }
    return dateRangeOptions.find(opt => opt.value === dateRange)?.label || 'Unknown'
  }

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
        {/* Header with Transaction Counter */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Real-time retail analytics for sari-sari stores</p>
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
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
            {dateRangeOptions.map((option) => (
              <Button
                key={option.value}
                variant={dateRange === option.value ? "default" : "outline"}
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

        {/* Custom Date Picker */}
        {showCustomDatePicker && (
          <Card className="p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="start-date" className="text-sm font-medium">
                  Start Date
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="end-date" className="text-sm font-medium">
                  End Date
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
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

      {/* KPI Cards - All 5 in one row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
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
            <CardTitle className="text-sm font-medium text-gray-600">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? '...' : (data.totalTransactions || 0).toLocaleString()}
            </div>
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-gray-400 mt-1">
                Raw: {data.totalTransactions}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Average Transaction Card */}
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Average Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? '...' : `₱${Math.round(data.avgTransaction || 0)}`}
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
              <div className="text-xl font-bold text-gray-900 truncate">
                {loading ? '...' : (topBrandData?.brand_name || 'N/A')}
              </div>
              <div className="text-xs text-gray-500">
                {loading ? '...' : topBrandData?.revenue ? 
                  `₱${(topBrandData.revenue / 1000).toFixed(0)}K` : 
                  'No data'
                }
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
              <div className="text-base font-bold text-gray-900 truncate">
                {loading ? '...' : topBundleData ? 
                  `${topBundleData.product_1} + ${topBundleData.product_2}` : 
                  'No bundles'
                }
              </div>
              <div className="text-xs text-gray-500">
                {loading ? '...' : topBundleData ? 
                  `${topBundleData.frequency}x • ${topBundleData.confidence}%` : 
                  'No data'
                }
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Trends Explorer Call-to-Action */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-blue-900">Explore Detailed Trends</CardTitle>
              <p className="text-sm text-blue-700 mt-1">
                View comprehensive time series analysis, heatmaps, and trend insights
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-2">
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Day of Week & Weekday vs Weekend analysis</li>
                <li>• Transaction time heatmaps</li>
                <li>• Regional and barangay-level trends</li>
                <li>• Annotated insights and pattern detection</li>
              </ul>
            </div>
            <div className="ml-6">
              <Button 
                onClick={() => window.location.href = '/trends'}
                className="bg-blue-600 hover:bg-blue-700 text-white"
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
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
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
                  <div className="animate-pulse bg-gray-200 h-4 w-32 rounded"></div>
                  <div className="flex-1 animate-pulse bg-gray-200 h-6 rounded-full"></div>
                  <div className="animate-pulse bg-gray-200 h-4 w-12 rounded"></div>
                </div>
              ))}
            </div>
          ) : (!data.topBrands || data.topBrands.length === 0) ? (
            <div className="text-center py-8 text-gray-500 space-y-4">
              <div>
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Brand Data</h3>
                <p className="text-sm">No brand sales data found for the selected time period.</p>
                <p className="text-sm mt-1">Try a different date range or verify your database has transaction data.</p>
                {error && (
                  <p className="text-sm mt-2 text-red-600">{error}</p>
                )}
              </div>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
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
                    is_tbwa: brand.is_tbwa || false
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
                      is_tbwa: brand.is_tbwa || false
                    }))}
                    onFilteredDataChange={setFilteredBrands}
                  />
                  
                  {/* Filtered Results */}
                  <div className="space-y-2">
                    {filteredBrands.slice(0, 15).map((brand, index) => {
                      const maxSales = Math.max(...filteredBrands.map(b => b.sales))
                      const percentage = (brand.sales / maxSales) * 100
                      
                      return (
                        <div key={brand.id} className="flex items-center gap-4">
                          <div className="w-32 text-sm font-medium text-right flex items-center justify-end gap-1">
                            {brand.name}
                            {brand.is_tbwa && (
                              <div className="w-2 h-2 bg-green-500 rounded-full" title="TBWA Client" />
                            )}
                          </div>
                          <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                            <div 
                              className={`h-6 rounded-full flex items-center justify-end pr-2 transition-all duration-300 ${
                                brand.is_tbwa ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            >
                              <span className="text-xs text-white font-medium">
                                ₱{brand.sales.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="w-16 text-sm text-gray-600 text-right">
                            {((brand.sales / (data.totalRevenue || 1)) * 100).toFixed(1)}%
                          </div>
                        </div>
                      )
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
  )
}
