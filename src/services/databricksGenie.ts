/**
 * Databricks AI Genie Implementation
 * Custom implementation using Azure OpenAI as the LLM backend
 * Provides natural language querying for retail analytics
 */

import { AzureOpenAI } from 'openai';
import { supabase } from '@/integrations/supabase/client';

const azureOpenAI = new AzureOpenAI({
  endpoint: import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || process.env.AZURE_OPENAI_ENDPOINT,
  apiKey: import.meta.env.VITE_AZURE_OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY,
  apiVersion:
    import.meta.env.VITE_AZURE_OPENAI_API_VERSION ||
    process.env.AZURE_OPENAI_API_VERSION ||
    '2024-02-15-preview',
  dangerouslyAllowBrowser: true,
});

const deploymentName =
  import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT_NAME ||
  process.env.AZURE_OPENAI_DEPLOYMENT_NAME ||
  'gpt-4';

export interface GenieQuery {
  id: string;
  query: string;
  timestamp: Date;
  response?: GenieResponse;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

export interface GenieResponse {
  answer: string;
  suggestedQueries: string[];
  chartType?: 'bar' | 'line' | 'pie' | 'table';
  data?: any[];
  sql?: string;
  confidence: number;
  executionTime?: number;
  rowCount?: number;
}

export interface GenieContext {
  tables: string[];
  columns: Record<string, string[]>;
  recentQueries: GenieQuery[];
}

class DatabricksAIGenie {
  private context: GenieContext;

  constructor() {
    this.context = {
      tables: ['transactions', 'brands', 'products', 'customers', 'stores'],
      columns: {
        transactions: [
          'id',
          'total_amount',
          'customer_age',
          'customer_gender',
          'store_location',
          'created_at',
        ],
        brands: ['id', 'name', 'is_tbwa', 'category'],
        products: ['id', 'name', 'brand_id', 'price', 'category'],
        customers: ['id', 'age', 'gender', 'location'],
        stores: ['id', 'name', 'location', 'region'],
      },
      recentQueries: [],
    };
  }

  /**
   * Process natural language query and return structured response with real data
   */
  async askGenie(query: string): Promise<GenieResponse> {
    const startTime = Date.now();

    try {
      // Step 1: Generate SQL from natural language
      const sql = await this.generateSQL(query);

      if (!sql) {
        return this.generateTextualResponse(query);
      }

      // Step 2: Execute SQL against Supabase
      let data, error;

      try {
        // Try the simple version first
        const result = await supabase.rpc('execute_sql_simple', { sql_query: sql });
        data = result.data;
        error = result.error;

        // If simple version fails, try the original
        if (error) {
          const fallbackResult = await supabase.rpc('execute_sql', { sql_query: sql });
          data = fallbackResult.data;
          error = fallbackResult.error;
        }
      } catch (rpcError) {
        console.warn('RPC function not available, falling back to textual response:', rpcError);
        return this.generateTextualResponseWithSQL(query, sql);
      }

      if (error || !data) {
        console.warn('SQL execution failed, falling back to textual response:', error);
        return this.generateTextualResponseWithSQL(query, sql);
      }

      // Step 3: Generate explanation of results
      const explanation = await this.explainResults(data, query);

      // Step 4: Determine best chart type
      const chartType = this.suggestChartType(data);

      const executionTime = Date.now() - startTime;

      return {
        answer: explanation,
        suggestedQueries: this.getContextualSuggestions(query),
        chartType,
        data,
        sql,
        confidence: 0.9,
        executionTime,
        rowCount: data.length,
      };
    } catch (error) {
      console.error('Databricks AI Genie Error:', error);
      return {
        answer:
          'I encountered an error processing your query. Please try rephrasing your question.',
        suggestedQueries: this.getDefaultSuggestions(),
        confidence: 0,
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Generate textual response when SQL execution isn't possible
   */
  private async generateTextualResponse(query: string): Promise<GenieResponse> {
    try {
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(query);

      const completion = await azureOpenAI.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        model: deploymentName,
        temperature: 0.1,
        max_tokens: 1000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from Azure OpenAI');
      }

      return this.parseGenieResponse(response, query);
    } catch (error) {
      console.error('Textual response generation error:', error);
      return {
        answer:
          'I encountered an error processing your query. Please try rephrasing your question.',
        suggestedQueries: this.getDefaultSuggestions(),
        confidence: 0,
      };
    }
  }

  /**
   * Generate response with SQL but no data (when execution fails)
   */
  private async generateTextualResponseWithSQL(query: string, sql: string): Promise<GenieResponse> {
    const prompt = `The user asked: "${query}"
I generated this SQL: ${sql}

However, the SQL couldn't be executed. Please provide a helpful response explaining what the query would show and suggest alternatives.`;

    try {
      const completion = await azureOpenAI.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: deploymentName,
        temperature: 0.2,
        max_tokens: 500,
      });

      return {
        answer:
          completion.choices[0]?.message?.content || "I generated SQL but couldn't execute it.",
        sql,
        suggestedQueries: this.getContextualSuggestions(query),
        confidence: 0.6,
      };
    } catch (error) {
      return {
        answer: "I generated SQL but couldn't execute it. Please try rephrasing your question.",
        sql,
        suggestedQueries: this.getDefaultSuggestions(),
        confidence: 0.4,
      };
    }
  }

