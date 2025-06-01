import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DataTestComponent() {
  const [testResults, setTestResults] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testAllFunctions();
  }, []);

  const testAllFunctions = async () => {
    setLoading(true);
    const results: any = {};

    try {
      // Test 1: Age Distribution
      console.log('🧪 Testing age distribution...');
      const { data: ageData, error: ageError } = await supabase.rpc('get_age_distribution', {
        start_date: '2025-04-30T00:00:00Z',
        end_date: '2025-05-30T23:59:59Z',
        bucket_size: 10,
      });

      results.ageDistribution = {
        success: !ageError,
        error: ageError?.message,
        dataCount: ageData?.length || 0,
        sampleData: ageData?.slice(0, 3),
      };

      // Test 2: Consumer Profile (includes gender distribution)
      console.log('🧪 Testing consumer profile...');
      const { data: consumerData, error: consumerError } = await supabase.rpc(
        'get_consumer_profile' as any,
        {
          p_start: '2025-04-30T00:00:00Z',
          p_end: '2025-05-30T23:59:59Z',
        }
      );

      // Extract gender distribution from consumer profile
      let genderDistribution: any[] = [];
      if (consumerData && typeof consumerData === 'object') {
        genderDistribution = (consumerData as any).gender_distribution || [];
      }

      results.genderDistribution = {
        success: !consumerError,
        error: consumerError?.message,
        dataCount: genderDistribution?.length || 0,
        sampleData: genderDistribution,
      };

      // Test 3: Raw transaction sample
      console.log('🧪 Testing raw transactions...');
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .select('customer_age, customer_gender, amount, created_at')
        .not('customer_age', 'is', null)
        .limit(5);

      results.transactions = {
        success: !transactionError,
        error: transactionError?.message,
        dataCount: transactionData?.length || 0,
        sampleData: transactionData,
      };

      console.log('📊 All test results:', results);
      setTestResults(results);
    } catch (error) {
      console.error('💥 Test failed:', error);
      results.error = error;
      setTestResults(results);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🧪 Testing Data Connection...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🔍 Data Connection Test Results</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Age Distribution Test */}
          <div className="rounded-lg border p-4">
            <h3 className="flex items-center gap-2 font-semibold">
              {testResults.ageDistribution?.success ? '✅' : '❌'} Age Distribution Function
            </h3>
            <p className="text-sm text-muted-foreground">
              Records found: {testResults.ageDistribution?.dataCount || 0}
            </p>
            {testResults.ageDistribution?.error && (
              <p className="text-sm text-red-600">Error: {testResults.ageDistribution.error}</p>
            )}
            {testResults.ageDistribution?.sampleData && (
              <pre className="mt-2 overflow-auto rounded bg-gray-100 p-2 text-xs">
                {JSON.stringify(testResults.ageDistribution.sampleData, null, 2)}
              </pre>
            )}
          </div>

          {/* Gender Distribution Test */}
          <div className="rounded-lg border p-4">
            <h3 className="flex items-center gap-2 font-semibold">
              {testResults.genderDistribution?.success ? '✅' : '❌'} Consumer Profile Function
              (Gender Data)
            </h3>
            <p className="text-sm text-muted-foreground">
              Records found: {testResults.genderDistribution?.dataCount || 0}
            </p>
            {testResults.genderDistribution?.error && (
              <p className="text-sm text-red-600">Error: {testResults.genderDistribution.error}</p>
            )}
            {testResults.genderDistribution?.sampleData && (
              <pre className="mt-2 overflow-auto rounded bg-gray-100 p-2 text-xs">
                {JSON.stringify(testResults.genderDistribution.sampleData, null, 2)}
              </pre>
            )}
          </div>

          {/* Transactions Test */}
          <div className="rounded-lg border p-4">
            <h3 className="flex items-center gap-2 font-semibold">
              {testResults.transactions?.success ? '✅' : '❌'} Raw Transaction Data
            </h3>
            <p className="text-sm text-muted-foreground">
              Records found: {testResults.transactions?.dataCount || 0}
            </p>
            {testResults.transactions?.error && (
              <p className="text-sm text-red-600">Error: {testResults.transactions.error}</p>
            )}
            {testResults.transactions?.sampleData && (
              <pre className="mt-2 overflow-auto rounded bg-gray-100 p-2 text-xs">
                {JSON.stringify(testResults.transactions.sampleData, null, 2)}
              </pre>
            )}
          </div>

          <button
            onClick={testAllFunctions}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            🔄 Re-run Tests
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
