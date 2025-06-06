import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SystemHealth {
  status: 'Optimal' | 'Warning' | 'Error';
  dbConnected: boolean;
  lastChecked: Date;
  responseTime: number;
}

export function useSystemHealth() {
  const [health, setHealth] = useState<SystemHealth>({
    status: 'Error',
    dbConnected: false,
    lastChecked: new Date(),
    responseTime: 0,
  });

  useEffect(() => {
    async function checkSystemHealth() {
      const startTime = Date.now();

      try {
        // Simple health check by querying a small table
        const { data, error } = await supabase.from('brands').select('id').limit(1);

        const responseTime = Date.now() - startTime;

        if (error) {
          setHealth({
            status: 'Error',
            dbConnected: false,
            lastChecked: new Date(),
            responseTime,
          });
        } else {
          setHealth({
            status: responseTime < 1000 ? 'Optimal' : responseTime < 3000 ? 'Warning' : 'Error',
            dbConnected: true,
            lastChecked: new Date(),
            responseTime,
          });
        }
      } catch (err) {
        setHealth({
          status: 'Error',
          dbConnected: false,
          lastChecked: new Date(),
          responseTime: Date.now() - startTime,
        });
      }
    }

    // Check immediately
    checkSystemHealth();

    // Check every 30 seconds
    const interval = setInterval(checkSystemHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  return health;
}
