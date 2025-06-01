import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, Tooltip } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRegionalSales } from '@/hooks/useRegionalSales';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in production build
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Philippines regions GeoJSON (simplified for demo)
const philippinesRegions = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        name: 'NCR',
        region_id: 'NCR',
        full_name: 'National Capital Region',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [121.0, 14.4],
            [121.1, 14.4],
            [121.1, 14.7],
            [121.0, 14.7],
            [121.0, 14.4],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        name: 'Region III',
        region_id: 'III',
        full_name: 'Central Luzon',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [120.3, 14.8],
            [121.2, 14.8],
            [121.2, 16.0],
            [120.3, 16.0],
            [120.3, 14.8],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        name: 'Region IV-A',
        region_id: 'IV-A',
        full_name: 'CALABARZON',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [120.8, 13.5],
            [121.8, 13.5],
            [121.8, 14.8],
            [120.8, 14.8],
            [120.8, 13.5],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        name: 'Region VII',
        region_id: 'VII',
        full_name: 'Central Visayas',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [123.3, 9.5],
            [124.2, 9.5],
            [124.2, 11.0],
            [123.3, 11.0],
            [123.3, 9.5],
          ],
        ],
      },
    },
  ],
} as any;

interface RegionalSalesMapProps {
  height?: string;
  showLegend?: boolean;
  enableDrillDown?: boolean;
  onRegionClick?: (regionId: string) => void;
}

function RegionalSalesMapComponent({
  height = '400px',
  showLegend = true,
  enableDrillDown = true,
  onRegionClick,
}: RegionalSalesMapProps) {
  const { data: salesData, isLoading, error } = useRegionalSales();
  const mapRef = useRef<L.Map | null>(null);

  // Color scale function based on sales volume
  const getColor = (sales: number) => {
    const maxSales = Math.max(...(salesData?.map(d => d.total_sales) || [1]));
    const ratio = sales / maxSales;

    if (ratio > 0.8) return '#1e40af'; // blue-800
    if (ratio > 0.6) return '#2563eb'; // blue-600
    if (ratio > 0.4) return '#3b82f6'; // blue-500
    if (ratio > 0.2) return '#60a5fa'; // blue-400
    return '#93c5fd'; // blue-300
  };

  const style = (feature: any) => {
    const regionSales = salesData?.find(d => d.region === feature.properties.name);
    const sales = regionSales?.total_sales || 0;

    return {
      fillColor: getColor(sales),
      weight: 2,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7,
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    const regionSales = salesData?.find(d => d.region === feature.properties.name);
    const sales = regionSales?.total_sales || 0;
    const transactions = regionSales?.transaction_count || 0;

    // Add tooltip
    const tooltipContent = `
      <div class="p-2">
        <h4 class="font-bold">${feature.properties.full_name}</h4>
        <p class="text-sm">Sales: ₱${sales.toLocaleString()}</p>
        <p class="text-sm">Transactions: ${transactions.toLocaleString()}</p>
        ${enableDrillDown ? '<p class="text-xs text-blue-600 mt-1">Click to drill down</p>' : ''}
      </div>
    `;

    if (layer instanceof L.Path) {
      layer.bindTooltip(tooltipContent, {
        permanent: false,
        sticky: true,
        className: 'custom-tooltip',
      });

      // Add click handler for drill-down
      if (enableDrillDown) {
        layer.on('click', () => {
          if (onRegionClick) {
            onRegionClick(feature.properties.region_id);
          }
        });
      }

      // Highlight on hover
      layer.on({
        mouseover: e => {
          const target = e.target;
          target.setStyle({
            weight: 3,
            color: '#1e40af',
            fillOpacity: 0.9,
          });
        },
        mouseout: e => {
          const target = e.target;
          target.setStyle(style(feature));
        },
      });
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-500">Error loading regional sales data</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Regional Sales Performance</span>
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
            scrollWheelZoom={false}
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              opacity={0.3}
            />
            <GeoJSON data={philippinesRegions} style={style} onEachFeature={onEachFeature} />
          </MapContainer>

          {showLegend && salesData && salesData.length > 0 && (
            <div className="absolute bottom-4 right-4 z-[1000] rounded-lg bg-white p-3 shadow-md">
              <h4 className="mb-2 text-xs font-semibold">Sales Volume</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-blue-800"></div>
                  <span className="text-xs">High</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-blue-500"></div>
                  <span className="text-xs">Medium</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-blue-300"></div>
                  <span className="text-xs">Low</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Export memoized component
export const RegionalSalesMap = React.memo(RegionalSalesMapComponent);
