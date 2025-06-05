import { useCallback, useEffect, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  promise?: Promise<T>;
}

class DashboardCache {
  private cache = new Map<string, CacheEntry<any>>();
  private TTL = 5 * 60 * 1000; // 5 minutes
  private listeners = new Set<() => void>();

  async get<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);

    if (cached) {
      // Return cached data if not expired
      if (Date.now() - cached.timestamp < this.TTL) {
        return cached.data as T;
      }

      // Return in-flight promise if exists
      if (cached.promise) {
        return cached.promise as Promise<T>;
      }
    }

    // Create new promise for this fetch
    const promise = fetcher().then(data => {
      this.cache.set(key, { data, timestamp: Date.now() });
      this.notifyListeners();
      return data;
    });

    // Store promise in cache
    this.cache.set(key, { data: null, timestamp: Date.now(), promise });

    return promise;
  }

  invalidate(pattern?: string) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const dashboardCache = new DashboardCache();

// React hook for using the cache
export function useCache<T>(key: string, fetcher: () => Promise<T>, dependencies: any[] = []) {
  const dataRef = useRef<T | null>(null);
  const errorRef = useRef<Error | null>(null);
  const loadingRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      loadingRef.current = true;
      const data = await dashboardCache.get(key, fetcher);
      dataRef.current = data;
      errorRef.current = null;
    } catch (error) {
      errorRef.current = error as Error;
    } finally {
      loadingRef.current = false;
    }
  }, [key, ...dependencies]);

  useEffect(() => {
    fetchData();
    return dashboardCache.subscribe(fetchData);
  }, [fetchData]);

  return {
    data: dataRef.current,
    error: errorRef.current,
    loading: loadingRef.current,
    refetch: fetchData,
  };
}
