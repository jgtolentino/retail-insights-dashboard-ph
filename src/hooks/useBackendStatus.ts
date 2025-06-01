import { useQuery } from '@tanstack/react-query';

export interface BackendStatus {
  status: 'OK' | 'ERROR' | 'DEGRADED';
  timestamp: string;
  notes?: string;
  qaResults?: {
    passRate: number;
    totalTests: number;
    lastRun: string;
  };
}

export const useBackendStatus = () => {
  return useQuery<BackendStatus>({
    queryKey: ['backend-status'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/health');
        if (!res.ok) throw new Error('API not healthy');
        return await res.json();
      } catch (error) {
        throw new Error(`Backend unreachable: ${error}`);
      }
    },
    refetchInterval: 30000, // Check every 30 seconds
    retry: 3,
    staleTime: 10000, // Consider fresh for 10 seconds
  });
};

export const useQAMetrics = () => {
  return useQuery({
    queryKey: ['qa-metrics'],
    queryFn: async () => {
      const res = await fetch('/api/qa-status');
      if (!res.ok) throw new Error('QA metrics unavailable');
      return res.json();
    },
    refetchInterval: 60000, // Check every minute
  });
};
