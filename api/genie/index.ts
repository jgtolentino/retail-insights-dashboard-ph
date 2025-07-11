import { VercelRequest, VercelResponse } from '@vercel/node';
import { createAzurePostgresFromEnv, TenantContext } from '../../src/services/azurePostgresClient';
import { databricksGenie } from '../../src/services/databricksGenie';

// Initialize Azure PostgreSQL client
let postgresClient: ReturnType<typeof createAzurePostgresFromEnv> | null = null;

function getPostgresClient() {
  if (!postgresClient) {
    postgresClient = createAzurePostgresFromEnv();
  }
  return postgresClient;
}

interface GenieRequest {
  query: string;
  tenant_id?: string;
  user_id?: string;
  role?: string;
}

/**
 * Vercel serverless function for Databricks AI Genie
 * Supports multi-tenant queries with Row Level Security (RLS)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-tenant-id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize database connection
    const client = getPostgresClient();
    
    // Test connection
    const isConnected = await client.testConnection();
    if (!isConnected) {
      console.error('Database connection failed');
      return res.status(503).json({ 
        error: 'Database unavailable',
        message: 'Unable to connect to Azure PostgreSQL'
      });
    }

    // Parse request body
    const { query, tenant_id, user_id, role }: GenieRequest = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        error: 'Bad request',
        message: 'Query parameter is required and must be a string'
      });
    }

    // Extract tenant context from headers or body
    const tenantId = tenant_id || req.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Tenant ID is required (provide via x-tenant-id header or tenant_id in body)'
      });
    }

    // Build tenant context for RLS
    const tenantContext: TenantContext = {
      tenantId,
      userId: user_id || req.headers['x-user-id'] as string,
      role: role || req.headers['x-user-role'] as string || 'user'
    };

    console.log(`Processing Genie query for tenant: ${tenantId}, query: "${query.substring(0, 100)}..."`);

    // Process the query using Databricks AI Genie
    const startTime = Date.now();
    const response = await databricksGenie.askGenie(query, tenantContext);
    const processingTime = Date.now() - startTime;

    // Add processing metadata
    const enrichedResponse = {
      ...response,
      processingTime,
      timestamp: new Date().toISOString(),
      tenantId,
      version: '1.0.0'
    };

    console.log(`Genie query completed in ${processingTime}ms for tenant: ${tenantId}`);

    return res.status(200).json({
      success: true,
      data: enrichedResponse
    });

  } catch (error) {
    console.error('Genie API error:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'An error occurred while processing your query',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Health check endpoint for Genie API
 */
export async function healthCheck(req: VercelRequest, res: VercelResponse) {
  try {
    const client = getPostgresClient();
    const healthInfo = await client.getHealthInfo();
    
    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: healthInfo,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        runtime: 'vercel'
      }
    };

    return res.status(200).json(status);
  } catch (error) {
    return res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}