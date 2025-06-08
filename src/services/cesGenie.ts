/**
 * CES Campaign Analytics Genie Implementation
 * Specialized AI analytics for digital marketing campaigns
 * Uses Azure PostgreSQL + intelligent routing for cost optimization
 */

import { getAzurePostgresClient, TenantContext } from './azurePostgresClient';
import { intelligentRouter, TaskComplexity } from './intelligentModelRouter';

export interface CESQuery {
  id: string;
  query: string;
  timestamp: Date;
  response?: CESResponse;
  status: 'pending' | 'processing' | 'completed' | 'error';
  campaign_id?: string;
  channel?: string;
}

export interface CESResponse {
  answer: string;
  suggestedQueries: string[];
  chartType?: 'bar' | 'line' | 'pie' | 'table' | 'funnel' | 'trend';
  data?: Record<string, unknown>[];
  sql?: string;
  confidence: number;
  executionTime?: number;
  rowCount?: number;
  complexity?: TaskComplexity;
  modelUsed?: string;
  estimatedCost?: number;
  tenantId?: string;
  cesScore?: number;
}

export interface CESContext {
  tables: string[];
  columns: Record<string, string[]>;
  recentQueries: CESQuery[];
  channels: string[];
  metrics: string[];
}

class CESCampaignGenie {
  private context: CESContext;

  constructor() {
    this.context = {
      tables: ['campaign_events', 'campaign_metrics_daily', 'campaign_performance'],
      columns: {
        campaign_events: [
          'tenant_id',
          'campaign_id',
          'event_time',
          'event_type',
          'channel',
          'creative_id',
          'spend',
          'impressions',
          'clicks',
          'conversions',
          'raw_payload',
        ],
        campaign_metrics_daily: [
          'tenant_id',
          'campaign_id',
          'event_date',
          'channel',
          'spend',
          'impressions',
          'clicks',
          'conversions',
          'ces_score',
          'ctr',
          'cpc',
          'conversion_rate',
        ],
        campaign_performance: [
          'tenant_id',
          'campaign_id',
          'campaign_name',
          'channel',
          'status',
          'total_spend',
          'total_impressions',
          'total_clicks',
          'total_conversions',
          'avg_ces_score',
          'created_at',
          'updated_at',
        ],
      },
      recentQueries: [],
      channels: ['facebook', 'tiktok', 'x', 'google', 'linkedin', 'youtube'],
      metrics: [
        'spend',
        'impressions',
        'clicks',
        'conversions',
        'ces_score',
        'ctr',
        'cpc',
        'conversion_rate',
      ],
    };
  }

  /**
   * Process natural language query for CES campaign analytics
   */
  async askCESGenie(query: string, tenantContext?: TenantContext): Promise<CESResponse> {
    const startTime = Date.now();

    try {
      // Step 1: Generate SQL for campaign analytics
      const sql = await this.generateCampaignSQL(query);

      if (!sql) {
        return this.generateTextualResponse(query, tenantContext?.tenantId);
      }

      // Step 2: Execute SQL against Azure PostgreSQL with tenant isolation
      let data, error;

      try {
        const postgresClient = getAzurePostgresClient();

        // Try execute_sql_simple function first
        try {
          const result = await postgresClient.rpc(
            'execute_sql_simple',
            { sql_query: sql },
            {
              tenant: tenantContext,
            }
          );
          data = result.data;
          error = result.error;
        } catch (funcError) {
          // Fallback to direct SQL execution
          console.warn('execute_sql_simple function not available, executing SQL directly');
          const rows = await postgresClient.executeSql(sql, [], { tenant: tenantContext });
          data = rows;
          error = null;
        }
      } catch (dbError) {
        console.warn('Database execution failed, falling back to textual response:', dbError);
        return this.generateTextualResponseWithSQL(query, sql, tenantContext?.tenantId);
      }

      if (error || !data) {
        console.warn('SQL execution failed, falling back to textual response:', error);
        return this.generateTextualResponseWithSQL(query, sql, tenantContext?.tenantId);
      }

      // Step 3: Generate campaign-focused explanation
      const explanation = await this.explainCampaignResults(data, query);

      // Step 4: Determine best chart type for campaign data
      const chartType = this.suggestCampaignChartType(data, query);

      // Step 5: Calculate CES score if applicable
      const cesScore = this.calculateCESScore(data);

      const executionTime = Date.now() - startTime;
      const complexity = intelligentRouter.analyzeComplexity(query);

      return {
        answer: explanation,
        suggestedQueries: this.getCampaignSuggestions(query),
        chartType,
        data,
        sql,
        confidence: 0.9,
        executionTime,
        rowCount: data.length,
        complexity,
        modelUsed: complexity.suggestedModel,
        tenantId: tenantContext?.tenantId,
        cesScore,
      };
    } catch (error) {
      console.error('CES Campaign Genie Error:', error);
      return {
        answer:
          'I encountered an error analyzing your campaign data. Please try rephrasing your question.',
        suggestedQueries: this.getDefaultCampaignSuggestions(),
        confidence: 0,
        executionTime: Date.now() - startTime,
        tenantId: tenantContext?.tenantId,
      };
    }
  }

