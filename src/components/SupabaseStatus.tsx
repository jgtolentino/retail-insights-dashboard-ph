import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export function SupabaseStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      // Simple connectivity test
      const { count, error } = await supabase
        .from('brands')
        .select('*', { count: 'exact', head: true });

      if (error) {
        setStatus('error');
        setError(error.message);

        // Log helpful information
        console.error('🚨 Supabase Connection Error:', {
          message: error.message,
          code: error.code,
          hint: error.hint,
          details: error.details,
        });

        // Check if it's an RLS issue
        if (error.message.includes('row-level security') || error.code === '42501') {
          setError(
            'Row Level Security is blocking access. Please run the fix-database-access.sql script in Supabase.'
          );
        }
      } else {
        setStatus('connected');
        console.log('✅ Supabase connected successfully. Brands table has', count, 'records');
      }
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Unknown error');
      console.error('🚨 Network error:', err);
    }
  };

  if (status === 'checking') return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      {status === 'error' ? (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Database Connection Failed</strong>
            <p className="mt-1 text-sm">{error}</p>
            <p className="mt-2 text-xs">
              Run this in Supabase SQL Editor:
              <code className="mt-1 block rounded bg-red-900/20 p-1 text-xs">
                ALTER TABLE brands DISABLE ROW LEVEL SECURITY;
              </code>
            </p>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Database connected successfully
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
