import { configManager } from '../config';

interface DatabricsGenieOptions {
  maxTokens?: number;
  temperature?: number;
  tools?: any[];
  systemPrompt?: string;
}

interface GenieResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface ToolResult {
  type: string;
  data: any;
  success: boolean;
  error?: string;
}

class DatabricksGenieClient {
  private baseUrl: string = '';
  private token: string = '';
  private spaceId: string = '';

  private async initialize() {
    if (this.baseUrl) return; // Already initialized

    const config = await configManager.getConfig();
    
    // Use Azure Key Vault or environment variables
    this.baseUrl = process.env.DATABRICKS_HOST || config.databricks?.host || '';
    this.token = process.env.DATABRICKS_TOKEN || config.databricks?.token || '';
    this.spaceId = process.env.DATABRICKS_GENIE_SPACE_ID || config.databricks?.genieSpaceId || '';

    if (!this.baseUrl || !this.token) {
      throw new Error('Databricks configuration missing. Please set DATABRICKS_HOST and DATABRICKS_TOKEN');
    }
  }

  // Enhanced tool execution matching StockBot architecture
  private async executeRetailTools(userQuery: string, tools: any[]): Promise<ToolResult[]> {
    if (!tools || tools.length === 0) {
      return [];
    }

    const results: ToolResult[] = [];
    
    // Analyze user intent to determine which tools to call
    const intent = this.analyzeUserIntent(userQuery);
    
    try {
      // Execute relevant tools based on user intent
      for (const toolName of intent.suggestedTools) {
        const tool = tools.find(t => t.name === toolName);
        if (tool) {
          console.log(`Executing retail tool: ${toolName}`);
          
          try {
            const toolResult = await tool.execute(intent.parameters[toolName] || {});
            results.push({
              type: toolName,
              data: toolResult,
              success: true
            });
          } catch (error) {
            console.error(`Tool ${toolName} failed:`, error);
            results.push({
              type: toolName,
              data: null,
              success: false,
              error: (error as Error).message
            });
          }
        }
      }
    } catch (error) {
      console.error('Tool execution error:', error);
    }

    return results;
  }

  // Analyze user intent to determine which retail tools to use
  private analyzeUserIntent(query: string): { suggestedTools: string[], parameters: Record<string, any> } {
    const lowerQuery = query.toLowerCase();
    const suggestedTools: string[] = [];
    const parameters: Record<string, any> = {};

    // Sales metrics patterns
    if (lowerQuery.includes('sales') || lowerQuery.includes('revenue') || lowerQuery.includes('performance')) {
      suggestedTools.push('getSalesMetrics');
      parameters.getSalesMetrics = {
        metric: lowerQuery.includes('revenue') ? 'revenue' : 
                lowerQuery.includes('transaction') ? 'transactions' : 'revenue',
        dateRange: lowerQuery.includes('today') ? 'today' :
                   lowerQuery.includes('week') ? 'week' :
                   lowerQuery.includes('month') ? 'month' : 'week'
      };
    }

    // Brand performance patterns
    if (lowerQuery.includes('brand') || lowerQuery.includes('competitor') || lowerQuery.includes('tbwa')) {
      suggestedTools.push('getBrandPerformance');
      parameters.getBrandPerformance = {
        tbwaOnly: lowerQuery.includes('tbwa only') || lowerQuery.includes('just tbwa'),
        period: lowerQuery.includes('quarter') ? 'quarter' :
                lowerQuery.includes('month') ? 'month' : 'month'
      };
    }

    // Regional analysis patterns
    if (lowerQuery.includes('region') || lowerQuery.includes('ncr') || 
        lowerQuery.includes('luzon') || lowerQuery.includes('visayas') || 
        lowerQuery.includes('mindanao')) {
      suggestedTools.push('getRegionalAnalysis');
      parameters.getRegionalAnalysis = {
        metric: lowerQuery.includes('growth') ? 'growth' : 'revenue'
      };
    }

    // Anomaly detection patterns
    if (lowerQuery.includes('anomal') || lowerQuery.includes('unusual') || 
        lowerQuery.includes('spike') || lowerQuery.includes('drop') ||
        lowerQuery.includes('alert')) {
      suggestedTools.push('detectAnomalies');
      parameters.detectAnomalies = {
        sensitivity: lowerQuery.includes('high') ? 'high' :
                    lowerQuery.includes('low') ? 'low' : 'medium'
      };
    }

    // If no specific tools detected, default to sales metrics
    if (suggestedTools.length === 0) {
      suggestedTools.push('getSalesMetrics');
      parameters.getSalesMetrics = { metric: 'revenue', dateRange: 'week' };
    }

    return { suggestedTools, parameters };
  }

