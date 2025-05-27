import { createClient } from '@supabase/supabase-js'
import pg from 'pg'

// Azure PostgreSQL Direct Connection (for server-side)
export class AzurePostgresClient {
  private pool: pg.Pool | null = null
  
  constructor() {
    if (process.env.AZURE_PG_CONNECTION_STRING) {
      this.pool = new pg.Pool({
        connectionString: process.env.AZURE_PG_CONNECTION_STRING,
        ssl: {
          rejectUnauthorized: false
        }
      })
    }
  }

  async query(text: string, params?: any[]) {
    if (!this.pool) {
      throw new Error('Azure PostgreSQL not configured')
    }
    return this.pool.query(text, params)
  }

  async getDashboardData(days: number = 7) {
    const query = `
      WITH date_range AS (
        SELECT CURRENT_DATE - INTERVAL '${days} days' as start_date
      )
      SELECT 
        COUNT(DISTINCT t.id) as total_transactions,
        COALESCE(SUM(t.total_amount), 0) as total_revenue,
        COALESCE(AVG(t.total_amount), 0) as avg_transaction
      FROM transactions t, date_range
      WHERE t.transaction_date >= date_range.start_date
    `
    
    const result = await this.query(query)
    return result.rows[0]
  }

  async getTopBrands(days: number = 7) {
    const query = `
      WITH date_range AS (
        SELECT CURRENT_DATE - INTERVAL '${days} days' as start_date
      )
      SELECT 
        b.name,
        b.is_tbwa_client as is_tbwa,
        SUM(ti.subtotal) as sales
      FROM brands b
      JOIN products p ON p.brand_id = b.id
      JOIN transaction_items ti ON ti.product_id = p.id
      JOIN transactions t ON t.id = ti.transaction_id, date_range
      WHERE t.transaction_date >= date_range.start_date
      GROUP BY b.id, b.name, b.is_tbwa_client
      ORDER BY sales DESC
      LIMIT 10
    `
    
    const result = await this.query(query)
    return result.rows
  }

  async close() {
    if (this.pool) {
      await this.pool.end()
    }
  }
}

// Hybrid approach - use both Supabase and Azure
export class HybridDatabaseClient {
  private supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  )
  private azureClient = new AzurePostgresClient()

  // Use Supabase for real-time features
  subscribeToTransactions(callback: (payload: any) => void) {
    return this.supabase
      .channel('transactions')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'transactions' }, 
        callback
      )
      .subscribe()
  }

  // Use Azure for analytics queries
  async getAnalytics(days: number) {
    try {
      // Try Azure first for better performance
      const [dashboardData, topBrands] = await Promise.all([
        this.azureClient.getDashboardData(days),
        this.azureClient.getTopBrands(days)
      ])
      return { dashboardData, topBrands }
    } catch (error) {
      // Fallback to Supabase
      console.warn('Azure query failed, falling back to Supabase:', error)
      return this.getSupabaseAnalytics(days)
    }
  }

  private async getSupabaseAnalytics(days: number) {
    // Existing Supabase logic as fallback
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const { data: transactions } = await this.supabase
      .from('transactions')
      .select('*')
      .gte('transaction_date', startDate.toISOString())

    // ... rest of Supabase logic
    return { dashboardData: {}, topBrands: [] }
  }
}