
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Database, AlertCircle, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DebugInfo {
  table: string;
  count: number;
  status: 'success' | 'error';
  error?: string;
}

export const DebugDataLoader = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: debugInfo, isLoading, error } = useQuery({
    queryKey: ['debug-data', refreshKey],
    queryFn: async (): Promise<DebugInfo[]> => {
      const tables = ['transactions', 'brands', 'products', 'transaction_items'];
      const results: DebugInfo[] = [];

      for (const table of tables) {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          
          if (error) throw error;
          
          results.push({
            table,
            count: count || 0,
            status: 'success'
          });
        } catch (error: any) {
          results.push({
            table,
            count: 0,
            status: 'error',
            error: error.message
          });
        }
      }

      return results;
    }
  });

  // Test RPC function call
  const { data: rpcTest, isLoading: rpcLoading } = useQuery({
    queryKey: ['rpc-test', refreshKey],
    queryFn: async () => {
      try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        const endDate = new Date();

        const { data, error } = await supabase.rpc('get_dashboard_summary', {
          p_start_date: startDate.toISOString().split('T')[0],
          p_end_date: endDate.toISOString().split('T')[0]
        });

        if (error) throw error;
        return { status: 'success', data };
      } catch (error: any) {
        return { status: 'error', error: error.message };
      }
    }
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const totalRecords = debugInfo?.reduce((sum, info) => sum + info.count, 0) || 0;
  const hasErrors = debugInfo?.some(info => info.status === 'error') || false;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Health Check
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Database connectivity and table status
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalRecords.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Records</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {debugInfo?.filter(info => info.status === 'success').length || 0}
            </div>
            <div className="text-sm text-gray-600">Tables OK</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {debugInfo?.filter(info => info.status === 'error').length || 0}
            </div>
            <div className="text-sm text-gray-600">Errors</div>
          </div>
        </div>

        {/* Table Status */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Table Status</h4>
          {isLoading ? (
            <div className="text-center py-4 text-gray-500">Loading table information...</div>
          ) : debugInfo ? (
            <div className="grid grid-cols-2 gap-2">
              {debugInfo.map((info) => (
                <div key={info.table} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    {info.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="font-medium">{info.table}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={info.status === 'success' ? 'default' : 'destructive'}>
                      {info.count.toLocaleString()} rows
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-red-500">Failed to load table information</div>
          )}
        </div>

        {/* RPC Function Test */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">RPC Function Test</h4>
          {rpcLoading ? (
            <div className="text-center py-2 text-gray-500">Testing RPC functions...</div>
          ) : rpcTest ? (
            <div className="p-2 border rounded">
              <div className="flex items-center gap-2">
                {rpcTest.status === 'success' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="font-medium">get_dashboard_summary</span>
                <Badge variant={rpcTest.status === 'success' ? 'default' : 'destructive'}>
                  {rpcTest.status}
                </Badge>
              </div>
              {rpcTest.error && (
                <p className="text-sm text-red-600 mt-1">{rpcTest.error}</p>
              )}
            </div>
          ) : null}
        </div>

        {/* Error Details */}
        {hasErrors && debugInfo && (
          <div className="space-y-2">
            <h4 className="font-medium text-red-900">Error Details</h4>
            {debugInfo.filter(info => info.status === 'error').map((info) => (
              <div key={info.table} className="p-2 bg-red-50 border border-red-200 rounded">
                <div className="font-medium text-red-900">{info.table}</div>
                <div className="text-sm text-red-700">{info.error}</div>
              </div>
            ))}
          </div>
        )}

        {/* Overall Status */}
        <div className={`p-3 rounded text-center ${
          hasErrors ? 'bg-red-50 text-red-700 border border-red-200' : 
          'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {hasErrors ? 
            '⚠️ Some database issues detected. Check error details above.' :
            '✅ All database connections healthy!'
          }
        </div>
      </CardContent>
    </Card>
  );
};
