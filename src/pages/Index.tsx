
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { dashboardService, type DashboardData } from '@/services/dashboard'
import { FilterProvider, useFilters } from '@/contexts/FilterContext'
import { FilterBar } from '@/components/FilterBar'
import { TransactionTrends } from '@/components/TransactionTrends'

const formatPeso = (value: number) => `₱${value.toLocaleString('en-PH')}`

// Accessibility-friendly color palette
const COLORS = {
  tbwa: '#2563eb', // Blue with good contrast
  competitor: '#ea580c', // Orange with good contrast
}

const DashboardContent = () => {
  const { filters } = useFilters()
  const [data, setData] = useState<DashboardData>({
    totalRevenue: 0,
    totalTransactions: 0,
    avgTransaction: 0,
    topBrands: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [filters.timeRange, filters.region, filters.refreshTrigger])

  const fetchData = async () => {
    setLoading(true)
    try {
      const dashboardData = await dashboardService.getDashboardData(filters.timeRange)
      setData(dashboardData)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate TBWA client metrics (for context only)
  const tbwaClientCount = data.topBrands.filter(brand => brand.tbwaClient).length
  const totalBrands = data.topBrands.length
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <FilterBar />
        
        {/* KPI Cards with Real Data */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{/* Filter indicator */}
        {filters.region !== 'All Regions' && (
          <div className="col-span-full mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                📍 Filtered by: <span className="font-semibold">{filters.region}</span> • 
                Last {filters.timeRange} days
              </p>
            </div>
          </div>
        )}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {loading ? '...' : formatPeso(data.totalRevenue)}
              </div>
              <p className="text-sm text-green-600 flex items-center mt-2">
                <TrendingUp className="h-4 w-4 mr-1" />
                {loading ? '...' : 'Live data'}
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {loading ? '...' : data.totalTransactions.toLocaleString()}
              </div>
              <p className="text-sm text-gray-500 mt-2">Last {timeRange} days</p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Avg Transaction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {loading ? '...' : formatPeso(data.avgTransaction)}
              </div>
              <p className="text-sm text-gray-500 mt-2">Per transaction</p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction Trends Section */}
        <TransactionTrends />

        {/* Single-Series Brand Revenue Chart */}
        <Card className="border-0 shadow-md">
          <CardHeader className="space-y-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Top Brands by Revenue
              </CardTitle>
            </div>
            
            {/* Simple contextual info */}
            {!loading && data.topBrands.length > 0 && (
              <p className="text-sm text-gray-600">
                Showing top {totalBrands} brands • {tbwaClientCount} TBWA clients marked with ★ • 
                Click any bar to drill down by region or store.
              </p>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[350px] flex items-center justify-center text-gray-500">
                Loading chart data...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={data.topBrands} margin={{ top: 30, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="brandName" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    tick={{ fontSize: 12 }}
                    stroke="#666"
                  />
                  <YAxis 
                    tickFormatter={(value) => `₱${(value/1000).toFixed(0)}k`}
                    tick={{ fontSize: 12 }}
                    stroke="#666"
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                            <p className="font-semibold text-gray-900 flex items-center gap-2">
                              {label}
                              {data.tbwaClient && <span className="text-blue-600">★</span>}
                            </p>
                            <p className="text-sm text-gray-600">
                              {data.tbwaClient ? 'TBWA Client' : 'Competitor'}
                            </p>
                            <div className="mt-2">
                              <p className="text-sm">
                                <span className="text-gray-600">Revenue:</span>
                                <span className="font-medium ml-2">{formatPeso(data.revenue)}</span>
                              </p>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar 
                    dataKey="revenue" 
                    radius={[4, 4, 0, 0]}
                    cursor="pointer"
                    fill="#2563eb"
                  />
                  {/* TBWA Client indicators */}
                  {data.topBrands.map((brand, index) => (
                    brand.tbwaClient && (
                      <text
                        key={`star-${index}`}
                        x={`${(index + 0.5) * (100 / data.topBrands.length)}%`}
                        y="15"
                        textAnchor="middle"
                        fill="#2563eb"
                        fontSize="16"
                        fontWeight="bold"
                      >
                        ★
                      </text>
                    )
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

const Index = () => {
  return (
    <FilterProvider>
      <DashboardContent />
    </FilterProvider>
  )
}

export default Index
