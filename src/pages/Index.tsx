import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RefreshCw, TrendingUp, Calendar, BarChart3, CalendarDays, Package, Users } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { dashboardService, type TimeSeriesData } from '@/services/dashboard'
import { CategoryFilter } from "@/components/CategoryFilter"
import { Link } from 'react-router-dom'
import { ProductCategories } from '@/components/ProductCategories'
import { FEATURE_FLAGS } from '@/config/features'
// AI Panel disabled for production
// import { AIPanel } from '@/components/AIPanel'
// import { type DashboardData } from '@/services/aiService'

type DateRange = '1d' | '7d' | '30d' | '90d' | 'custom'
type ChartMetric = 'transactions' | 'revenue' | 'both'

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
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const [chartMetric, setChartMetric] = useState<ChartMetric>('both')
  
  // Custom date range state
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false)

  // Category filter state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [categories] = useState([
    { id: '1', name: 'Cigarettes', count: 89 },
    { id: '2', name: 'Beverages', count: 42 },
    { id: '3', name: 'Snacks', count: 28 },
    { id: '4', name: 'Personal Care', count: 16 }
  ])

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
    { value: '1d' as DateRange, label: 'Today' },
    { value: '7d' as DateRange, label: '7 Days' },
    { value: '30d' as DateRange, label: '30 Days' },
    { value: '90d' as DateRange, label: '90 Days' },
    { value: 'custom' as DateRange, label: 'Custom Range' }
  ]

  const chartMetricOptions = [
    { value: 'transactions' as ChartMetric, label: 'Transactions', icon: BarChart3 },
    { value: 'revenue' as ChartMetric, label: 'Revenue', icon: TrendingUp },
    { value: 'both' as ChartMetric, label: 'Both', icon: Calendar }
  ]

  const formatXAxisLabel = (tickItem: string) => {
    if (dateRange === '1d') {
      // For hourly data, show just the hour
      return tickItem.split(' ')[1] || tickItem
    } else if (dateRange === '90d') {
      // For weekly data, show week of
      return `Week of ${tickItem.split('-')[2]}/${tickItem.split('-')[1]}`
    } else {
      // For daily data, show day/month
      const parts = tickItem.split('-')
      return `${parts[2]}/${parts[1]}`
    }
  }

  const getDateRangeLabel = () => {
    if (dateRange === 'custom' && customStartDate && customEndDate) {
      return `${customStartDate} to ${customEndDate}`
    }
    return dateRangeOptions.find(opt => opt.value === dateRange)?.label || 'Unknown'
  }

  const renderChart = () => {
    // Safety check for timeSeriesData
    if (!timeSeriesData || !Array.isArray(timeSeriesData) || timeSeriesData.length === 0) {
      return (
        <div className="h-80 flex flex-col items-center justify-center text-gray-500 space-y-4">
          <div className="text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
            <p className="text-sm">No transaction data found for the selected time period.</p>
            <p className="text-sm mt-1">Try selecting a different date range or check your database connection.</p>
            {error && (
              <p className="text-sm mt-2 text-red-600">{error}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleDateRangeChange('30d')}>
              Reset to 30 Days
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxisLabel}
              tick={{ fontSize: 12 }}
            />
            {(chartMetric === 'transactions' || chartMetric === 'both') && (
              <YAxis 
                yAxisId="transactions"
                orientation="left"
                tick={{ fontSize: 12 }}
              />
            )}
            {(chartMetric === 'revenue' || chartMetric === 'both') && (
              <YAxis 
                yAxisId="revenue"
                orientation={chartMetric === 'both' ? 'right' : 'left'}
                tickFormatter={(value) => `₱${value.toLocaleString()}`}
                tick={{ fontSize: 12 }}
              />
            )}
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'revenue') {
                  return [`₱${Number(value).toLocaleString()}`, 'Revenue']
                }
                return [value, 'Transactions']
              }}
              labelFormatter={(label) => `Date: ${label}`}
            />
            {(chartMetric === 'transactions' || chartMetric === 'both') && (
              <Line 
                yAxisId="transactions"
                type="monotone" 
                dataKey="transactions" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                name="transactions"
              />
            )}
            {(chartMetric === 'revenue' || chartMetric === 'both') && (
              <Line 
                yAxisId="revenue"
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                name="revenue"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-2">Real-time retail analytics for sari-sari stores</p>
        </div>
      </div>

      {/* Product Categories */}
      <ProductCategories />

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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
              ) : (
                `₱${(data.totalRevenue || 0).toLocaleString()}`
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">{getDateRangeLabel()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
              ) : (
                data.totalTransactions || 0
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">{getDateRangeLabel()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Average Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
              ) : (
                `₱${Math.round(data.avgTransaction || 0)}`
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">{getDateRangeLabel()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Time Series Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transaction Trends</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {dateRange === 'custom' ? 
                  `Custom range: ${getDateRangeLabel()}` : 
                  `Showing data for: ${getDateRangeLabel()}`
                }
              </p>
            </div>
            <div className="flex gap-1">
              {chartMetricOptions.map((option) => {
                const Icon = option.icon
                return (
                  <Button
                    key={option.value}
                    variant={chartMetric === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChartMetric(option.value)}
                    disabled={loading}
                    className="flex items-center gap-1"
                  >
                    <Icon className="h-3 w-3" />
                    {option.label}
                  </Button>
                )
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-pulse bg-gray-200 h-64 w-full rounded"></div>
            </div>
          ) : (
            renderChart()
          )}
        </CardContent>
      </Card>

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Top Brands by Revenue</CardTitle>
          <p className="text-sm text-gray-500">
            Based on {getDateRangeLabel()}
          </p>
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
                <Button variant="outline" size="sm" onClick={() => handleDateRangeChange('30d')}>
                  Reset to 30 Days
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-500">
                Showing top {data.topBrands.length} brands
              </div>
              
              {/* CSS-based horizontal bar chart */}
              <div className="space-y-2">
                {data.topBrands.slice(0, 15).map((brand, index) => {
                  const maxSales = Math.max(...data.topBrands.map(b => b.sales))
                  const percentage = (brand.sales / maxSales) * 100
                  
                  return (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-32 text-sm font-medium text-right">{brand.name}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                        <div 
                          className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2 transition-all duration-300"
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
        </CardContent>
      </Card>
    </div>
  )
}
