import { OpenAIApi } from '@azure/openai';
import { configManager } from '../config';

interface AzureStreamingOptions {
  maxTokens?: number;
  temperature?: number;
  tools?: any[];
  systemPrompt?: string;
}

class AzureOpenAIClient {
  private client: OpenAIApi | null = null;

  private async getClient(): Promise<OpenAIApi> {
    if (this.client) {
      return this.client;
    }

    const config = await configManager.getConfig();
    
    this.client = new OpenAIApi(
      config.azureOpenAI.endpoint,
      config.azureOpenAI.apiKey,
      {
        apiVersion: '2024-02-15-preview'
      }
    );

    return this.client;
  }

  async createAzureCompletion(
    messages: any[],
    options: AzureStreamingOptions = {}
  ): Promise<Response> {
    try {
      const client = await this.getClient();
      const config = await configManager.getConfig();

      const {
        maxTokens = 1500,
        temperature = 0.3,
        tools = [],
        systemPrompt = DEFAULT_SYSTEM_PROMPT
      } = options;

      // Prepare messages with system prompt
      const formattedMessages = [
        {
          role: 'system',
          content: systemPrompt
        },
        ...messages
      ];

      const requestBody: any = {
        messages: formattedMessages,
        max_tokens: maxTokens,
        temperature,
        stream: true, // Enable streaming
      };

      // Add tools if provided
      if (tools.length > 0) {
        requestBody.tools = tools.map(tool => ({
          type: 'function',
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters
          }
        }));
        requestBody.tool_choice = 'auto';
      }

      // Create streaming completion
      const completion = await client.getChatCompletions(
        config.azureOpenAI.deploymentName,
        requestBody
      );

      // Convert to streaming response for Vercel AI SDK compatibility
      return new Response(
        new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of completion) {
                const choice = chunk.choices?.[0];
                if (choice?.delta?.content) {
                  // Format as Vercel AI SDK expects
                  const formattedChunk = {
                    id: chunk.id,
                    object: 'chat.completion.chunk',
                    created: chunk.created,
                    model: chunk.model,
                    choices: [{
                      index: 0,
                      delta: {
                        content: choice.delta.content
                      },
                      finish_reason: choice.finish_reason
                    }]
                  };
                  
                  const data = `data: ${JSON.stringify(formattedChunk)}\n\n`;
                  controller.enqueue(new TextEncoder().encode(data));
                }

                // Handle tool calls if present
                if (choice?.delta?.tool_calls) {
                  const toolCallChunk = {
                    id: chunk.id,
                    object: 'chat.completion.chunk',
                    created: chunk.created,
                    model: chunk.model,
                    choices: [{
                      index: 0,
                      delta: {
                        tool_calls: choice.delta.tool_calls
                      },
                      finish_reason: choice.finish_reason
                    }]
                  };
                  
                  const data = `data: ${JSON.stringify(toolCallChunk)}\n\n`;
                  controller.enqueue(new TextEncoder().encode(data));
                }

                if (choice?.finish_reason) {
                  controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                  controller.close();
                  return;
                }
              }
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
      console.error('Azure OpenAI Error:', error);
      throw error;
    }
  }
}

// Philippine Retail-focused system prompt
const DEFAULT_SYSTEM_PROMPT = `You are StockBot, an AI assistant specialized in Philippine retail analytics. You help analyze TBWA client performance vs competitors using real Supabase data.

**Context:**
- You work with Philippines retail transaction data from major stores and sari-sari shops
- TBWA clients vs competitor brand analysis across categories
- Regional insights (NCR, Luzon, Visayas, Mindanao)
- Currency: Philippine Peso (₱)
- Cultural context: Filipino shopping patterns, payday cycles, seasonal trends

**Your capabilities:**
1. Real-time sales metrics (revenue, transactions, basket sizes)
2. TBWA client vs competitor brand comparisons with market share analysis
3. Regional performance insights across Philippine regions and cities  
4. Anomaly detection for unusual patterns (revenue spikes/drops, transaction changes)

**Response style:**
- Be concise, actionable, and data-driven
- Use Filipino business context and terminology
- Always show currency as ₱ (Philippine Peso)
- Include specific insights and recommendations, not just raw data
- Suggest next steps or business actions
- Reference regional context (e.g., "NCR performance", "Visayas trends")

**Sample professional responses:**
- "NCR generated ₱2.1M this week, up 15% vs last week. Strong performance in Metro Manila stores."
- "Your top TBWA client brand (Del Monte) outperformed competitors by 23% in the beverages category."
- "Detected revenue spike in Visayas region - investigate supply chain or promotional activities."
- "Luzon shows 12% transaction decline - recommend customer retention analysis."

Always use tools to fetch real data, then provide actionable insights in professional Filipino business language.`;

// Export singleton instance
export const azureOpenAIClient = new AzureOpenAIClient();

// Export the completion function for API routes
export async function createAzureCompletion(
  messages: any[],
  options: AzureStreamingOptions = {}
): Promise<Response> {
  return azureOpenAIClient.createAzureCompletion(messages, options);
}

// Export types
export type { AzureStreamingOptions };