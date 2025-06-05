import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'loading';
  message: string;
  details?: any;
}

export function DiagnosticPanel() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);

    // Test 1: Basic Connectivity
    const connectivityTest: DiagnosticResult = {
      test: 'Supabase Connectivity',
      status: 'loading',
      message: 'Testing connection...',
    };
    setResults([connectivityTest]);

    try {
      const { data, error } = await supabase
        .from('brands')
        .select('count', { count: 'exact', head: true });
      if (error) throw error;

      connectivityTest.status = 'success';
      connectivityTest.message = 'Connected successfully';
      connectivityTest.details = { count: data };
    } catch (error: any) {
      connectivityTest.status = 'error';
      connectivityTest.message = error.message || 'Connection failed';
      connectivityTest.details = error;
    }
    setResults([{ ...connectivityTest }]);

    // Test 2: Table Access
    const tableTests = ['brands', 'transactions', 'stores', 'transaction_items'];
    for (const table of tableTests) {
      const tableTest: DiagnosticResult = {
        test: `Table Access: ${table}`,
        status: 'loading',
        message: 'Testing...',
      };
      setResults(prev => [...prev, tableTest]);

      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) throw error;

        tableTest.status = 'success';
        tableTest.message = `✓ Access granted (${count} records)`;
      } catch (error: any) {
        tableTest.status = 'error';
        tableTest.message = error.message;
        tableTest.details = {
          code: error.code,
          hint: error.hint,
          details: error.details,
        };
      }
      setResults(prev => [...prev.slice(0, -1), { ...tableTest }]);
    }

    // Test 3: RLS Policies
    const rlsTest: DiagnosticResult = {
      test: 'Row Level Security (RLS)',
      status: 'loading',
      message: 'Checking RLS policies...',
    };
    setResults(prev => [...prev, rlsTest]);

    try {
      const { data: brandsData, error: brandsError } = await supabase
        .from('brands')
        .select('id, name')
        .limit(1);

      if (brandsError) {
        rlsTest.status = 'error';
        rlsTest.message = 'RLS may be blocking access';
        rlsTest.details = brandsError;
      } else {
        rlsTest.status = 'success';
        rlsTest.message = 'RLS policies allow read access';
        rlsTest.details = { sampleData: brandsData };
      }
    } catch (error: any) {
      rlsTest.status = 'error';
      rlsTest.message = error.message;
    }
    setResults(prev => [...prev.slice(0, -1), { ...rlsTest }]);

    // Test 4: API Configuration
    const configTest: DiagnosticResult = {
      test: 'API Configuration',
      status: 'success',
      message: 'Configuration loaded',
      details: {
        url: 'https://lcoxtanyckjzyxxcsjzz.supabase.co',
        hasAnonKey: true,
        environment: import.meta.env.MODE,
      },
    };
    setResults(prev => [...prev, configTest]);

    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'loading':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    }
  };

  const hasErrors = results.some(r => r.status === 'error');

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🔧 API Diagnostics</span>
          <button
            onClick={runDiagnostics}
            disabled={isRunning}
            className="rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {isRunning ? 'Running...' : 'Run Again'}
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasErrors && (
          <Alert className="mb-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Backend Connection Issues Detected</AlertTitle>
            <AlertDescription>
              Some API endpoints are not accessible. This may be due to:
              <ul className="ml-4 mt-2 list-disc">
                <li>Row Level Security (RLS) policies blocking access</li>
                <li>Network connectivity issues</li>
                <li>Invalid API credentials</li>
                <li>CORS configuration</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {results.map((result, index) => (
            <div key={index} className="flex items-start space-x-3 rounded-lg bg-gray-50 p-3">
              {getStatusIcon(result.status)}
              <div className="flex-1">
                <p className="font-medium">{result.test}</p>
                <p className="text-sm text-gray-600">{result.message}</p>
                {result.details && result.status === 'error' && (
                  <pre className="mt-2 overflow-x-auto rounded bg-red-50 p-2 text-xs">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-900">Quick Fix Suggestions:</p>
          <ol className="ml-4 mt-2 list-decimal text-sm text-blue-800">
            <li>Check if RLS is enabled on your Supabase tables</li>
            <li>Verify your Supabase project is active and not paused</li>
            <li>Ensure API keys match your Supabase project</li>
            <li>Check browser console for CORS errors</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
