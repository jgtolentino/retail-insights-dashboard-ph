import { CallToolRequest, McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { 
  GetTokenSchema,
  QueryDatabaseSchema,
  GetSalesDataSchema,
  GetInventoryStatusSchema,
  GetCustomerInsightsSchema
} from '../schemas/tools.js';
import { SupabaseService } from '../services/supabase.js';
import { logDebug, logError } from '../utils/logger.js';

// Initialize services
const supabase = new SupabaseService();

export async function handleToolCall(request: CallToolRequest) {
  const { name, arguments: args } = request.params;
  
  logDebug('Tool call received', { tool: name, args });

  try {
    switch (name) {
      case 'get_mcp_token': {
        const validatedArgs = GetTokenSchema.parse(args);
        const result = await supabase.getMcpToken(validatedArgs.project_ref);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2),
          }],
        };
      }

      case 'query_database': {
        const validatedArgs = QueryDatabaseSchema.parse(args);
        const result = await supabase.queryTable(
          validatedArgs.table,
          validatedArgs.filters,
          validatedArgs.limit
        );
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2),
          }],
        };
      }

      case 'get_sales_data': {
        const validatedArgs = GetSalesDataSchema.parse(args);
        const result = await supabase.getSalesData(
          validatedArgs.date_range,
          validatedArgs.store_id,
          validatedArgs.category
        );
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2),
          }],
        };
      }

      case 'get_inventory_status': {
        const validatedArgs = GetInventoryStatusSchema.parse(args);
        const result = await supabase.getInventoryStatus(
          validatedArgs.store_id,
          validatedArgs.low_stock_only
        );
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2),
          }],
        };
      }

      case 'get_customer_insights': {
        const validatedArgs = GetCustomerInsightsSchema.parse(args);
        const result = await supabase.getCustomerInsights(
          validatedArgs.segment,
          validatedArgs.metric
        );
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2),
          }],
        };
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error) {
    logError('Tool execution failed', {
      tool: name,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    if (error instanceof McpError) {
      throw error;
    }

    // Handle Zod validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid parameters: ${error.message}`
      );
    }

    throw new McpError(
      ErrorCode.InternalError,
      error instanceof Error ? error.message : 'Internal server error'
    );
  }
}