  /**
   * Get suggested queries based on context
   */
  getSuggestedQueries(): string[] {
    return [
      'What are the top 5 selling brands this month?',
      'Show me sales trends for the last 6 months',
      'Which age group spends the most?',
      'Compare TBWA brands vs competitors',
      "What's the average transaction value by region?",
      'Show customer demographics breakdown',
      'Which stores have the highest revenue?',
      'What products are trending this week?',
    ];
  }

  /**
   * Get query history
   */
  getQueryHistory(): GenieQuery[] {
    return this.context.recentQueries.slice(-10); // Last 10 queries
  }

  /**
   * Add query to history
   */
  private addToHistory(query: GenieQuery): void {
    this.context.recentQueries.push(query);
    if (this.context.recentQueries.length > 50) {
      this.context.recentQueries = this.context.recentQueries.slice(-50);
    }
  }

  /**
   * Build system prompt for Groq
   */
  private buildSystemPrompt(): string {
    return `You are Databricks AI Genie, an expert retail analytics assistant. You help analyze Philippine retail data and provide insights.

AVAILABLE TABLES & COLUMNS:
${Object.entries(this.context.columns)
  .map(([table, cols]) => `- ${table}: ${cols.join(', ')}`)
  .join('\n')}

RESPONSE FORMAT:
Always respond in this JSON format:
{
  "answer": "Clear, conversational answer to the user's question",
  "sql": "SELECT statement that would answer the question (if applicable)",
  "chartType": "bar|line|pie|table (recommend best visualization)",
  "suggestedQueries": ["3 related questions the user might ask next"],
  "confidence": 0.95
}

RULES:
1. Be conversational and helpful
2. Focus on Philippine retail insights
3. Suggest actionable next steps
4. If you can't answer, explain why and suggest alternatives
5. Always include relevant follow-up questions
6. Use proper SQL syntax for PostgreSQL/Supabase
7. Consider TBWA vs competitor analysis when relevant`;
  }

  /**
   * Build user prompt with context
   */
  private buildUserPrompt(query: string): string {
    const recentContext = this.context.recentQueries
      .slice(-3)
      .map(q => `Q: ${q.query}\nA: ${q.response?.answer || 'No response'}`)
      .join('\n\n');

    return `RECENT CONVERSATION:
${recentContext}

CURRENT QUESTION: ${query}

Please analyze this question about Philippine retail data and provide a comprehensive response.`;
  }

