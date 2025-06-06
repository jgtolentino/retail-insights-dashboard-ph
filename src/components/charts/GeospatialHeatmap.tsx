import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, Store, Activity, TrendingUp, Filter, Zap } from 'lucide-react';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import { useStoreHeatmap } from '@/hooks/useStoreHeatmap';

interface GeospatialHeatmapProps {
  region?: string;
  period?: number;
  className?: string;
}

export function GeospatialHeatmap({
  region = 'All Regions',
  period = 7,
  className = '',
}: GeospatialHeatmapProps) {
  const [selectedMetric, setSelectedMetric] = useState('transactions');
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const { data, summary, mapBounds, loading, error } = useStoreHeatmap(
    region,
    period,
    selectedMetric
  );

  if (loading) {
    return (
      <ChartErrorBoundary title="Transaction Data Error">
        <Card className={className}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Store Performance Heatmap</span>
            </CardTitle>
            <CardDescription>Loading Philippine sari-sari store locations...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-96 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            </div>
          </CardContent>
        </Card>
      </ChartErrorBoundary>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-600">
            <MapPin className="h-5 w-5" />
            <span>Store Performance Heatmap</span>
          </CardTitle>
          <CardDescription>Failed to load store data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-red-500">
            <p>Error: {error}</p>
            <p className="mt-2 text-sm text-gray-500">Please try refreshing the page</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Store Performance Heatmap</span>
          </CardTitle>
          <CardDescription>No store data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-gray-500">
            <p>No stores found for the selected filters</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getIntensityColor = (intensity: number) => {
    const colors = [
      'bg-blue-100',
      'bg-blue-200',
      'bg-blue-300',
      'bg-blue-400',
      'bg-blue-500',
      'bg-yellow-300',
      'bg-yellow-400',
      'bg-orange-400',
      'bg-red-400',
      'bg-red-500',
    ];
    return colors[Math.min(intensity - 1, colors.length - 1)] || 'bg-gray-200';
  };

  const getStatusColor = (status: string) => {
    return status === 'online' ? 'bg-green-500' : 'bg-red-500';
  };

  const selectedStoreData = selectedStore ? data.find(store => store.id === selectedStore) : null;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <span>Geospatial Store Heatmap</span>
            </CardTitle>
            <CardDescription>
              Philippine sari-sari store performance • {region} • Last {period} days
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transactions">Transactions</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              <Activity className="mr-1 h-3 w-3" />
              Live IoT Data
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        {summary && (
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.totalStores}</div>
              <div className="text-sm text-gray-500">Active Stores</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {summary.totalTransactions.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Total Transactions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                ₱{summary.totalRevenue.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Total Revenue</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-2xl font-bold text-green-600">{summary.onlineDevices}</span>
                <span className="text-gray-400">/</span>
                <span className="text-lg text-gray-600">{summary.totalStores}</span>
              </div>
              <div className="text-sm text-gray-500">Devices Online</div>
            </div>
          </div>
        )}

        {/* Map Visualization (Simplified Grid Layout) */}
        <div className="mb-6">
          <div className="rounded-lg border bg-gray-50 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Philippine Store Network</h4>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span>Online</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <span>Offline</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                  <span>High Performance</span>
                </div>
              </div>
            </div>

            {/* Regional Grid Layout */}
            <div className="grid gap-4 md:grid-cols-3">
              {/* Luzon */}
              <div className="rounded border bg-white p-3">
                <h5 className="mb-2 font-medium text-gray-800">Luzon</h5>
                <div className="space-y-2">
                  {data
                    .filter(store => ['NCR', 'CAR'].includes(store.region))
                    .map(store => (
                      <div
                        key={store.id}
                        className={`cursor-pointer rounded p-2 text-sm transition-colors hover:bg-gray-100 ${
                          selectedStore === store.id ? 'bg-blue-100 ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => setSelectedStore(store.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div
                              className={`h-2 w-2 rounded-full ${getStatusColor(store.deviceStatus)}`}
                            ></div>
                            <span className="font-medium">{store.name}</span>
                          </div>
                          <div
                            className={`h-3 w-8 rounded ${getIntensityColor(store.intensity)}`}
                          ></div>
                        </div>
                        <div className="ml-4 text-xs text-gray-500">
                          {store.city} • {store.transactions} txns • ₱
                          {store.revenue.toLocaleString()}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Visayas */}
              <div className="rounded border bg-white p-3">
                <h5 className="mb-2 font-medium text-gray-800">Visayas</h5>
                <div className="space-y-2">
                  {data
                    .filter(store => ['Central Visayas', 'Western Visayas'].includes(store.region))
                    .map(store => (
                      <div
                        key={store.id}
                        className={`cursor-pointer rounded p-2 text-sm transition-colors hover:bg-gray-100 ${
                          selectedStore === store.id ? 'bg-blue-100 ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => setSelectedStore(store.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div
                              className={`h-2 w-2 rounded-full ${getStatusColor(store.deviceStatus)}`}
                            ></div>
                            <span className="font-medium">{store.name}</span>
                          </div>
                          <div
                            className={`h-3 w-8 rounded ${getIntensityColor(store.intensity)}`}
                          ></div>
                        </div>
                        <div className="ml-4 text-xs text-gray-500">
                          {store.city} • {store.transactions} txns • ₱
                          {store.revenue.toLocaleString()}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Mindanao */}
              <div className="rounded border bg-white p-3">
                <h5 className="mb-2 font-medium text-gray-800">Mindanao</h5>
                <div className="space-y-2">
                  {data
                    .filter(store => ['Davao Region', 'Northern Mindanao'].includes(store.region))
                    .map(store => (
                      <div
                        key={store.id}
                        className={`cursor-pointer rounded p-2 text-sm transition-colors hover:bg-gray-100 ${
                          selectedStore === store.id ? 'bg-blue-100 ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => setSelectedStore(store.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div
                              className={`h-2 w-2 rounded-full ${getStatusColor(store.deviceStatus)}`}
                            ></div>
                            <span className="font-medium">{store.name}</span>
                          </div>
                          <div
                            className={`h-3 w-8 rounded ${getIntensityColor(store.intensity)}`}
                          ></div>
                        </div>
                        <div className="ml-4 text-xs text-gray-500">
                          {store.city} • {store.transactions} txns • ₱
                          {store.revenue.toLocaleString()}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Store Details Panel */}
        {selectedStoreData && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="flex items-center space-x-2 font-medium text-blue-900">
                <Store className="h-4 w-4" />
                <span>{selectedStoreData.name}</span>
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedStore(null)}
                className="text-blue-700"
              >
                Close
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <h5 className="mb-2 text-sm font-medium text-blue-800">Location</h5>
                <p className="text-sm text-blue-700">
                  {selectedStoreData.city}, {selectedStoreData.region}
                </p>
                <p className="text-xs text-blue-600">
                  {selectedStoreData.lat.toFixed(4)}, {selectedStoreData.lng.toFixed(4)}
                </p>
              </div>

              <div>
                <h5 className="mb-2 text-sm font-medium text-blue-800">Performance</h5>
                <p className="text-sm text-blue-700">
                  {selectedStoreData.transactions} transactions • ₱
                  {selectedStoreData.revenue.toLocaleString()}
                </p>
                <p className="text-xs text-blue-600">
                  Avg: ₱{selectedStoreData.averageTransaction} •{' '}
                  {selectedStoreData.customerFootfall} customers
                </p>
              </div>

              <div>
                <h5 className="mb-2 text-sm font-medium text-blue-800">Device Status</h5>
                <div className="flex items-center space-x-2">
                  <div
                    className={`h-2 w-2 rounded-full ${getStatusColor(selectedStoreData.deviceStatus)}`}
                  ></div>
                  <span className="text-sm capitalize text-blue-700">
                    {selectedStoreData.deviceStatus}
                  </span>
                </div>
                <p className="text-xs text-blue-600">
                  Last sync: {new Date(selectedStoreData.lastSync).toLocaleTimeString()}
                </p>
              </div>
            </div>

            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <div>
                <h5 className="mb-1 text-sm font-medium text-blue-800">Peak Hours</h5>
                <p className="text-sm text-blue-700">{selectedStoreData.peakHours.join(', ')}</p>
              </div>
              <div>
                <h5 className="mb-1 text-sm font-medium text-blue-800">Top Products</h5>
                <p className="text-sm text-blue-700">
                  {selectedStoreData.topProducts.slice(0, 3).join(', ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Top Performers */}
        {summary && summary.topStores && (
          <div>
            <h4 className="mb-3 font-medium text-gray-900">
              Top Performing Stores (
              {selectedMetric === 'revenue' ? 'by Revenue' : 'by Transactions'})
            </h4>
            <div className="grid gap-3 md:grid-cols-5">
              {summary.topStores.map((store, index) => (
                <div key={store.id} className="rounded border bg-white p-3 text-sm">
                  <div className="mb-2 flex items-center space-x-2">
                    <Badge variant="outline" className="h-6 w-6 justify-center p-0 text-xs">
                      {index + 1}
                    </Badge>
                    <div
                      className={`h-2 w-2 rounded-full ${getStatusColor(store.deviceStatus)}`}
                    ></div>
                  </div>
                  <div className="font-medium text-gray-900">{store.name}</div>
                  <div className="text-xs text-gray-500">{store.city}</div>
                  <div className="mt-2 text-sm font-semibold text-blue-600">
                    {selectedMetric === 'revenue'
                      ? `₱${store.revenue.toLocaleString()}`
                      : `${store.transactions} txns`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-4 text-center text-xs text-gray-500">
          Last updated: {new Date().toLocaleString()} • Click on stores to view details • IoT
          devices monitoring in real-time
        </div>
      </CardContent>
    </Card>
  );
}
