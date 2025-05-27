
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, RefreshCw, BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { dashboardService, type DashboardData } from '@/services/dashboard'
import { Button } from '@/components/ui/button'
import { normalizeBrandName, getBrandOwnerType } from '@/utils/brandNormalization'

const formatPeso = (value: number) => `₱${value.toLocaleString('en-PH')}`

// Accessibility-friendly color palette
const COLORS = {
  tbwa: '#2563eb', // Blue with good contrast
  competitor: '#ea580c', // Orange with good contrast
  tbwaPattern: 'url(#tbwaPattern)', // For additional clarity
  competitorPattern: 'url(#competitorPattern)'
}

const Index = () => {
  const [data, setData] = useState<DashboardData>({
    totalRevenue: 0,
    totalTransactions: 0,
    avgTransaction: 0,
    topBrands: []
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState(7) // days
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [timeRange])

  const fetchData = async () => {
    setLoading(true)
    try {
      const dashboardData = await dashboardService.getDashboardData(timeRange)
      setData(dashboardData)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate TBWA vs Competitor metrics
  const calculateMetrics = () => {
    if (!data.topBrands.length) return { tbwaRevenue: 0, competitorRevenue: 0, tbwaPercentage: 0 }
    
    const tbwaRevenue = data.topBrands
      .filter(brand => brand.is_tbwa)
      .reduce((sum, brand) => sum + brand.sales, 0)
    
    const competitorRevenue = data.topBrands
      .filter(brand => !brand.is_tbwa)
      .reduce((sum, brand) => sum + brand.sales, 0)
    
    const totalRevenue = tbwaRevenue + competitorRevenue
    const tbwaPercentage = totalRevenue > 0 ? (tbwaRevenue / totalRevenue * 100).toFixed(1) : 0
    
    return { tbwaRevenue, competitorRevenue, tbwaPercentage }
  }

  const { tbwaRevenue, competitorRevenue, tbwaPercentage } = calculateMetrics()
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Retail Analytics Dashboard</h1>
          <div className="flex gap-2">
            <Button
              variant={timeRange === 7 ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(7)}
            >
              7 Days
            </Button>
            <Button
              variant={timeRange === 30 ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(30)}
            >
              30 Days
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        
        {/* KPI Cards with Real Data */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

        {/* Bar Chart with Real Data */}
        <Card className="border-0 shadow-md">
          <CardHeader className="space-y-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Top Brands by Revenue
              </CardTitle>
            </div>
            
            {/* Legend moved above chart */}
            <div className="flex items-center justify-between">
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.tbwa }}></div>
                  <span className="text-sm font-medium">TBWA Clients</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.competitor }}></div>
                  <span className="text-sm font-medium">Competitors</span>
                </div>
              </div>
            </div>
            
            {/* Contextual summary */}
            {!loading && data.topBrands.length > 0 && (
              <p className="text-sm text-gray-600">
                TBWA clients capture <span className="font-semibold">{tbwaPercentage}%</span> of category revenue
                ({formatPeso(tbwaRevenue)} vs {formatPeso(competitorRevenue)}). 
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
                <BarChart data={data.topBrands} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
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
                        const ownerType = getBrandOwnerType(data.name)
                        return (
                          <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                            <p className="font-semibold text-gray-900">{label}</p>
                            <p className="text-sm text-gray-600">{ownerType}</p>
                            <div className="mt-2 space-y-1">
                              <p className="text-sm">
                                <span className="text-gray-600">Revenue:</span>
                                <span className="font-medium ml-2">{formatPeso(data.sales)}</span>
                              </p>
                              {data.transaction_count && (
                                <p className="text-sm">
                                  <span className="text-gray-600">Transactions:</span>
                                  <span className="font-medium ml-2">{data.transaction_count.toLocaleString()}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar 
                    dataKey="sales" 
                    radius={[4, 4, 0, 0]}
                    cursor="pointer"
                    onClick={(data: any) => {
                      setSelectedBrand(data.name)
                      // TODO: Implement drill-down functionality
                      console.log('Clicked brand:', data.name)
                    }}
                  >
                    {data.topBrands.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.is_tbwa ? COLORS.tbwa : COLORS.competitor}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Index