  async createGenieCompletion(
    messages: any[],
    options: DatabricsGenieOptions = {}
  ): Promise<Response> {
    try {
      await this.initialize();

      const {
        maxTokens = 1500,
        temperature = 0.3,
        tools = [],
        systemPrompt = RETAIL_GENIE_SYSTEM_PROMPT
      } = options;

      // Convert chat messages to Databricks Genie format
      const userMessage = messages[messages.length - 1]?.content || '';
      
      // Execute retail tools first to get real data
      const toolResults = await this.executeRetailTools(userMessage, tools);
      
      // Enhanced prompt with tool results and Philippine retail context
      let enhancedPrompt = `${systemPrompt}

User Query: ${userMessage}

`;

      if (toolResults.length > 0) {
        enhancedPrompt += `Real-time Data Analysis Results:
${toolResults.map(result => {
  if (result.success) {
    return `${result.type.toUpperCase()}: ${JSON.stringify(result.data, null, 2)}`;
  } else {
    return `${result.type.toUpperCase()}: Error - ${result.error}`;
  }
}).join('\n\n')}

Based on this real retail data from our Philippine market database, `;
      }

      enhancedPrompt += `provide insights specific to:
- TBWA client brands vs competitors
- Regional performance (NCR, Luzon, Visayas, Mindanao)
- Sari-sari store dynamics
- Filipino consumer behavior
- Currency in Philippine Peso (₱)

Please analyze the available retail data and provide actionable insights.`;

      // Call Databricks Genie API
      const genieUrl = `${this.baseUrl}/api/2.0/genie/spaces/${this.spaceId}/start-conversation`;
      
      const response = await fetch(genieUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: enhancedPrompt,
          attachments: [],
        }),
      });

      if (!response.ok) {
        throw new Error(`Databricks Genie API error: ${response.status} ${response.statusText}`);
      }

      const genieData = await response.json();
      
      // Convert Databricks response to streaming format for compatibility
      return new Response(
        new ReadableStream({
          start(controller) {
            try {
              let content = genieData.message?.content || 'Unable to process request at this time.';
              
              // Add tool results summary if available
              if (toolResults.length > 0) {
                const successfulResults = toolResults.filter(r => r.success);
                if (successfulResults.length > 0) {
                  content = `📊 **Live Data Analysis Complete**

${content}

---
*Analysis powered by real-time Philippine retail data from ${successfulResults.length} data source(s)*`;
                }
              }
              
              // Format as streaming chunks for consistent API response
              const chunks = content.split(' ');
              let index = 0;

              const sendChunk = () => {
                if (index < chunks.length) {
                  const chunk = {
                    id: `genie-${Date.now()}-${index}`,
                    object: 'chat.completion.chunk',
                    created: Math.floor(Date.now() / 1000),
                    model: 'databricks-genie-retail',
                    choices: [{
                      index: 0,
                      delta: {
                        content: index === 0 ? chunks[index] : ` ${chunks[index]}`
                      },
                      finish_reason: null
                    }]
                  };
                  
                  const data = `data: ${JSON.stringify(chunk)}\n\n`;
                  controller.enqueue(new TextEncoder().encode(data));
                  
                  index++;
                  setTimeout(sendChunk, 50); // Simulate streaming
                } else {
                  // Send final chunk
                  const finalChunk = {
                    id: `genie-${Date.now()}-final`,
                    object: 'chat.completion.chunk',
                    created: Math.floor(Date.now() / 1000),
                    model: 'databricks-genie-retail',
                    choices: [{
                      index: 0,
                      delta: {},
                      finish_reason: 'stop'
                    }]
                  };
                  
                  const data = `data: ${JSON.stringify(finalChunk)}\n\n`;
                  controller.enqueue(new TextEncoder().encode(data));
                  controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                  controller.close();
                }
              };

              sendChunk();
            } catch (error) {
              console.error('Streaming error:', error);
              controller.error(error);
            }
          }
        }),
        {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
          },
        }
      );

    } catch (error) {
      console.error('Databricks Genie Error:', error);
      throw error;
    }
  }

  async askDirectQuestion(question: string): Promise<GenieResponse> {
    try {
      await this.initialize();

      const genieUrl = `${this.baseUrl}/api/2.0/genie/spaces/${this.spaceId}/start-conversation`;
      
      const response = await fetch(genieUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: `${RETAIL_GENIE_SYSTEM_PROMPT}

Question: ${question}`,
          attachments: [],
        }),
      });

      if (!response.ok) {
        throw new Error(`Databricks Genie API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        content: data.message?.content || 'No response available',
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      };
    } catch (error) {
      console.error('Direct question error:', error);
      return {
        content: 'Unable to process question at this time. Please check your Databricks connection.',
      };
    }
  }
}

// Philippine Retail-focused system prompt for Databricks Genie
const RETAIL_GENIE_SYSTEM_PROMPT = `You are a Databricks AI Genie specialized in Philippine retail analytics. You have access to comprehensive retail transaction data and should provide insights specifically for TBWA clients operating in the Philippines.

**Your Role:**
- Retail Analytics Expert for Philippine Market
- TBWA Client Performance Specialist
- Data-driven insights provider using Databricks Delta Lake

**Context & Expertise:**
- Philippine retail landscape (NCR, Luzon, Visayas, Mindanao)
- TBWA client brands vs competitor analysis
- Sari-sari store dynamics and modern retail
- Filipino consumer behavior patterns
- Regional economic differences
- Seasonal trends (Christmas season, summer, rainy season)
- Payday cycles and shopping patterns

**Data Sources Available:**
- Real-time transaction data from major retailers
- Sari-sari store sales data
- Brand performance metrics
- Regional sales distribution
- Product category performance
- Customer demographics

**Response Guidelines:**
1. Always use Philippine Peso (₱) for currency
2. Reference specific Philippine regions and cities
3. Provide actionable business recommendations
4. Include confidence levels for insights
5. Suggest next steps for implementation
6. Consider cultural and economic factors

**Sample Response Style:**
"Based on the transaction data, NCR shows ₱2.1M revenue this week, up 15% from last week. Your TBWA client brand Del Monte is outperforming competitors by 23% in the beverages category. I recommend focusing inventory on Metro Manila stores during this growth period."

Always query the available retail data to provide specific, actionable insights for Philippine market conditions.`;

// Export singleton instance
export const databricksGenieClient = new DatabricksGenieClient();

// Export the completion function for API routes
export async function createGenieCompletion(
  messages: any[],
  options: DatabricsGenieOptions = {}
): Promise<Response> {
  return databricksGenieClient.createGenieCompletion(messages, options);
}

// Export types
export type { DatabricsGenieOptions, GenieResponse };