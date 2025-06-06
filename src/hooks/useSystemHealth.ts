import { useState, useEffect } from 'react';

export interface SystemHealth {
  status: 'Optimal' | 'Warning' | 'Error';
  dbConnected: boolean;
  responseTime: number;
}

export function useSystemHealth() {
  const [health, setHealth] = useState<SystemHealth>({
    status: 'Optimal',
    dbConnected: true,
    responseTime: 150,
  });

  useEffect(() => {
    // Simple mock health check for now
    const checkHealth = () => {
      setHealth({
        status: 'Optimal',
        dbConnected: true,
        responseTime: Math.floor(Math.random() * 100) + 50,
      });
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return health;
}
