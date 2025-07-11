import { VercelRequest, VercelResponse } from '@vercel/node';
import { createAzurePostgresFromEnv, TenantContext } from '../../src/services/azurePostgresClient';
import { cesGenie } from '../../src/services/cesGenie';

// Initialize Azure PostgreSQL client
let postgresClient: ReturnType<typeof createAzurePostgresFromEnv> | null = null;

function getPostgresClient() {
  if (!postgresClient) {
    postgresClient = createAzurePostgresFromEnv();
  }
  return postgresClient;
}

interface CESRequest {
  query: string;
  tenant_id?: string;
  user_id?: string;
  role?: string;
  campaign_id?: string;
  channel?: string;
}

/**
 * Vercel serverless function for CES Campaign Analytics Genie
 * Specialized for digital marketing campaign performance analysis
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-tenant-id, x-campaign-id, x-channel');

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
    const { query, tenant_id, user_id, role, campaign_id, channel }: CESRequest = req.body;

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
      role: role || req.headers['x-user-role'] as string || 'analyst'
    };

    console.log(`Processing CES query for tenant: ${tenantId}, query: "${query.substring(0, 100)}..."`);

    // Add campaign and channel context if provided
    const contextualQuery = buildContextualQuery(query, {
      campaign_id,
      channel: channel || req.headers['x-channel'] as string
    });

    // Process the query using CES Campaign Analytics Genie
    const startTime = Date.now();
    const response = await cesGenie.askCESGenie(contextualQuery, tenantContext);
    const processingTime = Date.now() - startTime;

    // Add processing metadata
    const enrichedResponse = {
      ...response,
      processingTime,
      timestamp: new Date().toISOString(),
      tenantId,
      version: '1.0.0',
      genie_type: 'CES_Campaign_Analytics',
      context: {
        campaign_id,
        channel,
        original_query: query,
        contextual_query: contextualQuery
      }
    };

    console.log(`CES query completed in ${processingTime}ms for tenant: ${tenantId}`);

    return res.status(200).json({
      success: true,
      data: enrichedResponse
    });

  } catch (error) {
    console.error('CES Genie API error:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'An error occurred while processing your campaign analytics query',
      timestamp: new Date().toISOString(),
      genie_type: 'CES_Campaign_Analytics'
    });
  }
}

/**
 * Build contextual query with campaign and channel information
 */
function buildContextualQuery(originalQuery: string, context: { campaign_id?: string; channel?: string }): string {
  let contextualQuery = originalQuery;

  // Add campaign context if provided
  if (context.campaign_id) {
    if (!originalQuery.toLowerCase().includes('campaign')) {
      contextualQuery = `For campaign ${context.campaign_id}: ${contextualQuery}`;
    }
  }

  // Add channel context if provided
  if (context.channel) {
    if (!originalQuery.toLowerCase().includes(context.channel.toLowerCase())) {
      contextualQuery = `For ${context.channel} channel: ${contextualQuery}`;
    }
  }

  return contextualQuery;
}

/**
 * Health check specifically for CES Campaign Analytics
 */
export async function healthCheck(req: VercelRequest, res: VercelResponse) {
  try {
    const client = getPostgresClient();
    const healthInfo = await client.getHealthInfo();
    
    // Check if campaign analytics tables exist
    const campaignTablesCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('campaign_events', 'campaign_metrics_daily', 'campaign_performance')
    `);

    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      genie_type: 'CES_Campaign_Analytics',
      database: healthInfo,
      campaign_tables: {
        available: campaignTablesCheck.rows.map(row => row.table_name),
        expected: ['campaign_events', 'campaign_metrics_daily', 'campaign_performance']
      },
      features: {
        intelligent_routing: true,
        ces_score_calculation: true,
        multi_tenant_support: true,
        channel_attribution: true
      },
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
      timestamp: new Date().toISOString(),
      genie_type: 'CES_Campaign_Analytics'
    });
  }
}