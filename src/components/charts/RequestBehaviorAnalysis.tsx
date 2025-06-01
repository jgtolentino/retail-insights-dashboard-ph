/**
 * RequestBehaviorAnalysis Component
 * Analyzes customer request patterns, checkout times, and interaction behaviors
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageCircle, Clock, TrendingUp, Users, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { enhancedAnalyticsService, RequestBehaviorStats, CheckoutDurationAnalysis, TranscriptionInsight, DateRange } from '@/services/enhanced-analytics';

interface RequestBehaviorAnalysisProps {
  dateRange?: DateRange;
  className?: string;
}

const COLORS = {
  branded: '#3b82f6',     // Blue
  unbranded: '#f59e0b',   // Amber
  pointing: '#10b981',    // Green
  primary: '#6366f1',     // Indigo
  secondary: '#8b5cf6',   // Purple
  accent: '#f97316'       // Orange
};

export function RequestBehaviorAnalysis({ dateRange, className }: RequestBehaviorAnalysisProps) {
  const [requestStats, setRequestStats] = useState<RequestBehaviorStats[]>([]);
  const [checkoutAnalysis, setCheckoutAnalysis] = useState<CheckoutDurationAnalysis[]>([]);
  const [transcriptionInsights, setTranscriptionInsights] = useState<TranscriptionInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRequestBehaviorData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [requestData, checkoutData, transcriptionData] = await Promise.all([
          enhancedAnalyticsService.getRequestBehaviorStats(dateRange),
          enhancedAnalyticsService.getCheckoutDurationAnalysis(dateRange),
          enhancedAnalyticsService.getTranscriptionInsights(dateRange)
        ]);

        setRequestStats(requestData);
        setCheckoutAnalysis(checkoutData);
        setTranscriptionInsights(transcriptionData);

      } catch (err) {
        console.error('Error loading request behavior data:', err);
        setError('Failed to load request behavior analysis');
      } finally {
        setLoading(false);
      }
    };

    loadRequestBehaviorData();
  }, [dateRange]);

  // Prepare chart data
  const requestTypeData = requestStats.map(stat => ({
    type: stat.request_type,
    count: stat.total_count,
    avgCheckoutTime: stat.avg_checkout_seconds,
    acceptanceRate: (stat.suggestion_acceptance_rate * 100).toFixed(1),
    clarifications: stat.avg_clarifications,
    gestureRate: (stat.gesture_usage_rate * 100).toFixed(1)
  }));

  const checkoutDurationData = checkoutAnalysis.map(analysis => ({
    duration: analysis.duration_range,
    count: analysis.transaction_count,
    percentage: analysis.percentage,
    avgAmount: analysis.avg_amount,
    paymentMethod: analysis.top_payment_method
  }));

  const sentimentData = transcriptionInsights.map(insight => ({
    phrase: insight.common_phrase,
    frequency: insight.frequency,
    sentiment: insight.sentiment_score,
    avgCheckoutTime: insight.avg_checkout_time,
    requestType: insight.request_type
  }));

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Request Behavior Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading behavior analysis...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Request Behavior Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Request Types Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Request Types Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={requestTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'count') return [value, 'Transactions'];
                    if (name === 'avgCheckoutTime') return [`${value}s`, 'Avg Checkout Time'];
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar dataKey="count" fill={COLORS.primary} name="Transactions" />
                <Bar dataKey="avgCheckoutTime" fill={COLORS.secondary} name="Avg Checkout Time (s)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Checkout Duration Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={checkoutDurationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ duration, percentage }) => `${duration} (${percentage.toFixed(1)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {checkoutDurationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} transactions`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        {requestStats.map((stat, index) => (
          <Card key={stat.request_type}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                {stat.request_type.charAt(0).toUpperCase() + stat.request_type.slice(1)} Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{stat.total_count.toLocaleString()}</span>
                <Badge variant="outline" className="text-xs">
                  {((stat.total_count / requestStats.reduce((sum, s) => sum + s.total_count, 0)) * 100).toFixed(1)}%
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Checkout Time</span>
                  <span className="font-medium">{stat.avg_checkout_seconds.toFixed(0)}s</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Acceptance Rate</span>
                  <span className="font-medium">{(stat.suggestion_acceptance_rate * 100).toFixed(1)}%</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Clarifications</span>
                  <span className="font-medium">{stat.avg_clarifications.toFixed(1)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Gesture Usage</span>
                  <span className="font-medium">{(stat.gesture_usage_rate * 100).toFixed(1)}%</span>
                </div>
              </div>
              
              {/* Progress bars for visual representation */}
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(stat.suggestion_acceptance_rate * 100)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 text-center">
                  Suggestion Acceptance Rate
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Transcription Insights */}
      {transcriptionInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Customer Communication Patterns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sentimentData.slice(0, 6).map((insight, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{insight.phrase}</span>
                      <Badge 
                        variant={insight.sentiment >= 0.7 ? 'default' : insight.sentiment >= 0.5 ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {insight.sentiment >= 0.7 ? 'Positive' : insight.sentiment >= 0.5 ? 'Neutral' : 'Negative'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span>{insight.frequency} occurrences</span>
                      <span>{insight.avgCheckoutTime.toFixed(0)}s avg time</span>
                      <span className="capitalize">{insight.requestType} requests</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {(insight.sentiment * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-500">sentiment</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Key Behavioral Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Performance Highlights</h4>
              {requestStats.length > 0 && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Most Common Request Type</span>
                    <span className="font-medium capitalize">
                      {requestStats.sort((a, b) => b.total_count - a.total_count)[0]?.request_type}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fastest Checkout Type</span>
                    <span className="font-medium capitalize">
                      {requestStats.sort((a, b) => a.avg_checkout_seconds - b.avg_checkout_seconds)[0]?.request_type}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Highest Acceptance Rate</span>
                    <span className="font-medium">
                      {(Math.max(...requestStats.map(s => s.suggestion_acceptance_rate)) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Optimization Opportunities</h4>
              <div className="space-y-2 text-sm">
                {checkoutAnalysis.find(c => c.duration_range === '5min+') && (
                  <div className="text-amber-600">
                    • {checkoutAnalysis.find(c => c.duration_range === '5min+')?.percentage.toFixed(1)}% of checkouts take over 5 minutes
                  </div>
                )}
                {requestStats.find(r => r.gesture_usage_rate > 0.2) && (
                  <div className="text-blue-600">
                    • High gesture usage suggests need for better product visibility
                  </div>
                )}
                {requestStats.find(r => r.avg_clarifications > 1) && (
                  <div className="text-purple-600">
                    • Multiple clarifications indicate communication challenges
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default RequestBehaviorAnalysis;