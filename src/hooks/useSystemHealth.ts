import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface SystemHealth {
  database: boolean;
  api: boolean;
  cache: boolean;
  lastChecked: string;
}

export async function useSystemHealth(): Promise<SystemHealth> {
  try {
    // Check database health
    const { error: dbError } = await supabase.from('system_health').select('id').limit(1);
    const database = !dbError;

    // Check API health (you can replace this with your actual API health check)
    const api = true; // Placeholder for actual API health check

    // Check cache health (you can replace this with your actual cache health check)
    const cache = true; // Placeholder for actual cache health check

    return {
      database,
      api,
      cache,
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Error checking system health:', error);
    return {
      database: false,
      api: false,
      cache: false,
      lastChecked: new Date().toISOString()
    };
  }
}
