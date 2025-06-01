import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from 'recharts'
import { TrendingUp, Filter, Users } from 'lucide-react'
import { behavioralDashboardService } from '@/services/behavioral-dashboard'
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface SuggestionFunnelProps {
  startDate?: string
  endDate?: string
  storeId?: number
  className?: string
}

export function SuggestionFunnel({ startDate, endDate, storeId, className }: SuggestionFunnelProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchFunnelData()
  }, [startDate, endDate, storeId])

  const fetchFunnelData = async () => {
    setLoading(true)
    setError(null)
    try {
      const funnelData = await behavioralDashboardService.getSuggestionFunnel(startDate, endDate, storeId)
      
      // Format data for funnel chart with colors
      const formattedData = funnelData.map((stage, index) => ({
        ...stage,
        fill: index === 0 ? '#3B82F6' : // Total - Blue
              index === 1 ? '#F59E0B' : // Offered - Amber
              index === 2 ? '#10B981' : // Accepted - Green
              '#EF4444' // Rejected - Red
      }))
      
      setData(formattedData)
    } catch (err) {
      console.error('Error fetching funnel data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load funnel data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Suggestion Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`border-red-200 ${className}`}>
        <CardHeader>
          <CardTitle className="text-red-700">Funnel Data Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
          <Button variant="outline" onClick={fetchFunnelData} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Calculate conversion rates
  const totalTransactions = data.find(d => d.stage === 'Total Transactions')?.count || 0
  const suggestionsOffered = data.find(d => d.stage === 'Suggestions Offered')?.count || 0
  const suggestionsAccepted = data.find(d => d.stage === 'Suggestions Accepted')?.count || 0
  
  const offerRate = totalTransactions > 0 ? (suggestionsOffered / totalTransactions * 100).toFixed(1) : '0.0'
  const acceptanceRate = suggestionsOffered > 0 ? (suggestionsAccepted / suggestionsOffered * 100).toFixed(1) : '0.0'

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Suggestion Funnel Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Funnel Visualization */}
        <div className="h-64 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="stage" 
                tick={{ fontSize: 12 }}
                angle={-20}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value.toLocaleString()} (${data.find(d => d.stage === name)?.percentage || 0}%)`,
                  'Count'
                ]}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Conversion Metrics */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Suggestion Offer Rate</span>
              <span className="text-sm font-bold text-amber-600">{offerRate}%</span>
            </div>
            <Progress value={parseFloat(offerRate)} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">
              {suggestionsOffered.toLocaleString()} suggestions offered out of {totalTransactions.toLocaleString()} transactions
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Suggestion Acceptance Rate</span>
              <span className="text-sm font-bold text-green-600">{acceptanceRate}%</span>
            </div>
            <Progress value={parseFloat(acceptanceRate)} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">
              {suggestionsAccepted.toLocaleString()} suggestions accepted out of {suggestionsOffered.toLocaleString()} offered
            </p>
          </div>
        </div>

        {/* Insights */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Optimization Opportunities</p>
              <ul className="text-xs text-blue-700 mt-1 space-y-1">
                {parseFloat(offerRate) < 20 && (
                  <li>• Low offer rate - train staff to suggest alternatives more frequently</li>
                )}
                {parseFloat(acceptanceRate) < 50 && suggestionsOffered > 0 && (
                  <li>• Below average acceptance - review suggestion quality and relevance</li>
                )}
                {parseFloat(acceptanceRate) > 70 && (
                  <li>• High acceptance rate - excellent suggestion performance!</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}