  /**
   * Parse Groq response into structured format
   */
  private parseGenieResponse(response: string, originalQuery: string): GenieResponse {
    try {
      // Try to parse as JSON first
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          answer: parsed.answer || response,
          sql: parsed.sql,
          chartType: parsed.chartType,
          suggestedQueries: parsed.suggestedQueries || this.getContextualSuggestions(originalQuery),
          confidence: parsed.confidence || 0.8,
        };
      }
    } catch (error) {
      console.warn('Failed to parse JSON response, using text response');
    }

    // Fallback to text parsing
    return {
      answer: response,
      suggestedQueries: this.getContextualSuggestions(originalQuery),
      confidence: 0.7,
    };
  }

  /**
   * Get contextual suggestions based on query
   */
  private getContextualSuggestions(query: string): string[] {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('brand')) {
      return [
        'Show me TBWA brand performance',
        'Compare brand market share',
        'What are the fastest growing brands?',
      ];
    }

    if (lowerQuery.includes('sales') || lowerQuery.includes('revenue')) {
      return [
        'Show sales by region',
        "What's driving sales growth?",
        'Compare this month vs last month',
      ];
    }

    if (lowerQuery.includes('customer') || lowerQuery.includes('demographic')) {
      return [
        'Show customer age distribution',
        'Which gender spends more?',
        'Customer retention analysis',
      ];
    }

    return this.getDefaultSuggestions();
  }

  /**
   * Get default suggestions
   */
  private getDefaultSuggestions(): string[] {
    return [
      'Show me top performing brands',
      'Analyze sales trends',
      'Customer demographics overview',
    ];
  }

  /**
   * Suggest best chart type based on data structure
   */
  private suggestChartType(data: any[]): 'bar' | 'line' | 'pie' | 'table' {
    if (!data || data.length === 0) return 'table';

    const firstRow = data[0];
    const keys = Object.keys(firstRow);

    // Check if we have time-based data
    const hasDateColumn = keys.some(
      key =>
        key.toLowerCase().includes('date') ||
        key.toLowerCase().includes('time') ||
        key.toLowerCase().includes('created_at')
    );

    if (hasDateColumn) return 'line';

    // Check if we have numeric aggregations (good for bar/pie)
    const numericColumns = keys.filter(
      key => typeof firstRow[key] === 'number' && !key.toLowerCase().includes('id')
    );

    if (numericColumns.length > 0) {
      // If we have categories with counts/sums, use bar or pie
      const categoryColumns = keys.filter(
        key => typeof firstRow[key] === 'string' && !key.toLowerCase().includes('id')
      );

      if (categoryColumns.length > 0) {
        // Use pie for small datasets (<=5 categories), bar for larger
        return data.length <= 5 ? 'pie' : 'bar';
      }

      return 'bar';
    }

    // Default to table for complex data
    return 'table';
  }

  /**
   * Generate SQL from natural language (enhanced)
   */
  async generateSQL(query: string): Promise<string> {
    const prompt = `Convert this natural language query to SQL for a Philippine retail database:

QUERY: ${query}

TABLES: ${Object.keys(this.context.columns).join(', ')}

Return only the SQL statement, no explanation.`;

    try {
      const completion = await azureOpenAI.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: deploymentName,
        temperature: 0,
        max_tokens: 300,
      });

      return completion.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
      console.error('SQL generation error:', error);
      return '';
    }
  }

  /**
   * Explain query results in natural language
   */
  async explainResults(data: any[], originalQuery: string): Promise<string> {
    const dataPreview = JSON.stringify(data.slice(0, 5), null, 2);

    const prompt = `Explain these query results in simple terms:

ORIGINAL QUESTION: ${originalQuery}
RESULTS (first 5 rows): ${dataPreview}
TOTAL ROWS: ${data.length}

Provide a clear, conversational explanation of what the data shows.`;

    try {
      const completion = await azureOpenAI.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: deploymentName,
        temperature: 0.3,
        max_tokens: 300,
      });

      return completion.choices[0]?.message?.content || 'Here are your results.';
    } catch (error) {
      console.error('Explanation error:', error);
      return 'Here are your query results.';
    }
  }
}

// Export singleton instance
export const databricksGenie = new DatabricksAIGenie();
export default databricksGenie;
