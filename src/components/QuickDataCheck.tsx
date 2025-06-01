import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function QuickDataCheck() {
  const [results, setResults] = useState({
    totalCount: 0,
    rlsStatus: 'checking',
    sampleData: null,
    error: null
  });

  const checkData = async () => {
    console.log('🔍 Checking existing data...');
    
    try {
      // Test 1: Basic count
      const { count, error: countError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });
      
      console.log('✅ Database count:', count);
      console.log('❌ Count error:', countError);
      
      // Test 2: Try to get sample data
      const { data: sample, error: sampleError } = await supabase
        .from('transactions')
        .select('id, total_amount, created_at')
        .limit(3);
      
      console.log('✅ Sample data:', sample);
      console.log('❌ Sample error:', sampleError);
      
      setResults({
        totalCount: count || 0,
        rlsStatus: countError ? 'blocked' : 'open',
        sampleData: sample,
        error: countError || sampleError
      });
      
    } catch (err) {
      console.error('❌ Check failed:', err);
      setResults(prev => ({
        ...prev,
        error: err.message
      }));
    }
  };

  useEffect(() => {
    checkData();
  }, []);

  return (
    <Card className="mb-4 border-2 border-blue-500 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-blue-800">🔍 Data Check Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Total Records:</strong>
            <div className={`text-2xl font-bold ${results.totalCount > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {results.totalCount.toLocaleString()}
            </div>
          </div>
          
          <div>
            <strong>Database Access:</strong>
            <div className={`font-bold ${results.rlsStatus === 'open' ? 'text-green-600' : 'text-red-600'}`}>
              {results.rlsStatus === 'open' ? '✅ Working' : '❌ Blocked'}
            </div>
          </div>
        </div>
        
        {results.error && (
          <div className="p-3 bg-red-100 border border-red-300 rounded">
            <strong className="text-red-800">Error:</strong>
            <div className="text-red-700 text-sm mt-1">{results.error.message || results.error}</div>
          </div>
        )}
        
        {results.sampleData && results.sampleData.length > 0 && (
          <div className="p-3 bg-green-100 border border-green-300 rounded">
            <strong className="text-green-800">✅ Data Found:</strong>
            <div className="text-sm mt-1">
              Sample: {results.sampleData.map(t => `₱${t.total_amount}`).join(', ')}
            </div>
          </div>
        )}
        
        <Button onClick={checkData} variant="outline" size="sm">
          Recheck Data
        </Button>
        
        {results.rlsStatus === 'blocked' && (
          <div className="p-3 bg-yellow-100 border border-yellow-300 rounded">
            <strong className="text-yellow-800">Quick Fix Needed:</strong>
            <div className="text-sm mt-1">
              Run this in Supabase SQL Editor:
              <code className="block bg-yellow-50 p-2 mt-1 rounded text-xs">
                ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
              </code>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}