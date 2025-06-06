import { useState, useEffect } from 'react';

interface StoreData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  city: string;
  region: string;
  transactions: number;
  revenue: number;
  averageTransaction: number;
  customerFootfall: number;
  peakHours: string[];
  topProducts: string[];
  deviceStatus: 'online' | 'offline';
  lastSync: string;
  coordinates: [number, number];
  intensity: number;
}

interface HeatmapSummary {
  totalStores: number;
  totalTransactions: number;
  totalRevenue: number;
  avgTransactionsPerStore: number;
  avgRevenuePerStore: number;
  onlineDevices: number;
  offlineDevices: number;
  topStores: StoreData[];
}

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface HeatmapResponse {
  storeData: StoreData[];
  summary: HeatmapSummary;
  mapBounds: MapBounds;
  filters: {
    region: string;
    period: string;
    metric: string;
  };
  lastUpdated: string;
  dataSource: string;
}

export function useStoreHeatmap(
  region: string = 'All Regions',
  period: number = 7,
  metric: string = 'transactions'
) {
  const [data, setData] = useState<StoreData[] | null>(null);
  const [summary, setSummary] = useState<HeatmapSummary | null>(null);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHeatmapData() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/transactions/heatmap?region=${encodeURIComponent(region)}&period=${period}&metric=${metric}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch heatmap data: ${response.status}`);
        }

        const result: HeatmapResponse = await response.json();
        setData(result.storeData);
        setSummary(result.summary);
        setMapBounds(result.mapBounds);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch heatmap data');
      } finally {
        setLoading(false);
      }
    }

    fetchHeatmapData();
  }, [region, period, metric]);

  return { data, summary, mapBounds, loading, error };
}