  /**
   * Generate textual response when SQL execution isn't possible
   */
  private async generateTextualResponse(query: string, tenantId?: string): Promise<CESResponse> {
    try {
      const systemPrompt = this.buildCampaignSystemPrompt();
      const userPrompt = this.buildCampaignUserPrompt(query);

      const result = await intelligentRouter.routeQuery(query, systemPrompt, userPrompt);
      const parsedResponse = this.parseCESResponse(result.response, query);

      return {
        ...parsedResponse,
        complexity: result.complexity,
        modelUsed: result.complexity.suggestedModel,
        estimatedCost: result.estimatedCost,
        tenantId,
      };
    } catch (error) {
      console.error('Textual response generation error:', error);
      return {
        answer:
          'I encountered an error processing your campaign query. Please try rephrasing your question.',
        suggestedQueries: this.getDefaultCampaignSuggestions(),
        confidence: 0,
        tenantId,
      };
    }
  }

  /**
   * Generate response with SQL but no data (when execution fails)
   */
  private async generateTextualResponseWithSQL(
    query: string,
    sql: string,
    tenantId?: string
  ): Promise<CESResponse> {
    const prompt = `The user asked about campaign analytics: "${query}"
I generated this SQL: ${sql}

However, the SQL couldn't be executed. Please provide a helpful response explaining what the campaign analysis would show and suggest alternatives.`;

    try {
      const complexity = intelligentRouter.analyzeComplexity(query);
      const result = await intelligentRouter.routeQuery(
        query,
        this.buildCampaignSystemPrompt(),
        prompt
      );

      return {
        answer: result.response || "I generated campaign SQL but couldn't execute it.",
        sql,
        suggestedQueries: this.getCampaignSuggestions(query),
        confidence: 0.6,
        tenantId,
        complexity: result.complexity,
        modelUsed: result.complexity.suggestedModel,
        estimatedCost: result.estimatedCost,
      };
    } catch (error) {
      return {
        answer:
          "I generated campaign SQL but couldn't execute it. Please try rephrasing your question.",
        sql,
        suggestedQueries: this.getDefaultCampaignSuggestions(),
        confidence: 0.4,
        tenantId,
      };
    }
  }

  /**
   * Build system prompt for CES campaign analytics
   */
  private buildCampaignSystemPrompt(): string {
    return `You are the CES Campaign Analytics Genie, an expert in digital marketing campaign performance analysis.

AVAILABLE TABLES & COLUMNS:
${Object.entries(this.context.columns)
  .map(([table, cols]) => `- ${table}: ${cols.join(', ')}`)
  .join('\n')}

CHANNELS: ${this.context.channels.join(', ')}
KEY METRICS: ${this.context.metrics.join(', ')}

CES SCORE FORMULA:
CES Score = (conversions / impressions) × 1000

RESPONSE FORMAT:
Always respond in this JSON format:
{
  "answer": "Clear, conversational answer about campaign performance",
  "sql": "SELECT statement for campaign analytics (if applicable)",
  "chartType": "bar|line|pie|table|funnel|trend (recommend best visualization)",
  "suggestedQueries": ["3 related campaign questions"],
  "confidence": 0.95,
  "cesScore": 12.5
}

RULES:
1. Always filter by tenant_id for data isolation
2. Focus on campaign performance optimization
3. Provide actionable insights for CES improvement
4. Compare channels, campaigns, or time periods
5. Calculate CES scores when relevant
6. Use proper PostgreSQL syntax
7. Consider cost-per-conversion and ROAS insights`;
  }

