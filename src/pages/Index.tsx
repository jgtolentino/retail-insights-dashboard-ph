import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { dashboardService } from '@/services/dashboard'

export default function Index() {
  const [data, setData] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    avgTransaction: 0,
    topBrands: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const dashboardData = await dashboardService.getDashboardData('30d')
      console.log('📊 Dashboard data received:', dashboardData)
      console.log('📊 Top brands data:', dashboardData.topBrands)
      setData(dashboardData)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Retail Insights Dashboard PH</h1>
          <p className="text-gray-600 mt-2">Real-time retail analytics for sari-sari stores</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : `₱${data.totalRevenue.toLocaleString()}`}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : data.totalTransactions}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Average Transaction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : `₱${Math.round(data.avgTransaction)}`}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top Brands by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : data.topBrands.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No data available. Please add data to your Supabase database.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Debug info */}
                <div className="text-sm text-gray-500">
                  Showing {data.topBrands.length} brands
                </div>
                
                {/* Recharts Bar Chart */}
                <div style={{ width: '100%', height: 600 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={data.topBrands.slice(0, 15)} 
                      layout="horizontal"
                      margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        type="number"
                        tickFormatter={(value) => `₱${Number(value).toLocaleString()}`}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={140}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value) => [`₱${Number(value).toLocaleString()}`, 'Revenue']}
                      />
                      <Bar 
                        dataKey="sales" 
                        fill="#3b82f6"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* CSS-based Bar Chart as Backup */}
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Brand Performance Visualization</h3>
                  <div className="space-y-2">
                    {data.topBrands.slice(0, 15).map((brand, index) => {
                      const maxSales = Math.max(...data.topBrands.map(b => b.sales))
                      const percentage = (brand.sales / maxSales) * 100
                      
                      return (
                        <div key={index} className="flex items-center gap-4">
                          <div className="w-32 text-sm font-medium text-right">{brand.name}</div>
                          <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                            <div 
                              className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${percentage}%` }}
                            >
                              <span className="text-xs text-white font-medium">
                                ₱{brand.sales.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="w-16 text-sm text-gray-600 text-right">
                            {((brand.sales / data.totalRevenue) * 100).toFixed(1)}%
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Brand Sales Summary Table */}
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-3">Brand Sales Summary</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-3 font-medium text-gray-700">Rank</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-700">Brand</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-700">Revenue</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-700">% of Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.topBrands.slice(0, 15).map((brand, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-2 px-3 text-gray-600">{index + 1}</td>
                            <td className="py-2 px-3 font-medium">{brand.name}</td>
                            <td className="py-2 px-3 text-right font-mono">
                              ₱{Number(brand.sales).toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-right text-gray-600">
                              {((Number(brand.sales) / data.totalRevenue) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
