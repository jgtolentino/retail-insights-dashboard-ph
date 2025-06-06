// Client-specific component - requires customization
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  Store,
  ShoppingCart,
  Users,
  BarChart3,
  Target,
  Award,
  Globe,
  Zap,
  RefreshCw,
} from 'lucide-react';

// Import our enhanced CLIENT components
import { TBWAMetricCard as CLIENTMetricCard } from '@/components/TBWAMetricCard';
import { TBWABrandPerformanceGrid as CLIENTBrandPerformanceGrid } from '@/components/TBWABrandPerformanceGrid';
import FilterBar from '@/components/FilterBar';
import { useFilters } from '@/stores/dashboardStore';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useRealtimeUpdates } from '@/hooks/useRealtimeData';
import { useBrandPerformance } from '@/hooks/useBrandPerformance';

export default function CLIENTDashboard() {
  const filters = useFilters();
  const { brandData, isLoading: brandLoading, error: brandError } = useBrandPerformance();
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Real-time updates
  const { isConnected, showUpdateNotification, dismissNotification } = useRealtimeUpdates();

  // Dashboard data with filters
  const { data: dashboardData, isLoading: isDashboardLoading } = useDashboardData({
    timeRange: '30d',
    filters: {
      brands: filters.brands,
      categories: filters.categories,
      regions: filters.regions,
      stores: filters.stores,
    },
    enabled: true,
  });

  // Calculate aggregated metrics from real data
  const totalRevenue = brandData.reduce((sum, brand) => sum + brand.revenue, 0);
  const totalTransactions = brandData.reduce((sum, brand) => sum + brand.transactions, 0);
  const clientBrands = brandData.filter(brand => brand.isCLIENT);
  const clientRevenue = clientBrands.reduce((sum, brand) => sum + brand.revenue, 0);
  const clientMarketShare = totalRevenue > 0 ? (clientRevenue / totalRevenue) * 100 : 0;

  // Calculate average growth rates
  const avgGrowthRate =
    brandData.length > 0
      ? brandData.reduce((sum, brand) => sum + brand.growth, 0) / brandData.length
      : 0;
  const avgTbwaGrowthRate =
    clientBrands.length > 0
      ? clientBrands.reduce((sum, brand) => sum + brand.growth, 0) / clientBrands.length
      : 0;

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate data refresh
    setTimeout(() => {
      setIsLoading(false);
      setLastUpdated(new Date());
    }, 1000);
  };

  // Show loading state
  if (brandLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-gray-600">Loading brand performance data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (brandError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-red-100 p-3">
            <RefreshCw className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Error Loading Data</h3>
          <p className="mt-2 text-gray-600">{brandError}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-client-gray">
            CLIENT <span className="text-client-orange">Dashboard</span>
          </h1>
          <p className="mt-1 text-gray-600">Real-time brand performance analytics and insights</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Real-time status indicator */}
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <span className="text-sm text-gray-600">{isConnected ? 'Live' : 'Offline'}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Update Notification */}
      {showUpdateNotification && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800">New data available</span>
            </div>
            <Button size="sm" onClick={dismissNotification}>
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <FilterBar />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <CLIENTMetricCard
          title="Total Revenue"
          value={`₱${(totalRevenue / 1000000).toFixed(1)}M`}
          change={Math.round(avgGrowthRate * 10) / 10}
          icon={<TrendingUp className="h-5 w-5" />}
          color="#0078d4"
          subtitle="All Brands Combined"
        />

        <CLIENTMetricCard
          title="CLIENT Revenue"
          value={`₱${(clientRevenue / 1000000).toFixed(1)}M`}
          change={Math.round(avgTbwaGrowthRate * 10) / 10}
          icon={<Target className="h-5 w-5" />}
          color="#F89E1B"
          isCLIENTBrand={true}
          subtitle="CLIENT Brands Only"
        />

        <CLIENTMetricCard
          title="Market Share"
          value={`${clientMarketShare.toFixed(1)}%`}
          change={Math.round(avgTbwaGrowthRate * 10) / 10}
          icon={<BarChart3 className="h-5 w-5" />}
          color="#28a745"
          isCLIENTBrand={true}
          subtitle="CLIENT vs Competition"
        />

        <CLIENTMetricCard
          title="Active Brands"
          value={clientBrands.length}
          icon={<Award className="h-5 w-5" />}
          color="#6f42c1"
          isCLIENTBrand={true}
          subtitle="CLIENT Portfolio"
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="brands">Brand Performance</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Brand Performance Grid */}
            <div className="lg:col-span-2">
              <CLIENTBrandPerformanceGrid brands={brandData} maxBrands={6} showCLIENTFirst={true} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="brands" className="space-y-4">
          <CLIENTBrandPerformanceGrid brands={brandData} maxBrands={12} showCLIENTFirst={true} />
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                AI-Powered Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
                  <h3 className="font-semibold text-blue-900">Growth Opportunity</h3>
                  <p className="mt-1 text-sm text-blue-800">
                    Adidas is showing 15.7% growth - consider increasing marketing investment in the
                    sportswear category.
                  </p>
                </div>

                <div className="rounded-lg border-l-4 border-orange-500 bg-orange-50 p-4">
                  <h3 className="font-semibold text-orange-900">Market Share Alert</h3>
                  <p className="mt-1 text-sm text-orange-800">
                    CLIENT brands currently hold {clientMarketShare.toFixed(1)}% market share. Target is
                    60% by Q4.
                  </p>
                </div>

                <div className="rounded-lg border-l-4 border-green-500 bg-green-50 p-4">
                  <h3 className="font-semibold text-green-900">Performance Highlight</h3>
                  <p className="mt-1 text-sm text-green-800">
                    Apple maintains the highest average transaction value at ₱470.12, indicating
                    strong premium positioning.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Button className="client-button">Download Brand Report</Button>
                <Button className="client-button">Export Performance Data</Button>
                <Button className="client-button">Generate Executive Summary</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="py-4 text-center text-sm text-gray-500">
        Last updated: {lastUpdated.toLocaleString()} | Powered by{' '}
        <span className="font-semibold text-client-blue">CLIENT Analytics</span>
      </div>
    </div>
  );
}
