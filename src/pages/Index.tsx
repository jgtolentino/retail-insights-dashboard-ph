
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Database } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useRetailAnalytics } from '@/hooks/useRetailAnalytics'

const formatPeso = (value: number) => `₱${value.toLocaleString('en-PH')}`

const Index = () => {
  const { topBrands, totalStats, isLoading } = useRetailAnalytics();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <Database className="h-12 w-12 animate-pulse mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600">Loading retail analytics data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Database className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Retail Analytics POC</h1>
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Live Data</span>
        </div>
        
        {/* KPI Cards with Real Data */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {formatPeso(totalStats.totalRevenue)}
              </div>
              <p className="text-sm text-green-600 flex items-center mt-2">
                <TrendingUp className="h-4 w-4 mr-1" />
                From Supabase Database
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {totalStats.totalTransactions.toLocaleString()}
              </div>
              <p className="text-sm text-gray-500 mt-2">Real transaction data</p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Avg Transaction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {formatPeso(totalStats.avgTransaction)}
              </div>
              <p className="text-sm text-gray-500 mt-2">Per customer</p>
            </CardContent>
          </Card>
        </div>

        {/* Bar Chart with Real Data */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              Top Brands by Revenue
              <span className="text-sm font-normal text-gray-500">(Live Database)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={topBrands} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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
                  formatter={(value: number, name: string, props: any) => [
                    formatPeso(value), 
                    'Revenue',
                    props.payload.is_tbwa_client ? '(TBWA Client)' : '(Competitor)'
                  ]}
                  labelStyle={{ color: '#333' }}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #ccc',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
                  {topBrands.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.is_tbwa_client ? '#3b82f6' : '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>TBWA Clients</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-slate-400 rounded"></div>
                <span>Competitors</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Index
