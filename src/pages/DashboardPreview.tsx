import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FilterBarFixed from '@/components/FilterBarFixed';
import SalesByBrandChart from '@/components/widgets/SalesByBrandChart';
import TransactionsTable from '@/components/widgets/TransactionsTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, ShoppingCart, Map } from 'lucide-react';
import { useSalesTrend } from '@/hooks/useSalesTrend';
import { useFilters } from '@/stores/dashboardStore';
import { useDashboardSummary } from '@/hooks/useDashboardSummary';
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

// Summary Stats Component
function SummaryStats() {
  // Use unified filters from new dashboard store
  const filters = useFilters();

  // Get real dashboard summary data
  const { summary, isLoading, error } = useDashboardSummary();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
              <div className="mb-2 h-8 w-1/2 rounded bg-gray-200"></div>
              <div className="h-3 w-2/3 rounded bg-gray-200"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="col-span-full">
        <CardContent className="p-6 text-center">
          <p className="text-red-600">Error loading summary data: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₱{summary.totalRevenue.toLocaleString()}</div>
          <p
            className={`text-xs ${summary.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {summary.revenueGrowth >= 0 ? '+' : ''}
            {summary.revenueGrowth}% from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.totalTransactions.toLocaleString()}</div>
          <p
            className={`text-xs ${summary.transactionGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {summary.transactionGrowth >= 0 ? '+' : ''}
            {summary.transactionGrowth}% from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₱{summary.avgTransactionValue}</div>
          <p
            className={`text-xs ${summary.avgValueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {summary.avgValueGrowth >= 0 ? '+' : ''}
            {summary.avgValueGrowth}% from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Unique Customers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.uniqueCustomers.toLocaleString()}</div>
          <p
            className={`text-xs ${summary.customerGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {summary.customerGrowth >= 0 ? '+' : ''}
            {summary.customerGrowth}% from last month
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Memoized Summary Stats Component
const MemoizedSummaryStats = React.memo(SummaryStats);

// Sales Trend Chart Component
function SalesTrendChart() {
  const { data, isLoading, error } = useSalesTrend('day');

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Sales Trend (Daily)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center text-red-500">
            Error loading trend data
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Sales Trend (Daily)</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-gray-500">
            No trend data available for current filters
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
                name="Daily Revenue"
              />
              <Line
                type="monotone"
                dataKey="transaction_count"
                stroke="#10b981"
                strokeWidth={2}
                name="Daily Transactions"
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
      <Card className="mb-4">
        <CardContent className="pt-4">
          <p className="text-sm text-gray-500">
            🎯 Showing all data - Use filters above to narrow down results
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            📊 Filtered View ({activeFiltersCount} active filters):
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

// Main Dashboard Preview Component
function DashboardPreviewContent() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            🎯 Retail Insights Dashboard - New Filter System Preview
          </h1>
          <p className="text-gray-600">
            Showcasing the new multi-select filter architecture with 18,000 transactions
          </p>
        </div>

        {/* Filter Bar */}
        <FilterBarFixed className="mb-6" />

        {/* Filter Status */}
        <FilterStatus />

        {/* Summary Stats */}
        <MemoizedSummaryStats />

        {/* Charts Section */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Sales by Brand Chart */}
          <SalesByBrandChart />

          {/* Sales Trend Chart */}
          <SalesTrendChart />
        </div>

        {/* Geospatial Section Header */}
        <div className="mb-4">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
            <Map className="h-5 w-5" />
            Geospatial Analytics
          </h2>
          <p className="text-sm text-gray-600">
            Interactive maps showing regional performance and customer distribution
          </p>
        </div>

        {/* Geospatial Maps */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Regional Sales Map */}
          <RegionalSalesMap
            height="400px"
            showLegend={true}
            enableDrillDown={true}
            onRegionClick={regionId => {/* Region click handler */}}
          />

          {/* Store Locations Map */}
          <StoreLocationsMap
            height="400px"
            showClusters={true}
            showRevenue={true}
            enableDrillDown={true}
            onStoreClick={storeId => {/* Store click handler */}}
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

        {/* Data Quality Notice */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm">🎤 STT Data Quality Notice</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-blue-50 p-4">
              <h4 className="mb-2 font-medium text-blue-900">
                Speech-to-Text Data Characteristics:
              </h4>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>
                  • 📊 <strong>18,000 transactions</strong> - Exactly as requested
                </li>
                <li>
                  • 📦 <strong>3,746 transaction items</strong> - Average 0.21 items per transaction
                </li>
                <li>
                  • 🎤 <strong>Realistic STT gaps</strong> - Not all transactions have complete
                  product data
                </li>
                <li>
                  • 🏷️ <strong>89 brands, 109 products</strong> - Available for filtering
                </li>
                <li>
                  • 🗺️ <strong>4 regions</strong> - Geographic distribution for location filtering
                </li>
                <li>
                  • ⚡ <strong>Optimal performance</strong> - Dataset size perfect for real-time
                  filtering
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <TransactionsTable className="mb-6" />

        {/* Filter System Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">🚀 New Dashboard Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-green-50 p-4">
                <h4 className="mb-2 font-medium text-green-900">✅ Multi-Select Filters</h4>
                <ul className="space-y-1 text-sm text-green-800">
                  <li>• Select multiple brands simultaneously</li>
                  <li>• Filter by multiple categories</li>
                  <li>• Choose multiple regions</li>
                  <li>• "Select All" and "Clear" functionality</li>
                </ul>
              </div>

              <div className="rounded-lg bg-purple-50 p-4">
                <h4 className="mb-2 font-medium text-purple-900">⚡ Performance Features</h4>
                <ul className="space-y-1 text-sm text-purple-800">
                  <li>• Zustand state management</li>
                  <li>• React Query automatic refetch</li>
                  <li>• URL parameter persistence</li>
                  <li>• Debounced filter updates</li>
                </ul>
              </div>

              <div className="rounded-lg bg-blue-50 p-4">
                <h4 className="mb-2 font-medium text-blue-900">🗺️ Geospatial Analytics</h4>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• Regional sales choropleth map</li>
                  <li>• Store locations with clustering</li>
                  <li>• Customer density heatmaps</li>
                  <li>• Interactive drill-down navigation</li>
                </ul>
              </div>

              <div className="rounded-lg bg-orange-50 p-4">
                <h4 className="mb-2 font-medium text-orange-900">🎯 Smart Filtering</h4>
                <ul className="space-y-1 text-sm text-orange-800">
                  <li>• Automatic data refetch on filter changes</li>
                  <li>• Centralized filter query builder</li>
                  <li>• Empty state handling</li>
                  <li>• Filter summary display</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Main Dashboard Preview with QueryClient Provider
export default function DashboardPreview() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardPreviewContent />
    </QueryClientProvider>
  );
}