  /**
   * Build user prompt with campaign context
   */
  private buildCampaignUserPrompt(query: string): string {
    const recentContext = this.context.recentQueries
      .slice(-3)
      .map(q => `Q: ${q.query}\nA: ${q.response?.answer || 'No response'}`)
      .join('\n\n');

    return `RECENT CAMPAIGN ANALYSIS:
${recentContext}

CURRENT QUESTION: ${query}

Please analyze this campaign performance question and provide insights focused on CES optimization.`;
  }

  /**
   * Parse CES response into structured format
   */
  private parseCESResponse(response: string, originalQuery: string): CESResponse {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          answer: parsed.answer || response,
          sql: parsed.sql,
          chartType: parsed.chartType,
          suggestedQueries: parsed.suggestedQueries || this.getCampaignSuggestions(originalQuery),
          confidence: parsed.confidence || 0.8,
          cesScore: parsed.cesScore,
        };
      }
    } catch (error) {
      console.warn('Failed to parse JSON response, using text response');
    }

    return {
      answer: response,
      suggestedQueries: this.getCampaignSuggestions(originalQuery),
      confidence: 0.7,
    };
  }

  /**
   * Generate SQL for campaign analytics
   */
  async generateCampaignSQL(query: string): Promise<string> {
    const systemPrompt = `You are an expert SQL generator for campaign analytics. Convert natural language to PostgreSQL SQL.

AVAILABLE TABLES: ${Object.keys(this.context.columns).join(', ')}
COLUMNS: ${Object.entries(this.context.columns)
      .map(([table, cols]) => `${table}: ${cols.join(', ')}`)
      .join('\n')}

IMPORTANT RULES:
- ALWAYS include tenant_id filter: WHERE tenant_id = current_setting('app.current_tenant_id')::INT
- Return ONLY the SQL statement, no explanations
- Use proper PostgreSQL syntax
- Focus on campaign performance metrics
- Calculate CES score: (conversions / NULLIF(impressions, 0)) * 1000`;

    const userPrompt = `Convert to campaign analytics SQL: ${query}`;

    try {
      const result = await intelligentRouter.routeQuery(query, systemPrompt, userPrompt);
      return result.response.trim();
    } catch (error) {
      console.error('Campaign SQL generation error:', error);
      return '';
    }
  }

  /**
   * Explain campaign results in natural language
   */
  async explainCampaignResults(
    data: Record<string, unknown>[],
    originalQuery: string
  ): Promise<string> {
    const dataPreview = JSON.stringify(data.slice(0, 5), null, 2);

    const systemPrompt = `You are a campaign analytics expert. Explain campaign performance results in clear, actionable language for marketing teams.`;

    const userPrompt = `Explain these campaign analytics results:

ORIGINAL QUESTION: ${originalQuery}
RESULTS (first 5 rows): ${dataPreview}
TOTAL ROWS: ${data.length}

Provide clear insights focusing on campaign optimization and CES improvement opportunities.`;

    try {
      const result = await intelligentRouter.routeQuery(originalQuery, systemPrompt, userPrompt);
      return result.response || 'Here are your campaign analytics results.';
    } catch (error) {
      console.error('Campaign explanation error:', error);
      return 'Here are your campaign performance results.';
    }
  }

  /**
   * Suggest best chart type for campaign data
   */
  private suggestCampaignChartType(
    data: Record<string, unknown>[],
    query: string
  ): 'bar' | 'line' | 'pie' | 'table' | 'funnel' | 'trend' {
    if (!data || data.length === 0) return 'table';

    const lowerQuery = query.toLowerCase();
    const firstRow = data[0];
    const keys = Object.keys(firstRow);

    // Funnel for conversion analysis
    if (lowerQuery.includes('funnel') || lowerQuery.includes('conversion path')) {
      return 'funnel';
    }

    // Trend for time series
    if (
      lowerQuery.includes('trend') ||
      lowerQuery.includes('over time') ||
      keys.some(key => key.includes('date') || key.includes('time'))
    ) {
      return 'trend';
    }

    // Line for performance over time
    const hasDateColumn = keys.some(
      key =>
        key.toLowerCase().includes('date') ||
        key.toLowerCase().includes('time') ||
        key.toLowerCase().includes('created_at')
    );

    if (hasDateColumn) return 'line';

    // Pie for channel distribution or small categorical data
    if ((lowerQuery.includes('share') || lowerQuery.includes('distribution')) && data.length <= 6) {
      return 'pie';
    }

    // Bar for campaign comparisons
    if (
      lowerQuery.includes('compare') ||
      lowerQuery.includes('vs') ||
      keys.some(key => key.includes('campaign') || key.includes('channel'))
    ) {
      return 'bar';
    }

    return 'table';
  }

  /**
   * Calculate CES score from data
   */
  private calculateCESScore(data: Record<string, unknown>[]): number | undefined {
    if (!data || data.length === 0) return undefined;

    try {
      const totalConversions = data.reduce((sum, row) => {
        const conversions = Number(row.conversions || 0);
        return sum + conversions;
      }, 0);

      const totalImpressions = data.reduce((sum, row) => {
        const impressions = Number(row.impressions || 0);
        return sum + impressions;
      }, 0);

      if (totalImpressions > 0) {
        return Math.round((totalConversions / totalImpressions) * 1000 * 100) / 100;
      }
    } catch (error) {
      console.warn('CES score calculation failed:', error);
    }

    return undefined;
  }

  /**
   * Get contextual campaign suggestions
   */
  private getCampaignSuggestions(query: string): string[] {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('ces') || lowerQuery.includes('score')) {
      return [
        'Which campaigns have the highest CES scores?',
        'Show CES score trends over the last 30 days',
        'Compare CES scores across different channels',
      ];
    }

    if (
      lowerQuery.includes('channel') ||
      lowerQuery.includes('facebook') ||
      lowerQuery.includes('tiktok')
    ) {
      return [
        'Compare channel performance by CES score',
        'Which channel has the best cost-per-conversion?',
        'Show cross-channel campaign attribution',
      ];
    }

    if (lowerQuery.includes('conversion') || lowerQuery.includes('cpc')) {
      return [
        'Analyze conversion funnel performance',
        'Show campaigns with best conversion rates',
        'Compare cost-per-conversion by channel',
      ];
    }

    return this.getDefaultCampaignSuggestions();
  }

  /**
   * Get default campaign suggestions
   */
  private getDefaultCampaignSuggestions(): string[] {
    return [
      'What was the CES score trend for top campaigns last week?',
      'Compare cost-per-conversion of TikTok vs Meta this month',
      'Which campaigns have the highest ROI?',
      'Show channel performance breakdown by impressions',
      'Analyze conversion rate trends by campaign type',
    ];
  }

  /**
   * Get suggested queries
   */
  getSuggestedQueries(): string[] {
    return [
      'What was the CES score trend for Campaign X over the last 90 days?',
      'Compare cost-per-conversion of TikTok vs Meta last month',
      'Which campaigns have the highest conversion rates?',
      'Show me the top performing channels by CES score',
      'Analyze campaign performance across different creative types',
      'What are the conversion funnel drop-off points?',
      'Compare weekend vs weekday campaign performance',
      'Which demographics have the best CES scores?',
    ];
  }

  /**
   * Get query history
   */
  getQueryHistory(): CESQuery[] {
    return this.context.recentQueries.slice(-10);
  }
}

// Export singleton instance
export const cesGenie = new CESCampaignGenie();
export default cesGenie;
