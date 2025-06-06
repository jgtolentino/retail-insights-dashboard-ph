import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { configManager } from './config';

// Singleton clients to avoid multiple instances
let supabaseClient: SupabaseClient | null = null;
let supabaseServiceClient: SupabaseClient | null = null;

/**
 * Get Supabase client with anon key (for client-side operations)
 */
export async function getSupabaseClient(): Promise<SupabaseClient> {
  if (supabaseClient) {
    return supabaseClient;
  }

  try {
    const config = await configManager.getConfig();

    supabaseClient = createClient(config.supabase.url, config.supabase.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });

    return supabaseClient;
  } catch (error) {
    throw error;
  }
}

/**
 * Get Supabase service client with service role key (for server-side operations)
 */
export async function getSupabaseServiceClient(): Promise<SupabaseClient> {
  if (supabaseServiceClient) {
    return supabaseServiceClient;
  }

  try {
    const config = await configManager.getConfig();

    supabaseServiceClient = createClient(config.supabase.url, config.supabase.serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    return supabaseServiceClient;
  } catch (error) {
    throw error;
  }
}

/**
 * Reset clients (useful for config refresh)
 */
export function resetSupabaseClients(): void {
  supabaseClient = null;
  supabaseServiceClient = null;
  }

/**
 * Test Supabase connectivity
 */
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const client = await getSupabaseClient();
    const { data, error } = await client.from('transactions').select('id').limit(1);

    if (error) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get connection status and health check
 */
export async function getSupabaseHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  client: boolean;
  serviceClient: boolean;
  database: boolean;
  realtime: boolean;
}> {
  const health = {
    status: 'unhealthy' as const,
    client: false,
    serviceClient: false,
    database: false,
    realtime: false,
  };

  try {
    // Test client connection
    const client = await getSupabaseClient();
    health.client = true;

    // Test service client connection
    const serviceClient = await getSupabaseServiceClient();
    health.serviceClient = true;

    // Test database connectivity
    const { data, error } = await client.from('transactions').select('count(*)').limit(1);

    health.database = !error;

    // Test realtime connectivity (basic check)
    try {
      const channel = client.channel('health-check');
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout')), 2000);
        channel.subscribe(status => {
          clearTimeout(timeout);
          health.realtime = status === 'SUBSCRIBED';
          resolve(status);
        });
      });
      channel.unsubscribe();
    } catch {
      health.realtime = false;
    }

    // Determine overall status
    if (health.client && health.serviceClient && health.database && health.realtime) {
      health.status = 'healthy';
    } else if (health.client && health.database) {
      health.status = 'degraded';
    } else {
      health.status = 'unhealthy';
    }
  } catch (error) {
    }

  return health;
}
