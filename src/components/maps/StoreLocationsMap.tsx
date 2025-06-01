import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Store, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useStorePerformance } from '@/hooks/useStorePerformance';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Custom store icon
const createStoreIcon = (performance: 'high' | 'medium' | 'low') => {
  const colors = {
    high: '#10b981', // green-500
    medium: '#f59e0b', // amber-500
    low: '#ef4444', // red-500
  };

  return L.divIcon({
    html: `
      <div class="relative">
        <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-lg" 
             style="background-color: ${colors[performance]}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M3 21h18"/>
            <path d="M5 21V7l8-4v18"/>
            <path d="M19 21V11l-6-4"/>
            <circle cx="9" cy="9" r="0.5"/>
            <circle cx="9" cy="14" r="0.5"/>
          </svg>
        </div>
        <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 
                    border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent 
                    border-t-[8px]" style="border-top-color: ${colors[performance]}">
        </div>
      </div>
    `,
    className: 'custom-store-marker',
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  });
};

// Component to handle map bounds
function MapBounds({ stores }: { stores: any[] }) {
  const map = useMap();

  useEffect(() => {
    if (stores.length > 0) {
      const bounds = L.latLngBounds(stores.map(store => [store.latitude, store.longitude]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [stores, map]);

  return null;
}

interface StoreLocationsMapProps {
  height?: string;
  showClusters?: boolean;
  showRevenue?: boolean;
  enableDrillDown?: boolean;
  onStoreClick?: (storeId: number) => void;
}

function StoreLocationsMapComponent({
  height = '500px',
  showClusters = true,
  showRevenue = true,
  enableDrillDown = true,
  onStoreClick,
}: StoreLocationsMapProps) {
  const { data: storeData, isLoading, error } = useStorePerformance();

  // Calculate performance tiers
  const storesWithPerformance = useMemo(() => {
    if (!storeData || storeData.length === 0) return [];

    const revenues = storeData.map(s => s.total_revenue);
    const maxRevenue = Math.max(...revenues);
    const minRevenue = Math.min(...revenues);
    const range = maxRevenue - minRevenue;

    return storeData.map(store => {
      let performance: 'high' | 'medium' | 'low' = 'medium';

      if (store.total_revenue >= minRevenue + range * 0.66) {
        performance = 'high';
      } else if (store.total_revenue <= minRevenue + range * 0.33) {
        performance = 'low';
      }

      // Generate realistic coordinates for demo (Philippines bounds)
      const latitude = store.latitude || 9.5 + Math.random() * (19.5 - 9.5);
      const longitude = store.longitude || 117.0 + Math.random() * (126.0 - 117.0);

      return {
        ...store,
        performance,
        latitude,
        longitude,
      };
    });
  }, [storeData]);

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-500">Error loading store locations</div>
        </CardContent>
      </Card>
    );
  }

  const MarkerContent = showClusters ? MarkerClusterGroup : React.Fragment;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Store Locations & Performance
          </span>
          {isLoading && (
            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-gray-900"></div>
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
            />

            <MapBounds stores={storesWithPerformance} />

            <MarkerContent>
              {storesWithPerformance.map(store => (
                <Marker
                  key={store.id}
                  position={[store.latitude, store.longitude]}
                  icon={createStoreIcon(store.performance)}
                  eventHandlers={{
                    click: () => {
                      if (enableDrillDown && onStoreClick) {
                        onStoreClick(store.id);
                      }
                    },
                  }}
                >
                  <Popup className="custom-popup">
                    <div className="min-w-[200px] p-2">
                      <h3 className="mb-2 text-sm font-bold">{store.name}</h3>

                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Location:</span>
                          <span>{store.location}</span>
                        </div>

                        {showRevenue && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Revenue:</span>
                              <span className="font-medium">
                                ₱{store.total_revenue.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Transactions:</span>
                              <span>{store.transaction_count.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Avg Transaction:</span>
                              <span>₱{store.avg_transaction_value.toFixed(2)}</span>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="mt-2 border-t pt-2">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant={
                              store.performance === 'high'
                                ? 'default'
                                : store.performance === 'low'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                            className="text-xs"
                          >
                            {store.performance.toUpperCase()} PERFORMER
                          </Badge>
                          {store.growth_rate !== undefined && (
                            <div className="flex items-center gap-1">
                              {store.growth_rate > 0 ? (
                                <TrendingUp className="h-3 w-3 text-green-500" />
                              ) : store.growth_rate < 0 ? (
                                <TrendingDown className="h-3 w-3 text-red-500" />
                              ) : (
                                <Minus className="h-3 w-3 text-gray-500" />
                              )}
                              <span
                                className={`text-xs ${
                                  store.growth_rate > 0
                                    ? 'text-green-600'
                                    : store.growth_rate < 0
                                      ? 'text-red-600'
                                      : 'text-gray-600'
                                }`}
                              >
                                {Math.abs(store.growth_rate).toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {enableDrillDown && (
                        <div className="mt-2 text-center">
                          <button className="text-xs text-blue-600 hover:text-blue-800">
                            View Details →
                          </button>
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MarkerContent>
          </MapContainer>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 z-[1000] rounded-lg bg-white p-3 shadow-md">
            <h4 className="mb-2 text-xs font-semibold">Store Performance</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-green-500"></div>
                <span className="text-xs">High Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-amber-500"></div>
                <span className="text-xs">Medium Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-red-500"></div>
                <span className="text-xs">Low Revenue</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Export memoized component
export const StoreLocationsMap = React.memo(StoreLocationsMapComponent);
