import { getSupabaseClient } from '@/integrations/supabase/client';

export interface HealthCheckResult {
  supabase: boolean;
  hasRealData: boolean;
  mockDataDisabled: boolean;
  environment: string;
  timestamp: string;
  dataStats?: {
    transactionCount: number;
    brandCount: number;
    storeCount: number;
  };
  errors?: string[];
}

export async function verifyDataConnections(): Promise<HealthCheckResult> {
  const result: HealthCheckResult = {
    supabase: false,
    hasRealData: false,
    mockDataDisabled: true,
    environment: import.meta.env.MODE || 'unknown',
    timestamp: new Date().toISOString(),
    errors: [],
  };

  try {
    // Check if mock data is disabled
    result.mockDataDisabled = import.meta.env.VITE_USE_MOCK_DATA !== 'true';

    // Get Supabase client (with MCP support)
    const supabase = await getSupabaseClient();

    // Test Supabase connection
    const { error: connectionError } = await supabase.from('transactions').select('id').limit(1);

    if (connectionError) {
      result.errors?.push(`Supabase connection failed: ${connectionError.message}`);
      return result;
    }

    result.supabase = true;
    // Check for real data
    const [transactionsResult, brandsResult, storesResult] = await Promise.all([
      supabase.from('transactions').select('*', { count: 'exact', head: true }),
      supabase.from('brands').select('*', { count: 'exact', head: true }),
      supabase.from('stores').select('*', { count: 'exact', head: true }),
    ]);

    const transactionCount = transactionsResult.count || 0;
    const brandCount = brandsResult.count || 0;
    const storeCount = storesResult.count || 0;

    result.dataStats = {
      transactionCount,
      brandCount,
      storeCount,
    };

    result.hasRealData = transactionCount > 0 && brandCount > 0;

    if (result.hasRealData) {
      } else {
      result.errors?.push('Database tables appear to be empty');
    }

    // Production environment checks
    if (result.environment === 'production') {
      if (!result.mockDataDisabled) {
        result.errors?.push('Mock data is enabled in production');
        }

      if (!result.hasRealData) {
        result.errors?.push('Production environment has no real data');
        }

      // Check for required environment variables
      const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
      requiredEnvVars.forEach(envVar => {
        if (!import.meta.env[envVar]) {
          result.errors?.push(`Missing environment variable: ${envVar}`);
        }
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors?.push(`Health check failed: ${errorMessage}`);
    }

  return result;
}

export function logHealthCheckResult(result: HealthCheckResult) {
  if (result.dataStats) {
    console.log('Data stats:', result.dataStats);
  }

  if (result.errors && result.errors.length > 0) {
    result.errors.forEach(error => console.warn('Health check error:', error));
  }

  return result;
}

// Auto-run health check in production
if (import.meta.env.PROD) {
  verifyDataConnections().then(logHealthCheckResult);
}
