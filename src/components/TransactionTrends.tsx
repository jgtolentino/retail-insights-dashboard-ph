import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import { Clock, MapPin, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { transactionTrendsService, type TransactionTrend, type RegionalData } from '@/services/transactionTrends'
import { useFilters } from '@/contexts/FilterContext'

const formatPeso = (value: number) => `₱${value.toLocaleString('en-PH')}`

export const TransactionTrends = () => {
  const { filters } = useFilters()
  const [hourlyTrends, setHourlyTrends] = useState<TransactionTrend[]>([])
  const [regionalData, setRegionalData] = useState<RegionalData[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'hourly' | 'regional'>('hourly')

  useEffect(() => {
    fetchTrendsData()
  }, [filters.timeRange, filters.region, filters.refreshTrigger])

  const fetchTrendsData = async () => {
    setLoading(true)
    try {
      const [hourlyData, regionsData] = await Promise.all([
        transactionTrendsService.getHourlyTrends(
          filters.timeRange, 
          filters.region !== 'All Regions' ? filters.region : undefined
        ),
        transactionTrendsService.getRegionalData(filters.timeRange)
      ])
      
      setHourlyTrends(hourlyData)
      setRegionalData(regionsData)
    } catch (error) {
      console.error('Failed to fetch trends data:', error)
    } finally {
      setLoading(false)
    }
  }

  const peakHour = hourlyTrends.length > 0 
    ? hourlyTrends.reduce((max, curr) => curr.count > max.count ? curr : max)
    : null

  const totalHourlyTransactions = hourlyTrends.reduce((sum, trend) => sum + trend.count, 0)

  return (
    <div className="space-y-6">
      {/* Transaction Trends Header */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-xl font-semibold text-gray-900">
                Transaction Trends
              </CardTitle>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'hourly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('hourly')}
              >
                <Clock className="h-4 w-4 mr-1" />
                Hourly
              </Button>
              <Button
                variant={viewMode === 'regional' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('regional')}
              >
                <MapPin className="h-4 w-4 mr-1" />
                Regional
              </Button>
            </div>
          </div>
          
          {/* Quick Insights */}
          {!loading && (
            <div className="flex gap-6 text-sm text-gray-600 mt-2">
              {viewMode === 'hourly' && peakHour && (
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>Peak: {peakHour.hour} ({peakHour.count} transactions)</span>
                </div>
              )}
              {viewMode === 'hourly' && (
                <span>Total: {totalHourlyTransactions.toLocaleString()} transactions</span>
              )}
              {viewMode === 'regional' && regionalData.length > 0 && (
                <span>Top region: {regionalData[0]?.region} ({formatPeso(regionalData[0]?.revenue)})</span>
              )}
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="h-[350px] flex items-center justify-center text-gray-500">
              <Clock className="h-6 w-6 animate-pulse mr-2" />
              Loading trends data...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              {viewMode === 'hourly' ? (
                <LineChart data={hourlyTrends} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="hour"
                    tick={{ fontSize: 12 }}
                    stroke="#666"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#666"
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                            <p className="font-semibold text-gray-900">{label}</p>
                            <div className="mt-2 space-y-1">
                              <p className="text-sm">
                                <span className="text-gray-600">Transactions:</span>
                                <span className="font-medium ml-2">{data.count.toLocaleString()}</span>
                              </p>
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
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#2563eb" 
                    strokeWidth={2}
                    dot={{ fill: '#2563eb', strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 5, stroke: '#2563eb', strokeWidth: 2 }}
                  />
                </LineChart>
              ) : (
                <BarChart data={regionalData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="region"
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
                            <p className="font-semibold text-gray-900">{label}</p>
                            <div className="mt-2 space-y-1">
                              <p className="text-sm">
                                <span className="text-gray-600">Revenue:</span>
                                <span className="font-medium ml-2">{formatPeso(data.revenue)}</span>
                              </p>
                              <p className="text-sm">
                                <span className="text-gray-600">Transactions:</span>
                                <span className="font-medium ml-2">{data.transactions.toLocaleString()}</span>
                              </p>
                              <p className="text-sm">
                                <span className="text-gray-600">Avg Transaction:</span>
                                <span className="font-medium ml-2">{formatPeso(data.avgTransaction)}</span>
                              </p>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                    {regionalData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#2563eb" />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}