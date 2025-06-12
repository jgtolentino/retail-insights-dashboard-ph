import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface DriveStats {
  id: number;
  snapshot_ts: number;
  file_count: number;
  total_bytes: number;
  shared: number;
  file_types?: Record<string, number>;
  last_modified?: string;
}

export default function DriveHealth() {
  const [stats, setStats] = useState<DriveStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch initial data
    const fetchInitialData = async () => {
      try {
        const { data, error } = await supabase
          .from('drive_monitor')
          .select('*')
          .order('snapshot_ts', { ascending: false })
          .limit(1);

        if (error) throw error;
        if (data && data.length > 0) {
          setStats(data[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('drive_monitor_changes')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'drive_monitor' 
        },
        (payload) => {
          setStats(payload.new as DriveStats);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="card p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          <div className="h-3 bg-gray-200 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-4 border-red-200 bg-red-50">
        <h3 className="text-red-800 font-semibold">Drive Health Error</h3>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="card p-4 border-yellow-200 bg-yellow-50">
        <h3 className="text-yellow-800 font-semibold">No Drive Data</h3>
        <p className="text-yellow-600 text-sm">No health reports available</p>
      </div>
    );
  }

  return (
    <div className="card p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <span className="text-green-500">🟢</span>
        Drive Health
        <span className="text-xs text-gray-500">(live)</span>
      </h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-2 bg-blue-50 rounded">
          <div className="text-2xl font-bold text-blue-600">{stats.file_count}</div>
          <div className="text-xs text-blue-500">📄 Files</div>
        </div>
        
        <div className="text-center p-2 bg-green-50 rounded">
          <div className="text-2xl font-bold text-green-600">
            {formatBytes(stats.total_bytes)}
          </div>
          <div className="text-xs text-green-500">💾 Size</div>
        </div>
      </div>

      <ul className="space-y-2 text-sm">
        <li className="flex justify-between">
          <span className="text-gray-600">🔗 Shared files:</span>
          <span className="font-medium">{stats.shared}</span>
        </li>
        
        <li className="flex justify-between">
          <span className="text-gray-600">🕒 Last scan:</span>
          <span className="font-medium text-xs">
            {formatDate(stats.snapshot_ts)}
          </span>
        </li>
      </ul>

      {stats.file_types && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <h4 className="text-xs font-medium text-gray-700 mb-2">File Types</h4>
          <div className="flex flex-wrap gap-1">
            {Object.entries(stats.file_types)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([type, count]) => (
                <span 
                  key={type}
                  className="px-2 py-1 bg-gray-100 text-xs rounded-full text-gray-600"
                >
                  {type}: {count}
                </span>
              ))}
          </div>
        </div>
      )}
      
      <div className="mt-3 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          Real-time monitoring active
        </div>
      </div>
    </div>
  );
}