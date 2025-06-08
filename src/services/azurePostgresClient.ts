import { Pool, PoolClient, QueryResult } from 'pg';

export interface TenantContext {
  tenantId: string;
  userId?: string;
  role?: string;
}

export interface QueryOptions {
  tenant?: TenantContext;
  timeout?: number;
  maxRetries?: number;
}

export interface AzurePostgresConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  connectionTimeoutMillis?: number;
  idleTimeoutMillis?: number;
  max?: number;
}

class AzurePostgresClient {
  private pool: Pool;
  private config: AzurePostgresConfig;

  constructor(config: AzurePostgresConfig) {
    this.config = config;
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: config.connectionTimeoutMillis || 30000,
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      max: config.max || 20,
    });

    this.pool.on('error', err => {
      console.error('Azure PostgreSQL pool error:', err);
    });
  }

  /**
   * Execute a query with tenant isolation using Row Level Security (RLS)
   */
  async query<T = any>(
    sql: string,
    params: any[] = [],
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const client = await this.pool.connect();

    try {
      // Set tenant context for RLS if provided
      if (options.tenant) {
        await this.setTenantContext(client, options.tenant);
      }

      // Execute the main query
      const result = await client.query<T>(sql, params);
      return result;
    } finally {
      // Reset session context
      if (options.tenant) {
        await this.resetTenantContext(client);
      }
      client.release();
    }
  }

  /**
   * Execute SQL with intelligent retries and error handling
   */
  async executeSql<T = any>(
    sql: string,
    params: any[] = [],
    options: QueryOptions = {}
  ): Promise<T[]> {
    const maxRetries = options.maxRetries || 3;
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.query<T>(sql, params, options);
        return result.rows;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Query attempt ${attempt} failed:`, error);

        if (attempt < maxRetries) {
          await this.delay(Math.pow(2, attempt) * 100); // Exponential backoff
        }
      }
    }

    throw new Error(`Query failed after ${maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * Execute a stored procedure/function call
   */
  async rpc<T = any>(
    functionName: string,
    params: Record<string, any> = {},
    options: QueryOptions = {}
  ): Promise<{ data: T[] | null; error: Error | null }> {
    try {
      // Convert params to positional array for SQL function call
      const paramKeys = Object.keys(params);
      const paramValues = Object.values(params);
      const paramPlaceholders = paramKeys.map((_, i) => `$${i + 1}`).join(', ');

      const sql = `SELECT * FROM ${functionName}(${paramPlaceholders})`;
      const rows = await this.executeSql<T>(sql, paramValues, options);

      return { data: rows, error: null };
    } catch (error) {
      console.error(`RPC call to ${functionName} failed:`, error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Set tenant context for Row Level Security (RLS)
   */
  private async setTenantContext(client: PoolClient, tenant: TenantContext): Promise<void> {
    try {
      // Set current tenant_id for RLS policies
      await client.query('SET app.current_tenant_id = $1', [tenant.tenantId]);

      // Set additional context if provided
      if (tenant.userId) {
        await client.query('SET app.current_user_id = $1', [tenant.userId]);
      }

      if (tenant.role) {
        await client.query('SET app.current_role = $1', [tenant.role]);
      }
    } catch (error) {
      console.error('Failed to set tenant context:', error);
      throw new Error(`Tenant context setup failed: ${error.message}`);
    }
  }

  /**
   * Reset tenant context after query execution
   */
  private async resetTenantContext(client: PoolClient): Promise<void> {
    try {
      await client.query('RESET app.current_tenant_id');
      await client.query('RESET app.current_user_id');
      await client.query('RESET app.current_role');
    } catch (error) {
      // Non-fatal error, just log it
      console.warn('Failed to reset tenant context:', error);
    }
  }

  /**
   * Test database connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as test');
      return result.rows.length === 1;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * Get database health information
   */
  async getHealthInfo(): Promise<{
    connected: boolean;
    totalConnections: number;
    activeConnections: number;
    version: string;
  }> {
    try {
      const [connectionInfo, versionInfo] = await Promise.all([
        this.query(`
          SELECT 
            count(*) as total_connections,
            count(*) FILTER (WHERE state = 'active') as active_connections
          FROM pg_stat_activity
        `),
        this.query('SELECT version() as version'),
      ]);

      return {
        connected: true,
        totalConnections: parseInt(connectionInfo.rows[0].total_connections),
        activeConnections: parseInt(connectionInfo.rows[0].active_connections),
        version: versionInfo.rows[0].version,
      };
    } catch (error) {
      return {
        connected: false,
        totalConnections: 0,
        activeConnections: 0,
        version: 'Unknown',
      };
    }
  }

  /**
   * Close the connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Default client instance
let azurePostgresClient: AzurePostgresClient | null = null;

/**
 * Initialize the Azure PostgreSQL client with configuration
 */
export function initializeAzurePostgres(config: AzurePostgresConfig): AzurePostgresClient {
  azurePostgresClient = new AzurePostgresClient(config);
  return azurePostgresClient;
}

/**
 * Get the initialized Azure PostgreSQL client
 */
export function getAzurePostgresClient(): AzurePostgresClient {
  if (!azurePostgresClient) {
    throw new Error(
      'Azure PostgreSQL client not initialized. Call initializeAzurePostgres() first.'
    );
  }
  return azurePostgresClient;
}

/**
 * Create client from environment variables
 */
export function createAzurePostgresFromEnv(): AzurePostgresClient {
  const config: AzurePostgresConfig = {
    host: process.env.AZURE_POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.AZURE_POSTGRES_PORT || '5432'),
    database: process.env.AZURE_POSTGRES_DATABASE || 'retail_insights',
    username: process.env.AZURE_POSTGRES_USERNAME || 'postgres',
    password: process.env.AZURE_POSTGRES_PASSWORD || '',
    ssl: process.env.AZURE_POSTGRES_SSL === 'true',
    connectionTimeoutMillis: parseInt(process.env.AZURE_POSTGRES_TIMEOUT || '30000'),
    max: parseInt(process.env.AZURE_POSTGRES_MAX_CONNECTIONS || '20'),
  };

  return initializeAzurePostgres(config);
}

export { AzurePostgresClient };
