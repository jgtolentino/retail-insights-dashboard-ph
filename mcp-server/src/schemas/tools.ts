import { z } from 'zod';

// Supabase token management
export const GetTokenSchema = z.object({
  project_ref: z.string().optional().describe('Supabase project reference'),
});

// Database query schema
export const QueryDatabaseSchema = z.object({
  table: z.string().describe('Table name to query'),
  filters: z.record(z.any()).optional().describe('Query filters'),
  limit: z.number().int().positive().default(100).describe('Number of records to return'),
});

// Dashboard data schemas
export const GetSalesDataSchema = z.object({
  date_range: z.object({
    start: z.string().describe('Start date (ISO format)'),
    end: z.string().describe('End date (ISO format)'),
  }).optional(),
  store_id: z.string().optional().describe('Filter by store ID'),
  category: z.string().optional().describe('Filter by product category'),
});

export const GetInventoryStatusSchema = z.object({
  store_id: z.string().optional().describe('Filter by store ID'),
  low_stock_only: z.boolean().default(false).describe('Show only low stock items'),
});

export const GetCustomerInsightsSchema = z.object({
  segment: z.enum(['all', 'new', 'returning', 'vip']).default('all'),
  metric: z.enum(['count', 'revenue', 'frequency']).default('count'),
});

// Tool definitions for MCP
export const TOOLS = [
  {
    name: 'get_mcp_token',
    description: 'Get a secure MCP token for Supabase connection',
    inputSchema: {
      type: 'object',
      properties: {
        project_ref: {
          type: 'string',
          description: 'Supabase project reference (optional, uses env var if not provided)',
        },
      },
    },
  },
  {
    name: 'query_database',
    description: 'Query retail insights database',
    inputSchema: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: 'Table name to query',
        },
        filters: {
          type: 'object',
          description: 'Query filters',
          additionalProperties: true,
        },
        limit: {
          type: 'integer',
          description: 'Number of records to return',
          default: 100,
        },
      },
      required: ['table'],
    },
  },
  {
    name: 'get_sales_data',
    description: 'Get sales data for the retail dashboard',
    inputSchema: {
      type: 'object',
      properties: {
        date_range: {
          type: 'object',
          properties: {
            start: { type: 'string', description: 'Start date (ISO format)' },
            end: { type: 'string', description: 'End date (ISO format)' },
          },
        },
        store_id: {
          type: 'string',
          description: 'Filter by store ID',
        },
        category: {
          type: 'string',
          description: 'Filter by product category',
        },
      },
    },
  },
  {
    name: 'get_inventory_status',
    description: 'Get current inventory status',
    inputSchema: {
      type: 'object',
      properties: {
        store_id: {
          type: 'string',
          description: 'Filter by store ID',
        },
        low_stock_only: {
          type: 'boolean',
          description: 'Show only low stock items',
          default: false,
        },
      },
    },
  },
  {
    name: 'get_customer_insights',
    description: 'Get customer analytics and insights',
    inputSchema: {
      type: 'object',
      properties: {
        segment: {
          type: 'string',
          enum: ['all', 'new', 'returning', 'vip'],
          description: 'Customer segment',
          default: 'all',
        },
        metric: {
          type: 'string',
          enum: ['count', 'revenue', 'frequency'],
          description: 'Metric to analyze',
          default: 'count',
        },
      },
    },
  },
] as const;
