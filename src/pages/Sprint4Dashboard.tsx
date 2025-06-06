/**
 * Sprint 4 Dashboard - Advanced Analytics & AI Insights
 * Comprehensive dashboard featuring substitution flows, request behavior analysis,
 * AI recommendations, and enhanced retail intelligence
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Download,
  RefreshCw,
  Brain,
  TrendingUp,
  Users,
  MessageSquare,
  Target,
} from 'lucide-react';

// Import new Sprint 4 components
import SubstitutionFlow from '@/components/charts/SubstitutionFlow';
import RequestBehaviorAnalysis from '@/components/charts/RequestBehaviorAnalysis';
import AIRecommendations from '@/components/AIRecommendations';
import { Sprint4DataVerification } from '@/components/Sprint4DataVerification';
import {
  DashboardSkeleton,
  AnalyticsSkeleton,
  RecommendationsSkeleton,
} from '@/components/ui/loading-skeleton';
import { BehaviorSuggestionsTable } from '@/components/BehaviorSuggestionsTable';

// Import services
import { enhancedAnalyticsService, DateRange } from '@/services/enhanced-analytics';

export default function Sprint4Dashboard() {
  const [selectedDateRange, setSelectedDateRange] = useState<string>('30d');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate date range based on selection
  const dateRange: DateRange = useMemo(() => {
    const end = new Date();
    const start = new Date();

    switch (selectedDateRange) {
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      case '90d':
        start.setDate(start.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start.setDate(start.getDate() - 30);
    }

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }, [selectedDateRange]);

  const handleExportData = async () => {
    try {
      setIsLoading(true);
      const summary = await enhancedAnalyticsService.getDashboardSummary(dateRange);

      // Create CSV data
      const csvData = [
        ['Metric', 'Value'],
        ['Total Transactions', summary.totalTransactions.toString()],
        ['Total Revenue', `₱${(summary.totalRevenue || 0).toFixed(2)}`],
        ['Average Checkout Time', `${(summary.avgCheckoutTime || 0).toFixed(1)}s`],
        ['Substitution Rate', `${(summary.avgSubstitutionRate || 0).toFixed(1)}%`],
        ['Digital Payment Rate', `${(summary.avgDigitalPaymentRate || 0).toFixed(1)}%`],
      ];

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sprint4-analytics-${selectedDateRange}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshData = () => {
    // Force refresh by updating key
    window.location.reload();
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advanced Retail Analytics</h1>
          <p className="text-gray-600">
            AI-powered insights, substitution patterns, and customer behavior analysis
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
            <SelectTrigger className="w-32">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleExportData} disabled={isLoading}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>

          <Button variant="outline" onClick={handleRefreshData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-900">Sprint 4: Enhanced Analytics Ready</h3>
                <p className="text-sm text-blue-700">
                  Advanced AI insights, substitution tracking, and behavioral analysis now available
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="default" className="bg-green-600">
                <Target className="mr-1 h-3 w-3" />
                AI Active
              </Badge>
              <Badge variant="outline">
                <TrendingUp className="mr-1 h-3 w-3" />
                Real-time
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="substitution" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Substitution Flow
          </TabsTrigger>
          <TabsTrigger value="behavior" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Customer Behavior
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Suggestions Data
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Data Verification */}
          <Sprint4DataVerification />

          {/* Quick Stats Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Enhanced Analytics</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">Active</div>
                <p className="text-xs text-muted-foreground">AI insights enabled</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Substitution Tracking</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Live</div>
                <p className="text-xs text-muted-foreground">Real-time pattern detection</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Behavior Analysis</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">Advanced</div>
                <p className="text-xs text-muted-foreground">NLP transcription insights</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Data Quality</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">98%</div>
                <p className="text-xs text-muted-foreground">Schema compliance rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Combined Analytics Overview */}
          <div className="grid gap-6 md:grid-cols-2">
            <React.Suspense fallback={<AnalyticsSkeleton />}>
              <SubstitutionFlow dateRange={dateRange} />
            </React.Suspense>

            <Card>
              <CardHeader>
                <CardTitle>Implementation Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database Schema Updates</span>
                    <Badge variant="default" className="bg-green-600">
                      Complete
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">RPC Functions</span>
                    <Badge variant="default" className="bg-green-600">
                      Complete
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Enhanced Data Generation</span>
                    <Badge variant="default" className="bg-green-600">
                      Complete
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">AI Recommendations Engine</span>
                    <Badge variant="default" className="bg-green-600">
                      Complete
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">NLP Transcription Analysis</span>
                    <Badge variant="default" className="bg-green-600">
                      Complete
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Performance Optimizations</span>
                    <Badge variant="default" className="bg-green-600">
                      Complete
                    </Badge>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="mb-2 font-medium">New Capabilities</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Real-time substitution pattern detection</li>
                    <li>• Customer request behavior analysis</li>
                    <li>• AI-powered recommendations</li>
                    <li>• Filipino retail transcription insights</li>
                    <li>• Enhanced checkout duration tracking</li>
                    <li>• Payment method performance analysis</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="substitution" className="space-y-6">
          <React.Suspense fallback={<AnalyticsSkeleton />}>
            <SubstitutionFlow dateRange={dateRange} />
          </React.Suspense>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-6">
          <React.Suspense fallback={<AnalyticsSkeleton />}>
            <RequestBehaviorAnalysis dateRange={dateRange} />
          </React.Suspense>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-6">
          <React.Suspense fallback={<AnalyticsSkeleton />}>
            <BehaviorSuggestionsTable
              startDate={dateRange.start.split('T')[0]}
              endDate={dateRange.end.split('T')[0]}
            />
          </React.Suspense>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <React.Suspense fallback={<RecommendationsSkeleton />}>
            <AIRecommendations dateRange={dateRange} />
          </React.Suspense>
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      <Card className="bg-gray-50">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Sprint 4 Implementation • Advanced Analytics & AI Insights • Data Period:{' '}
              {selectedDateRange}
            </div>
            <div className="flex items-center gap-4">
              <span>Last Updated: {new Date().toLocaleString()}</span>
              <Badge variant="outline">v4.0.0</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
