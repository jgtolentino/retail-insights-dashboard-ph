import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DebugDataLoader() {
  const [debug, setDebug] = useState({
    totalCount: 0,
    sampleData: [],
    filters: {},
    error: null,
    loading: true,
  });

  useEffect(() => {
    async function debugLoad() {
      console.log('🔍 Starting debug load...');

      try {
        // 1. Get total count
        const { count, error: countError } = await supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true });

        if (countError) throw countError;
        console.log('✅ Total count:', count);

        // 2. Get sample transactions
        const { data: transactions, error: txError } = await supabase
          .from('transactions')
          .select(
            `
            *,
            products(name, brand, category),
            stores(name, city, barangay)
          `
          )
          .limit(10)
          .order('checkout_time', { ascending: false });

        if (txError) throw txError;
        console.log('✅ Sample transactions:', transactions);

        // 3. Check date range
        const { data: dateRange, error: dateError } = await supabase
          .from('transactions')
          .select('checkout_time')
          .order('checkout_time', { ascending: true })
          .limit(1);

        const { data: latestDate } = await supabase
          .from('transactions')
          .select('checkout_time')
          .order('checkout_time', { ascending: false })
          .limit(1);

        console.log('✅ Date range:', {
          earliest: dateRange?.[0]?.checkout_time,
          latest: latestDate?.[0]?.checkout_time,
        });

        // 4. Check RPC functions
        const { data: trends, error: rpcError } = await supabase.rpc('get_daily_trends', {
          days_back: 7,
        });

        console.log('✅ RPC test:', { trends, rpcError });

        setDebug({
          totalCount: count || 0,
          sampleData: transactions || [],
          filters: {
            dateRange: {
              start: dateRange?.[0]?.checkout_time,
              end: latestDate?.[0]?.checkout_time,
            },
          },
          error: null,
          loading: false,
        });
      } catch (error) {
        console.error('❌ Debug load error:', error);
        setDebug(prev => ({
          ...prev,
          error: error.message,
          loading: false,
        }));
      }
    }

    debugLoad();
  }, []);

  return (
    <Card className="mb-4 border-2 border-orange-500">
      <CardHeader className="bg-orange-50">
        <CardTitle>🔍 Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <strong>Database Records:</strong> {debug.totalCount.toLocaleString()}
        </div>
        <div>
          <strong>Sample Data:</strong> {debug.sampleData.length} records loaded
        </div>
        <div>
          <strong>Date Range:</strong> {debug.filters.dateRange?.start} to{' '}
          {debug.filters.dateRange?.end}
        </div>
        {debug.error && (
          <div className="text-red-600">
            <strong>Error:</strong> {debug.error}
          </div>
        )}
        <details>
          <summary className="cursor-pointer text-sm text-blue-600">View Sample Data</summary>
          <pre className="mt-2 max-h-40 overflow-auto rounded bg-gray-100 p-2 text-xs">
            {JSON.stringify(debug.sampleData, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
}
