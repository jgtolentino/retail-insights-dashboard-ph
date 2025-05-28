/**
 * Health Check API Endpoint
 * Provides system health status for monitoring
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  checks: {
    database: HealthStatus;
    api: HealthStatus;
    external_services: HealthStatus;
  };
  metrics: {
    uptime: number;
    memory_usage: number;
    response_time: number;
  };
}

interface HealthStatus {
  status: 'up' | 'down' | 'degraded';
  response_time_ms: number;
  error?: string;
  last_check: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  const startTime = Date.now();
  
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const healthResult: HealthCheckResult = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
      checks: {
        database: await checkDatabase(),
        api: await checkApiEndpoints(),
        external_services: await checkExternalServices(),
      },
      metrics: {
        uptime: process.uptime(),
        memory_usage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        response_time: Date.now() - startTime,
      },
    };

    // Determine overall health status
    const checks = Object.values(healthResult.checks);
    const hasDown = checks.some(check => check.status === 'down');
    const hasDegraded = checks.some(check => check.status === 'degraded');

    if (hasDown) {
      healthResult.status = 'unhealthy';
    } else if (hasDegraded) {
      healthResult.status = 'degraded';
    }

    // Return appropriate HTTP status
    const httpStatus = healthResult.status === 'healthy' ? 200 :
                      healthResult.status === 'degraded' ? 200 : 503;

    res.status(httpStatus).json(healthResult);

  } catch (error) {
    console.error('Health check error:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Internal health check error',
      response_time: Date.now() - startTime,
    });
  }
}

async function checkDatabase(): Promise<HealthStatus> {
  const startTime = Date.now();
  
  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    // Simple query to test database connectivity
    const { data, error } = await supabase
      .from('transactions')
      .select('id')
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: 'down',
        response_time_ms: responseTime,
        error: error.message,
        last_check: new Date().toISOString(),
      };
    }

    return {
      status: responseTime > 2000 ? 'degraded' : 'up',
      response_time_ms: responseTime,
      last_check: new Date().toISOString(),
    };

  } catch (error) {
    return {
      status: 'down',
      response_time_ms: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown database error',
      last_check: new Date().toISOString(),
    };
  }
}

async function checkApiEndpoints(): Promise<HealthStatus> {
  const startTime = Date.now();
  
  try {
    // Test critical API functions
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    // Test age distribution function
    const { error } = await supabase.rpc('get_age_distribution', {
      start_date: '2025-05-01T00:00:00Z',
      end_date: '2025-05-02T00:00:00Z',
      bucket_size: 10
    });

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: 'down',
        response_time_ms: responseTime,
        error: `API function error: ${error.message}`,
        last_check: new Date().toISOString(),
      };
    }

    return {
      status: responseTime > 3000 ? 'degraded' : 'up',
      response_time_ms: responseTime,
      last_check: new Date().toISOString(),
    };

  } catch (error) {
    return {
      status: 'down',
      response_time_ms: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown API error',
      last_check: new Date().toISOString(),
    };
  }
}

async function checkExternalServices(): Promise<HealthStatus> {
  const startTime = Date.now();
  
  try {
    // Check Supabase service health
    const response = await fetch(`${process.env.VITE_SUPABASE_URL}/health`, {
      method: 'GET',
      timeout: 5000,
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return {
        status: 'down',
        response_time_ms: responseTime,
        error: `External service error: ${response.status}`,
        last_check: new Date().toISOString(),
      };
    }

    return {
      status: responseTime > 5000 ? 'degraded' : 'up',
      response_time_ms: responseTime,
      last_check: new Date().toISOString(),
    };

  } catch (error) {
    return {
      status: 'down',
      response_time_ms: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'External service unreachable',
      last_check: new Date().toISOString(),
    };
  }
}