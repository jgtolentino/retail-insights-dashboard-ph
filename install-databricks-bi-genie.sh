#!/bin/bash
# install-databricks-bi-genie.sh - Enhanced Pulser Integration
set -e
echo "🧠 Installing Databricks BI Genie integration (Pulser Enhanced)..."

# 1. Install dependencies
echo "📦 Installing Databricks dependencies..."
npm install @databricks/sql

# 2. Update .env.example to remove Groq and add Databricks
echo "⚙️ Updating environment configuration..."
if [ -f ".env.example" ]; then
    # Remove Groq references
    grep -vE 'GROQ_' .env.example > .env.tmp && mv .env.tmp .env.example
fi

# Add Databricks configuration
cat >> .env.example << 'EOV'

# Databricks BI Genie Configuration
DATABRICKS_HOST=https://your-workspace.cloud.databricks.com
DATABRICKS_TOKEN=your-databricks-token
DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/your-warehouse-id
DATABRICKS_GENIE_SPACE_ID=your-genie-space-id

# Optional: Databricks Model Serving
DATABRICKS_MODEL_ENDPOINT=your-model-endpoint
EOV

# 3. Create enhanced Databricks connector
echo "🔌 Creating Databricks connector..."
mkdir -p src/lib/databricks

cat > src/lib/databricks/connector.ts << 'EOT'
import { DBSQLClient } from '@databricks/sql';
import { configManager } from '../config';

export interface DatabricksConfig {
  host: string;
  token: string;
  httpPath?: string;
  genieSpaceId?: string;
}

export class DatabricksConnector {
  private client: DBSQLClient | null = null;
  private config: DatabricksConfig | null = null;

  private async initialize() {
    if (this.config) return;

    const appConfig = await configManager.getConfig();
    
    this.config = {
      host: process.env.DATABRICKS_HOST || appConfig.databricks?.host || '',
      token: process.env.DATABRICKS_TOKEN || appConfig.databricks?.token || '',
      httpPath: process.env.DATABRICKS_HTTP_PATH || '/sql/1.0/warehouses/default',
      genieSpaceId: process.env.DATABRICKS_GENIE_SPACE_ID || appConfig.databricks?.genieSpaceId || '',
    };

    if (!this.config.host || !this.config.token) {
      throw new Error('Databricks configuration missing. Please set DATABRICKS_HOST and DATABRICKS_TOKEN');
    }

    this.client = new DBSQLClient({
      host: this.config.host,
      path: this.config.httpPath,
      token: this.config.token,
    });
  }

  async querySQL(sql: string): Promise<any[]> {
    await this.initialize();
    
    const connection = await this.client!.connect();
    const session = await connection.openSession();
    
    try {
      const operation = await session.executeStatement(sql);
      const result = await operation.fetchAll();
      await operation.close();
      return result;
    } finally {
      await session.close();
      await connection.close();
    }
  }

