/**
 * Sprint 4 Data Verification Component
 * Quick visual check to ensure all Sprint 4 data is properly loaded
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { enhancedAnalyticsService } from '@/services/enhanced-analytics';

interface VerificationResult {
  check: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  count?: number;
}

export function Sprint4DataVerification() {
  const [results, setResults] = useState<VerificationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallStatus, setOverallStatus] = useState<'success' | 'warning' | 'error'>('success');

  useEffect(() => {
    runVerificationChecks();
  }, []);

  const runVerificationChecks = async () => {
    setLoading(true);
    const checks: VerificationResult[] = [];

    try {
      // Check 1: Total transaction count
      const { count: totalCount, error: countError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        checks.push({
          check: 'Transaction Count',
          status: 'error',
          message: `Error: ${countError.message}`,
        });
      } else {
        checks.push({
          check: 'Transaction Count',
          status: totalCount >= 1000 ? 'success' : 'warning',
          message: `${totalCount.toLocaleString()} records found`,
          count: totalCount,
        });
      }

      // Check 2: Sprint 4 fields populated
      const { data: sampleTransactions } = await supabase
        .from('transactions')
        .select('payment_method, checkout_time, request_type, transcription_text')
        .not('payment_method', 'is', null)
        .limit(100);

      const sprint4FieldsPopulated = sampleTransactions && sampleTransactions.length > 0;
      checks.push({
        check: 'Sprint 4 Fields',
        status: sprint4FieldsPopulated ? 'success' : 'error',
        message: sprint4FieldsPopulated
          ? `Enhanced fields populated (${sampleTransactions.length} verified)`
          : 'Sprint 4 fields not found - run data generator',
        count: sampleTransactions?.length || 0,
      });

      // Check 3: Substitutions table
      const { count: substitutionCount } = await supabase
        .from('substitutions')
        .select('*', { count: 'exact', head: true });

      checks.push({
        check: 'Substitutions Table',
        status: substitutionCount > 0 ? 'success' : 'warning',
        message: `${substitutionCount} substitution records`,
        count: substitutionCount,
      });

      // Check 4: Request behaviors table
      const { count: behaviorCount } = await supabase
        .from('request_behaviors')
        .select('*', { count: 'exact', head: true });

      checks.push({
        check: 'Request Behaviors',
        status: behaviorCount > 0 ? 'success' : 'warning',
        message: `${behaviorCount} behavior records`,
        count: behaviorCount,
      });

      // Check 5: Payment method distribution
      const { data: paymentMethods } = await supabase
        .from('transactions')
        .select('payment_method')
        .not('payment_method', 'is', null)
        .limit(1000);

      const uniquePaymentMethods = new Set(paymentMethods?.map(p => p.payment_method) || []);
      checks.push({
        check: 'Payment Methods',
        status: uniquePaymentMethods.size >= 3 ? 'success' : 'warning',
        message: `${uniquePaymentMethods.size} types: ${Array.from(uniquePaymentMethods).join(', ')}`,
        count: uniquePaymentMethods.size,
      });

      // Check 6: Request type distribution
      const { data: requestTypes } = await supabase
        .from('transactions')
        .select('request_type')
        .not('request_type', 'is', null)
        .limit(1000);

      const uniqueRequestTypes = new Set(requestTypes?.map(r => r.request_type) || []);
      checks.push({
        check: 'Request Types',
        status: uniqueRequestTypes.size === 3 ? 'success' : 'warning',
        message: `${uniqueRequestTypes.size} types: ${Array.from(uniqueRequestTypes).join(', ')}`,
        count: uniqueRequestTypes.size,
      });

      // Check 7: RPC Functions
      try {
        const testData = await enhancedAnalyticsService.getRequestBehaviorStats();
        checks.push({
          check: 'RPC Functions',
          status: testData && testData.length > 0 ? 'success' : 'error',
          message: testData ? 'Analytics functions working' : 'RPC functions not found',
          count: testData?.length || 0,
        });
      } catch (rpcError) {
        checks.push({
          check: 'RPC Functions',
          status: 'error',
          message: 'RPC functions error - run migrations',
        });
      }

      // Check 8: Date range of data
      const { data: dateRange } = await supabase
        .from('transactions')
        .select('checkout_time')
        .order('checkout_time', { ascending: true })
        .limit(1);

      const { data: latestDate } = await supabase
        .from('transactions')
        .select('checkout_time')
        .order('checkout_time', { ascending: false })
        .limit(1);

      if (dateRange && latestDate && dateRange[0] && latestDate[0]) {
        const daysDiff = Math.floor(
          (new Date(latestDate[0].checkout_time).getTime() -
            new Date(dateRange[0].checkout_time).getTime()) /
            (1000 * 60 * 60 * 24)
        );

        checks.push({
          check: 'Date Range',
          status: daysDiff >= 30 ? 'success' : 'warning',
          message: `${daysDiff} days of data`,
          count: daysDiff,
        });
      }

      // Determine overall status
      const hasErrors = checks.some(c => c.status === 'error');
      const hasWarnings = checks.some(c => c.status === 'warning');
      setOverallStatus(hasErrors ? 'error' : hasWarnings ? 'warning' : 'success');

      setResults(checks);
    } catch (error) {
      console.error('Verification error:', error);
      setResults([
        {
          check: 'System Check',
          status: 'error',
          message: `Critical error: ${error.message}`,
        },
      ]);
      setOverallStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getOverallMessage = () => {
    switch (overallStatus) {
      case 'success':
        return 'All Sprint 4 features are ready!';
      case 'warning':
        return 'Sprint 4 is functional but some data may be missing';
      case 'error':
        return 'Sprint 4 setup incomplete - follow pre-test checklist';
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            Sprint 4 Data Verification
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          </span>
          {!loading && (
            <Badge
              variant={
                overallStatus === 'success'
                  ? 'default'
                  : overallStatus === 'warning'
                    ? 'secondary'
                    : 'destructive'
              }
              className="text-sm"
            >
              {getOverallMessage()}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((result, index) => (
              <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  {getStatusIcon(result.status)}
                  <span className="font-medium">{result.check}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{result.message}</span>
                  {result.count !== undefined && result.count > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {result.count.toLocaleString()}
                    </Badge>
                  )}
                </div>
              </div>
            ))}

            {overallStatus === 'error' && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                <h4 className="mb-2 font-medium text-red-900">Action Required</h4>
                <ol className="list-inside list-decimal space-y-1 text-sm text-red-700">
                  <li>
                    Run:{' '}
                    <code className="rounded bg-red-100 px-1">
                      npm install @faker-js/faker @radix-ui/react-progress
                    </code>
                  </li>
                  <li>
                    Run migrations:{' '}
                    <code className="rounded bg-red-100 px-1">supabase db push</code>
                  </li>
                  <li>
                    Generate data:{' '}
                    <code className="rounded bg-red-100 px-1">
                      npm run tsx scripts/generate-enhanced-retail-data.ts
                    </code>
                  </li>
                  <li>
                    Or run all:{' '}
                    <code className="rounded bg-red-100 px-1">./scripts/deploy-sprint4.sh</code>
                  </li>
                </ol>
              </div>
            )}

            {overallStatus === 'success' && (
              <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
                <h4 className="mb-2 font-medium text-green-900">Ready to Test! 🎉</h4>
                <p className="text-sm text-green-700">
                  All Sprint 4 components are properly configured. Navigate to the Advanced
                  Analytics tab to explore the new features.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
