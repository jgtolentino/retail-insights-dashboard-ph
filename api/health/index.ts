import { VercelRequest, VercelResponse } from '@vercel/node';
import { createAzurePostgresFromEnv } from '../../src/services/azurePostgresClient';
import { intelligentRouter } from '../../src/services/intelligentModelRouter';

/**
 * Health check endpoint for the retail insights dashboard
 * Tests Azure PostgreSQL connectivity and intelligent routing
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  const checks = {
    database: false,
    intelligentRouting: false,
    environment: false
  };

  try {
    // Test database connectivity
    try {
      const client = createAzurePostgresFromEnv();
      checks.database = await client.testConnection();
      
      if (checks.database) {
        console.log('✅ Azure PostgreSQL connection successful');
      }
    } catch (dbError) {
      console.error('❌ Database check failed:', dbError);
      checks.database = false;
    }

    // Test intelligent routing
    try {
      const testQuery = 'show top 5 brands';
      const complexity = intelligentRouter.analyzeComplexity(testQuery);
      checks.intelligentRouting = !!complexity && complexity.level === 'simple';
      
      if (checks.intelligentRouting) {
        console.log('✅ Intelligent routing working');
      }
    } catch (routingError) {
      console.error('❌ Intelligent routing check failed:', routingError);
      checks.intelligentRouting = false;
    }

    // Test environment configuration
    try {
      const requiredEnvVars = [
        'AZURE_POSTGRES_HOST',
        'AZURE_POSTGRES_DATABASE',
        'AZURE_POSTGRES_USERNAME',
        'AZURE_POSTGRES_PASSWORD'
      ];

      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      checks.environment = missingVars.length === 0;
      
      if (checks.environment) {
        console.log('✅ Environment configuration complete');
      } else {
        console.warn('⚠️ Missing environment variables:', missingVars);
      }
    } catch (envError) {
      console.error('❌ Environment check failed:', envError);
      checks.environment = false;
    }

    const processingTime = Date.now() - startTime;
    const allHealthy = Object.values(checks).every(check => check === true);

    const healthStatus = {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      processingTime: `${processingTime}ms`,
      checks,
      services: {
        database: {
          provider: 'Azure PostgreSQL',
          status: checks.database ? 'connected' : 'disconnected',
          host: process.env.AZURE_POSTGRES_HOST || 'not-configured'
        },
        ai: {
          provider: 'Azure OpenAI',
          intelligentRouting: checks.intelligentRouting ? 'active' : 'inactive',
          models: ['gpt-35-turbo', 'gpt-35-turbo-16k', 'gpt-4']
        },
        platform: {
          runtime: 'Vercel Serverless',
          nodeVersion: process.version,
          environment: process.env.NODE_ENV || 'unknown'
        }
      },
      features: {
        multiTenant: true,
        rowLevelSecurity: true,
        costOptimization: checks.intelligentRouting,
        realTimeAnalytics: checks.database
      }
    };

    // Return appropriate status code
    const statusCode = allHealthy ? 200 : 503;
    return res.status(statusCode).json(healthStatus);

  } catch (error) {
    console.error('Health check error:', error);
    
    const processingTime = Date.now() - startTime;
    
    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      processingTime: `${processingTime}ms`,
      error: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'Health check failed',
      checks
    });
  }
}