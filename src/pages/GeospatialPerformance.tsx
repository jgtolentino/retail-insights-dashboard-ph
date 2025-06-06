/**
 * Geospatial Performance Page
 *
 * "Why is this happening?" - Regional analysis and location-based insights
 * Interactive maps showing sales performance, customer distribution, and regional trends
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FilterBarFixed from '@/components/FilterBarFixed';
import SalesByBrandChart from '@/components/widgets/SalesByBrandChart';
import TransactionsTable from '@/components/widgets/TransactionsTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, ShoppingCart, Map, MapPin, Globe } from 'lucide-react';
import { useSalesTrend } from '@/hooks/useSalesTrend';
import { useFilters } from '@/stores/dashboardStore';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { RegionalSalesMap } from '@/components/maps/RegionalSalesMap';
import { StoreLocationsMap } from '@/components/maps/StoreLocationsMap';
import { CustomerDensityMap } from '@/components/maps/CustomerDensityMap';

// Create a query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

// Regional Summary Stats Component
function RegionalSummaryStats() {
  // Use unified filters from new dashboard store
  const filters = useFilters();

  // Mock data - in real implementation, these would be separate data hooks
  const stats = React.useMemo(
    () => ({
      totalRevenue: 1234567,
      totalTransactions: 18000,
      avgTransactionValue: 68.58,
      uniqueLocations: 127,
      topRegion: 'Metro Manila',
      topRegionShare: 42.3,
    }),
    []
  );

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Regional Revenue</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900">
            ₱{stats.totalRevenue.toLocaleString()}
          </div>
          <p className="text-xs text-blue-700">Across all regions</p>
        </CardContent>
      </Card>

      <Card className="border-green-200 bg-green-50/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Store Locations</CardTitle>
          <MapPin className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-900">{stats.uniqueLocations}</div>
          <p className="text-xs text-green-700">Active store locations</p>
        </CardContent>
      </Card>

      <Card className="border-purple-200 bg-purple-50/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Region</CardTitle>
          <Globe className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold text-purple-900">{stats.topRegion}</div>
          <p className="text-xs text-purple-700">{stats.topRegionShare}% of total sales</p>
        </CardContent>
      </Card>

      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Customer Reach</CardTitle>
          <Users className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-900">6,000</div>
          <p className="text-xs text-orange-700">Unique customers served</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Memoized Regional Summary Stats Component
const MemoizedRegionalSummaryStats = React.memo(RegionalSummaryStats);

// Regional Trend Chart Component
function RegionalTrendChart() {
  const { data, isLoading, error } = useSalesTrend('day');

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Regional Sales Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center text-red-500">
            Error loading regional trend data
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Regional Performance Over Time</CardTitle>
        <p className="text-xs text-gray-500">Daily revenue and transaction trends by region</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-gray-500">
            No regional trend data available for current filters
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                fontSize={12}
                tickFormatter={value =>
                  new Date(value).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
                }
              />
              <YAxis fontSize={12} tickFormatter={value => `₱${(value / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === 'total_revenue' ? `₱${value.toLocaleString()}` : value,
                  name === 'total_revenue' ? 'Revenue' : 'Transactions',
                ]}
                labelFormatter={label => `Date: ${new Date(label).toLocaleDateString('en-PH')}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="total_revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Regional Revenue"
              />
              <Line
                type="monotone"
                dataKey="transaction_count"
                stroke="#10b981"
                strokeWidth={2}
                name="Regional Transactions"
                yAxisId="right"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// Filter Status Display
function FilterStatus() {
  // Use unified filters from new dashboard store
  const filters = useFilters();

  const activeFiltersCount = [
    filters.brands.length > 0,
    filters.categories.length > 0,
    filters.regions.length > 0,
    filters.stores.length > 0,
    filters.dateRange.from && filters.dateRange.to,
  ].filter(Boolean).length;

  const filterSummary: string[] = [];
  if (filters.dateRange.from && filters.dateRange.to) {
    filterSummary.push(
      `Date: ${filters.dateRange.from.toDateString()} to ${filters.dateRange.to.toDateString()}`
    );
  }
  if (filters.brands.length > 0) {
    filterSummary.push(`${filters.brands.length} brands`);
  }
  if (filters.categories.length > 0) {
    filterSummary.push(`${filters.categories.length} categories`);
  }
  if (filters.regions.length > 0) {
    filterSummary.push(`${filters.regions.length} regions`);
  }
  if (filters.stores.length > 0) {
    filterSummary.push(`${filters.stores.length} stores`);
  }

  if (activeFiltersCount === 0) {
    return (
      <Card className="mb-4 border-blue-200 bg-blue-50/30">
        <CardContent className="pt-4">
          <p className="text-sm text-blue-700">
            🗺️ Showing all regional data - Use filters above to focus on specific areas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4 border-blue-200 bg-blue-50/30">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-blue-900">
            📊 Regional View ({activeFiltersCount} active filters):
          </span>
          <div className="flex flex-wrap gap-2">
            {filterSummary.map((summary, index) => (
              <span key={index} className="rounded-md bg-blue-100 px-2 py-1 text-xs text-blue-800">
                {summary}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Main Geospatial Performance Component
function GeospatialPerformanceContent() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-7xl">
        {/* Power BI Style Header - "Why is this happening?" Section */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Map className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Why Is This Happening?</h1>
              <p className="text-lg font-medium text-blue-600">Geospatial Performance Analysis</p>
            </div>
          </div>
          <p className="max-w-2xl text-gray-600">
            Discover regional patterns and location-based insights that drive your business
            performance. Analyze sales distribution, customer density, and market penetration across
            different geographic areas.
          </p>
        </div>

        {/* Filter Bar */}
        <FilterBarFixed className="mb-6" />

        {/* Filter Status */}
        <FilterStatus />

        {/* Regional Summary Stats */}
        <MemoizedRegionalSummaryStats />

        {/* Maps Section Header */}
        <div className="mb-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
            <Globe className="h-5 w-5 text-blue-600" />
            Interactive Regional Maps
          </h2>
          <p className="text-sm text-gray-600">
            Explore sales performance, store locations, and customer distribution patterns across
            regions
          </p>
        </div>

        {/* Primary Geospatial Maps */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Regional Sales Map */}
          <RegionalSalesMap
            height="450px"
            showLegend={true}
            enableDrillDown={true}
            onRegionClick={regionId => console.log('Region clicked:', regionId)}
          />

          {/* Store Locations Map */}
          <StoreLocationsMap
            height="450px"
            showClusters={true}
            showRevenue={true}
            enableDrillDown={true}
            onStoreClick={storeId => console.log('Store clicked:', storeId)}
          />
        </div>

        {/* Customer Density Map - Full Width */}
        <div className="mb-6">
          <CustomerDensityMap
            height="500px"
            initialMetric="transactions"
            initialAggregation="city"
            enableControls={true}
          />
        </div>

        {/* Charts Section */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Regional Sales by Brand Chart */}
          <SalesByBrandChart />

          {/* Regional Trend Chart */}
          <RegionalTrendChart />
        </div>

        {/* Regional Insights */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              Regional Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg bg-green-50 p-4">
                <h4 className="mb-2 font-medium text-green-900">Top Performing Regions</h4>
                <ul className="space-y-1 text-sm text-green-800">
                  <li>• Metro Manila: 42.3% of total sales</li>
                  <li>• CALABARZON: 18.7% revenue share</li>
                  <li>• Central Luzon: 15.2% market share</li>
                  <li>• Western Visayas: 8.9% contribution</li>
                </ul>
              </div>

              <div className="rounded-lg bg-blue-50 p-4">
                <h4 className="mb-2 font-medium text-blue-900">Growth Opportunities</h4>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• Mindanao regions: 23% growth potential</li>
                  <li>• Rural markets: Underserved areas</li>
                  <li>• Provincial cities: Emerging demand</li>
                  <li>• Island regions: Expansion opportunities</li>
                </ul>
              </div>

              <div className="rounded-lg bg-purple-50 p-4">
                <h4 className="mb-2 font-medium text-purple-900">Market Penetration</h4>
                <ul className="space-y-1 text-sm text-purple-800">
                  <li>• Urban areas: 78% penetration rate</li>
                  <li>• Suburban markets: 65% coverage</li>
                  <li>• Rural communities: 34% reach</li>
                  <li>• Remote islands: 12% presence</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Geographic Data Quality Notice */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Map className="h-4 w-4" />
              Geographic Data Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-blue-50 p-4">
              <h4 className="mb-2 font-medium text-blue-900">
                Regional Distribution & Data Quality:
              </h4>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>
                  • 🗺️ <strong>4 Major Regions</strong> - Complete geographic coverage
                </li>
                <li>
                  • 📍 <strong>127 Store Locations</strong> - Mapped with GPS coordinates
                </li>
                <li>
                  • 🏢 <strong>18,000 Transactions</strong> - Location-tagged for analysis
                </li>
                <li>
                  • 🎯 <strong>6,000 Customers</strong> - Geo-distributed across regions
                </li>
                <li>
                  • 📊 <strong>Real-time Updates</strong> - Live regional performance tracking
                </li>
                <li>
                  • 🔍 <strong>Drill-down Analytics</strong> - From region to store to customer
                  level
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Regional Transactions Table */}
        <TransactionsTable className="mb-6" />

        {/* Regional Analytics Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Advanced Geospatial Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-green-50 p-4">
                <h4 className="mb-2 font-medium text-green-900">🗺️ Interactive Maps</h4>
                <ul className="space-y-1 text-sm text-green-800">
                  <li>• Regional sales choropleth visualization</li>
                  <li>• Store location clustering and markers</li>
                  <li>• Customer density heatmap overlay</li>
                  <li>• Click-to-drill-down navigation</li>
                </ul>
              </div>

              <div className="rounded-lg bg-purple-50 p-4">
                <h4 className="mb-2 font-medium text-purple-900">📊 Performance Analytics</h4>
                <ul className="space-y-1 text-sm text-purple-800">
                  <li>• Regional revenue comparison</li>
                  <li>• Market share by geography</li>
                  <li>• Growth trend analysis</li>
                  <li>• Performance benchmarking</li>
                </ul>
              </div>

              <div className="rounded-lg bg-blue-50 p-4">
                <h4 className="mb-2 font-medium text-blue-900">🎯 Location Intelligence</h4>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• Store coverage analysis</li>
                  <li>• Market penetration metrics</li>
                  <li>• Customer accessibility mapping</li>
                  <li>• Expansion opportunity identification</li>
                </ul>
              </div>

              <div className="rounded-lg bg-orange-50 p-4">
                <h4 className="mb-2 font-medium text-orange-900">🔍 Smart Filtering</h4>
                <ul className="space-y-1 text-sm text-orange-800">
                  <li>• Multi-region selection filtering</li>
                  <li>• Store-level data filtering</li>
                  <li>• Brand performance by region</li>
                  <li>• Time-based regional trends</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Main Geospatial Performance with QueryClient Provider
export default function GeospatialPerformance() {
  return (
    <QueryClientProvider client={queryClient}>
      <GeospatialPerformanceContent />
    </QueryClientProvider>
  );
}