  async queryGenie(prompt: string): Promise<string> {
    await this.initialize();
    
    if (!this.config!.genieSpaceId) {
      throw new Error('Genie Space ID not configured');
    }

    // Call Databricks Genie API
    const response = await fetch(`${this.config!.host}/api/2.0/genie/spaces/${this.config!.genieSpaceId}/start-conversation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config!.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: prompt,
        attachments: [],
      }),
    });

    if (!response.ok) {
      throw new Error(`Databricks Genie API error: ${response.status}`);
    }

    const data = await response.json();
    return data.message?.content || 'No response available';
  }

  async getRetailInsights(query: string): Promise<any> {
    const enhancedQuery = `
      ${query}
      
      Context: This is for Philippine retail analytics. Please provide insights for:
      - TBWA client brands vs competitors
      - Regional performance (NCR, Luzon, Visayas, Mindanao)
      - Currency in Philippine Peso (₱)
      - Sari-sari store dynamics
    `;

    return await this.queryGenie(enhancedQuery);
  }
}

// Export singleton instance
export const databricksConnector = new DatabricksConnector();
EOT

# 4. Update the existing API route to use the connector
echo "🔗 Updating chat API route..."
cat > api/chat.ts << 'EOT'
import { databricksConnector } from '../src/lib/databricks/connector';

const SYSTEM_PROMPT = `You are StockBot, a Databricks AI Genie specialized in Philippine retail analytics. You have direct access to comprehensive retail data in Delta Lake and can provide real-time insights for TBWA clients.

**Your Data Access:**
- Live retail transaction data from Databricks Delta Lake
- Philippine regional sales data (NCR, Luzon, Visayas, Mindanao)
- TBWA client vs competitor brand performance
- Sari-sari store and modern retail channels
- Real-time inventory and product mix data

Use your Databricks AI Genie capabilities to provide data-driven insights from the actual retail database.`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    // Get the latest user message
    const userMessage = messages[messages.length - 1]?.content || '';
    
    // Combine system prompt with user message
    const fullPrompt = `${SYSTEM_PROMPT}

User Query: ${userMessage}`;

    // Query Databricks Genie
    const result = await databricksConnector.getRetailInsights(fullPrompt);

    // Return streaming-compatible response
    return new Response(
      new ReadableStream({
        start(controller) {
          // Simulate streaming for compatibility with existing UI
          const words = result.split(' ');
          let index = 0;

          const sendWord = () => {
            if (index < words.length) {
              const chunk = {
                id: `genie-${Date.now()}-${index}`,
                object: 'chat.completion.chunk',
                created: Math.floor(Date.now() / 1000),
                model: 'databricks-genie',
                choices: [{
                  index: 0,
                  delta: {
                    content: index === 0 ? words[index] : ` ${words[index]}`
                  },
                  finish_reason: null
                }]
              };
              
              const data = `data: ${JSON.stringify(chunk)}\n\n`;
              controller.enqueue(new TextEncoder().encode(data));
              index++;
              setTimeout(sendWord, 50);
            } else {
              controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
              controller.close();
            }
          };

          sendWord();
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
    
    return Response.json(
      { 
        error: 'StockBot (Databricks Genie) is temporarily unavailable',
        message: 'Please check your Databricks connection or try again later.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
EOT

# 5. Create enhanced React chat panel
echo "🎨 Creating enhanced Databricks chat panel..."
mkdir -p src/components/ai

cat > src/components/ai/DatabricksChatPanel.tsx << 'EOT'
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Database, Brain, TrendingUp } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function DatabricksChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const quickActions = [
    { label: 'Top Brands This Week', prompt: 'What are the top performing TBWA client brands this week?' },
    { label: 'NCR Performance', prompt: 'Show me NCR region sales performance vs last month' },
    { label: 'Inventory Insights', prompt: 'Any inventory alerts or low stock issues?' },
    { label: 'Revenue Trends', prompt: 'What are the current revenue trends across all regions?' },
  ];

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (messageContent?: string) => {
    const content = messageContent || input;
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content }] }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  assistantContent += content;
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessage.id 
                      ? { ...msg, content: assistantContent }
                      : msg
                  ));
                }
              } catch (e) {
                // Ignore JSON parse errors
              }
            }
          }
        }
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please check your Databricks connection.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-orange-600" />
          StockBot (Databricks Genie)
          <Badge variant="outline" className="ml-auto">
            <Brain className="h-3 w-3 mr-1" />
            AI Powered
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => sendMessage(action.prompt)}
              disabled={isLoading}
              className="text-xs"
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              {action.label}
            </Button>
          ))}
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Database className="h-12 w-12 mx-auto mb-4 text-orange-600" />
                <p className="text-sm">Ask me about Philippine retail insights!</p>
                <p className="text-xs mt-2">I have access to live Databricks data for TBWA clients.</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground ml-8'
                    : 'bg-muted mr-8'
                }`}
              >
                <div className="text-sm">{message.content}</div>
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">StockBot is analyzing your data...</span>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about Philippine retail insights..."
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
            disabled={isLoading}
          />
          <Button 
            onClick={() => sendMessage()} 
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Send'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
EOT

# 6. Update the main StockBot component to use Databricks
echo "🔄 Updating main StockBot component..."
if [ -f "src/components/GroqStockBot.tsx" ]; then
    # Replace Groq references with Databricks
    sed -i '' 's/GroqStockBot/DatabricksStockBot/g' src/components/GroqStockBot.tsx
    sed -i '' 's/Groq/Databricks Genie/g' src/components/GroqStockBot.tsx
    
    # Update the component import
    echo "import { DatabricksChatPanel } from './ai/DatabricksChatPanel';" >> src/components/GroqStockBot.tsx
fi

# 7. Create npm scripts for Databricks operations
echo "📝 Adding npm scripts..."
if command -v npm >/dev/null 2>&1; then
    npm pkg set scripts.databricks:setup="./install-databricks-bi-genie.sh"
    npm pkg set scripts.databricks:test="node -e \"import('./src/lib/databricks/connector.js').then(m => m.databricksConnector.queryGenie('test').then(console.log))\""
    npm pkg set scripts.databricks:health="node -e \"console.log('Databricks Health Check - TODO')\""
fi

# 8. Update package.json dependencies
echo "📦 Updating package.json..."
cat > package-updates.json << 'EOJ'
{
  "dependencies": {
    "@databricks/sql": "^1.5.3"
  },
  "scripts": {
    "databricks:setup": "./install-databricks-bi-genie.sh",
    "databricks:test": "node test-databricks.js",
    "databricks:health": "echo 'Databricks health check'"
  }
}
EOJ

# 9. Make this script executable
chmod +x install-databricks-bi-genie.sh

echo ""
echo "🎉 Databricks BI Genie integration complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Set up your Databricks credentials in .env.local:"
echo "   DATABRICKS_HOST=https://your-workspace.cloud.databricks.com"
echo "   DATABRICKS_TOKEN=your-token"
echo "   DATABRICKS_GENIE_SPACE_ID=your-space-id"
echo ""
echo "2. Test the integration:"
echo "   npm run databricks:test"
echo ""
echo "3. Start the development server:"
echo "   npm run dev"
echo ""
echo "✅ StockBot now uses Databricks AI Genie instead of Groq!"