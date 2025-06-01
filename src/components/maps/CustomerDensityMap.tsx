import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Circle, Tooltip } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users } from 'lucide-react';
import { useCustomerDensity } from '@/hooks/useCustomerDensity';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

type AggregationLevel = 'barangay' | 'city' | 'province';
type MetricType = 'transactions' | 'revenue' | 'unique_customers';

interface CustomerDensityMapProps {
  height?: string;
  initialMetric?: MetricType;
  initialAggregation?: AggregationLevel;
  enableControls?: boolean;
}

function CustomerDensityMapComponent({
  height = '500px',
  initialMetric = 'transactions',
  initialAggregation = 'city',
  enableControls = true,
}: CustomerDensityMapProps) {
  const [metric, setMetric] = React.useState<MetricType>(() => initialMetric);
  const [aggregationLevel, setAggregationLevel] = React.useState<AggregationLevel>(
    () => initialAggregation
  );

  const { data: densityData, isLoading, error } = useCustomerDensity(aggregationLevel);

  // Memoize handlers to prevent infinite loops with stable references
  const handleMetricChange = React.useCallback((value: string) => {
    const newMetric = value as MetricType;
    setMetric(prev => (prev === newMetric ? prev : newMetric));
  }, []);

  const handleAggregationChange = React.useCallback((value: string) => {
    const newAggregation = value as AggregationLevel;
    setAggregationLevel(prev => (prev === newAggregation ? prev : newAggregation));
  }, []);

  // Memoize metric labels to prevent re-creation
  const metricLabels = React.useMemo(
    () => ({
      transactions: 'Transaction Volume',
      revenue: 'Revenue Concentration',
      unique_customers: 'Customer Density',
    }),
    []
  );

  // Calculate max value once to avoid recalculation
  const maxValue = React.useMemo(() => {
    if (!densityData || densityData.length === 0) return 1;
    return Math.max(...densityData.map(d => d[metric] || 0));
  }, [densityData, metric]);

  // Memoize getCircleProps to prevent infinite loops
  const getCircleProps = React.useCallback(
    (location: any) => {
      const value = location[metric] || 0;

      // Calculate radius (10-50 pixels based on value)
      const radius = 10000 + (value / maxValue) * 40000; // In meters for geographic scale

      // Calculate color intensity
      const intensity = value / maxValue;
      let color = '#3b82f6'; // blue-500
      let fillColor = '#3b82f6';

      if (metric === 'revenue') {
        // Green scale for revenue
        fillColor = `rgba(34, 197, 94, ${0.2 + intensity * 0.6})`; // green-500
        color = '#16a34a'; // green-600
      } else if (metric === 'unique_customers') {
        // Purple scale for customers
        fillColor = `rgba(168, 85, 247, ${0.2 + intensity * 0.6})`; // purple-500
        color = '#9333ea'; // purple-600
      } else {
        // Blue scale for transactions
        fillColor = `rgba(59, 130, 246, ${0.2 + intensity * 0.6})`; // blue-500
        color = '#2563eb'; // blue-600
      }

      return { radius, color, fillColor, fillOpacity: 0.6 };
    },
    [metric, maxValue]
  );

  const densityCircles = React.useMemo(() => {
    if (!densityData || densityData.length === 0) return [];

    return densityData.map((location, index) => {
      const { radius, color, fillColor, fillOpacity } = getCircleProps(location);

      return (
        <Circle
          key={`${location.area_name}-${index}`}
          center={[location.latitude, location.longitude]}
          radius={radius}
          pathOptions={{
            color,
            fillColor,
            fillOpacity,
            weight: 2,
          }}
        >
          <Tooltip permanent={false} direction="top">
            <div className="p-2">
              <h4 className="text-sm font-bold">{location.area_name}</h4>
              <div className="space-y-1 text-xs">
                <div>Transactions: {location.transactions.toLocaleString()}</div>
                <div>Revenue: ₱{location.revenue.toLocaleString()}</div>
                <div>Customers: {location.unique_customers.toLocaleString()}</div>
                <div className="mt-1 border-t pt-1">
                  Avg Transaction: ₱{location.avg_transaction_value.toFixed(2)}
                </div>
              </div>
            </div>
          </Tooltip>
        </Circle>
      );
    });
  }, [densityData, getCircleProps]);

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-500">Error loading customer density data</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {metricLabels[metric]} by{' '}
              {aggregationLevel.charAt(0).toUpperCase() + aggregationLevel.slice(1)}
            </span>
            {isLoading && (
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-gray-900"></div>
            )}
          </div>

          {enableControls && (
            <div className="mt-3 flex gap-2">
              <Select value={metric} onValueChange={handleMetricChange}>
                <SelectTrigger className="h-8 w-[180px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transactions">Transaction Volume</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="unique_customers">Customer Count</SelectItem>
                </SelectContent>
              </Select>

              <Select value={aggregationLevel} onValueChange={handleAggregationChange}>
                <SelectTrigger className="h-8 w-[140px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="barangay">Barangay</SelectItem>
                  <SelectItem value="city">City</SelectItem>
                  <SelectItem value="province">Province</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div style={{ height, position: 'relative' }}>
          <MapContainer
            center={[12.8797, 121.774]} // Center of Philippines
            zoom={6}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              opacity={0.5}
            />

            {densityCircles}
          </MapContainer>

          {/* Legend */}
          <div className="absolute bottom-4 right-4 z-[1000] rounded-lg bg-white p-3 shadow-md">
            <h4 className="mb-2 text-xs font-semibold">Density Indicator</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div
                  className={`h-4 w-4 rounded-full opacity-80 ${
                    metric === 'revenue'
                      ? 'bg-green-500'
                      : metric === 'unique_customers'
                        ? 'bg-purple-500'
                        : 'bg-blue-500'
                  }`}
                ></div>
                <span className="text-xs">
                  High{' '}
                  {metric === 'revenue'
                    ? 'Revenue'
                    : metric === 'unique_customers'
                      ? 'Customers'
                      : 'Activity'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full opacity-40 ${
                    metric === 'revenue'
                      ? 'bg-green-500'
                      : metric === 'unique_customers'
                        ? 'bg-purple-500'
                        : 'bg-blue-500'
                  }`}
                ></div>
                <span className="text-xs">
                  Low{' '}
                  {metric === 'revenue'
                    ? 'Revenue'
                    : metric === 'unique_customers'
                      ? 'Customers'
                      : 'Activity'}
                </span>
              </div>
              <div className="mt-2 border-t pt-2 text-xs text-gray-600">
                Circle size = relative density
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Export memoized component
export const CustomerDensityMap = React.memo(CustomerDensityMapComponent);
