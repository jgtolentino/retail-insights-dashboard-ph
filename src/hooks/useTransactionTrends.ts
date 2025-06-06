import { useState, useEffect } from 'react';

interface TrendDataPoint {
  label: string;
  transactionCount: number;
  avgAmount: number;
  timestamp: string;
}

interface TrendsResponse {
  hourlyVolume: TrendDataPoint[];
  summary: {
    totalTransactions: number;
    totalAmount: number;
    avgTransaction: number;
    peakHour: string;
    peakTransactions: number;
  };
  filters: {
    region: string;
    period: string;
    brand: string;
    category: string;
  };
  lastUpdated: string;
  dataSource: string;
}

export function useTransactionTrends(region: string = 'All Regions', period: number = 7) {
  const [data, setData] = useState<TrendDataPoint[] | null>(null);
  const [summary, setSummary] = useState<TrendsResponse['summary'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrends() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/transactions/trends?region=${encodeURIComponent(region)}&period=${period}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch trends: ${response.status}`);
        }

        const result: TrendsResponse = await response.json();
        setData(result.hourlyVolume);
        setSummary(result.summary);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch trends');
      } finally {
        setLoading(false);
      }
    }

    fetchTrends();
  }, [region, period]);

  return { data, summary, loading, error };
}
