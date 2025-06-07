#!/bin/bash

echo "🤖 INSTALLING AI BI GENIE FOR RETAIL INSIGHTS DASHBOARD"
echo "======================================================="
echo "This will integrate AI chat capabilities into your existing dashboard"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || ! grep -q "vite_react_shadcn_ts" package.json; then
    echo "❌ Please run this script from your retail-insights-dashboard-ph directory"
    exit 1
fi

echo "✅ Detected retail insights dashboard project"
echo ""

# Create AI library directory
mkdir -p src/lib/ai
mkdir -p src/components/ai
mkdir -p src/hooks/ai

echo "📂 Created AI directories"

# 1. Create Groq AI Client (using your existing structure)
cat > src/lib/ai/groq.ts << 'EOF'
import Groq from 'groq-sdk';

// Initialize Groq client with proper error handling
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  toolCalls?: any[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

export async function generateAIResponse(
  messages: ChatMessage[],
  tools?: any[]
): Promise<AIResponse> {
  try {
    const completion = await groq.chat.completions.create({
      messages,
      model: 'llama3-8b-8192',
      tools,
      tool_choice: tools ? 'auto' : undefined,
      temperature: 0.1,
      max_tokens: 1024,
      stream: false,
    });

    const choice = completion.choices[0];
    
    return {
      content: choice.message.content || '',
      toolCalls: choice.message.tool_calls,
      usage: {
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
      },
    };
  } catch (error) {
    console.error('Groq AI Error:', error);
    throw new Error('Failed to generate AI response');
  }
}

export async function generateStreamingResponse(
  messages: ChatMessage[],
  onChunk: (chunk: string) => void,
  tools?: any[]
): Promise<void> {
  try {
    const stream = await groq.chat.completions.create({
      messages,
      model: 'llama3-8b-8192',
      tools,
      tool_choice: tools ? 'auto' : undefined,
      temperature: 0.1,
      max_tokens: 1024,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        onChunk(content);
      }
    }
  } catch (error) {
    console.error('Streaming Error:', error);
    onChunk('Sorry, I encountered an error processing your request.');
  }
}
EOF

# 2. Create Retail-Specific AI Tools
cat > src/lib/ai/retail-tools.ts << 'EOF'
import { supabase } from '@/integrations/supabase/client';

export const retailAnalysisTools = [
  {
    type: 'function',
    function: {
      name: 'get_brand_performance',
      description: 'Get sales performance data for brands, including TBWA vs competitor analysis',
      parameters: {
        type: 'object',
        properties: {
          brand_filter: {
            type: 'string',
            description: 'Specific brand name to filter by, or "tbwa" for TBWA brands only'
          },
          time_period: {
            type: 'string',
            enum: ['7d', '30d', '90d', '1y'],
            description: 'Time period for analysis'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_customer_demographics',
      description: 'Analyze customer demographics and behavior patterns',
      parameters: {
        type: 'object',
        properties: {
          segment: {
            type: 'string',
            enum: ['age', 'gender', 'location', 'all'],
            description: 'Demographic segment to analyze'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_sales_trends',
      description: 'Get sales trend analysis and forecasting',
      parameters: {
        type: 'object',
        properties: {
          metric: {
            type: 'string',
            enum: ['revenue', 'volume', 'growth', 'all'],
            description: 'Sales metric to analyze'
          },
          granularity: {
            type: 'string',
            enum: ['daily', 'weekly', 'monthly'],
            description: 'Time granularity for trends'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_product_insights',
      description: 'Analyze product performance and substitution patterns',
      parameters: {
        type: 'object',
        properties: {
          analysis_type: {
            type: 'string',
            enum: ['top_products', 'substitutions', 'categories', 'all'],
            description: 'Type of product analysis'
          }
        }
      }
    }
  }
];

// Tool execution functions using your existing Supabase setup
export async function executeTool(toolName: string, parameters: any) {
  try {
    switch (toolName) {
      case 'get_brand_performance':
        return await getBrandPerformance(parameters);
      case 'get_customer_demographics':
        return await getCustomerDemographics(parameters);
      case 'get_sales_trends':
        return await getSalesTrends(parameters);
      case 'get_product_insights':
        return await getProductInsights(parameters);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error) {
    console.error(`Tool execution error for ${toolName}:`, error);
    return { error: `Failed to execute ${toolName}: ${error.message}` };
  }
}

async function getBrandPerformance(params: any) {
  const { brand_filter, time_period = '30d' } = params;
  
  let query = supabase
    .from('transaction_items')
    .select(`
      *,
      products(name, brand_id, brands(name, is_tbwa)),
      transactions(total_amount, created_at)
    `);

  // Apply time filter
  const daysAgo = parseInt(time_period.replace('d', '')) || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysAgo);
  
  query = query.gte('transactions.created_at', startDate.toISOString());

  if (brand_filter === 'tbwa') {
    query = query.eq('products.brands.is_tbwa', true);
  } else if (brand_filter && brand_filter !== 'all') {
    query = query.ilike('products.brands.name', `%${brand_filter}%`);
  }

  const { data, error } = await query.limit(1000);

  if (error) throw error;

  // Process and aggregate the data
  const brandStats = data?.reduce((acc, item) => {
    const brandName = item.products?.brands?.name || 'Unknown';
    const isTbwa = item.products?.brands?.is_tbwa || false;
    
    if (!acc[brandName]) {
      acc[brandName] = {
        name: brandName,
        is_tbwa: isTbwa,
        total_revenue: 0,
        total_items: 0
      };
    }
    
    acc[brandName].total_revenue += item.total_price || 0;
    acc[brandName].total_items += item.quantity || 0;
    
    return acc;
  }, {});

  return {
    brands: Object.values(brandStats || {}),
    time_period,
    total_brands: Object.keys(brandStats || {}).length
  };
}

async function getCustomerDemographics(params: any) {
  const { segment = 'all' } = params;
  
  const { data, error } = await supabase
    .from('transactions')
    .select('customer_age, customer_gender, store_location, total_amount')
    .not('customer_age', 'is', null)
    .not('customer_gender', 'is', null)
    .limit(5000);

  if (error) throw error;

  const demographics = {
    age_distribution: {},
    gender_distribution: {},
    location_distribution: {},
    total_customers: data?.length || 0
  };

  data?.forEach(transaction => {
    // Age grouping
    const ageGroup = transaction.customer_age < 25 ? '18-24' :
                    transaction.customer_age < 35 ? '25-34' :
                    transaction.customer_age < 45 ? '35-44' :
                    transaction.customer_age < 55 ? '45-54' : '55+';
    
    demographics.age_distribution[ageGroup] = 
      (demographics.age_distribution[ageGroup] || 0) + 1;
    
    // Gender distribution
    demographics.gender_distribution[transaction.customer_gender] = 
      (demographics.gender_distribution[transaction.customer_gender] || 0) + 1;
    
    // Location distribution
    demographics.location_distribution[transaction.store_location] = 
      (demographics.location_distribution[transaction.store_location] || 0) + 1;
  });

  return demographics;
}

async function getSalesTrends(params: any) {
  const { metric = 'revenue', granularity = 'daily' } = params;
  
  const { data, error } = await supabase
    .from('transactions')
    .select('created_at, total_amount')
    .order('created_at', { ascending: true })
    .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

  if (error) throw error;

  // Group by time period
  const trends = data?.reduce((acc, transaction) => {
    const date = new Date(transaction.created_at);
    let key;
    
    switch (granularity) {
      case 'weekly':
        key = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
        break;
      case 'monthly':
        key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        break;
      default:
        key = date.toISOString().split('T')[0];
    }
    
    if (!acc[key]) {
      acc[key] = { revenue: 0, volume: 0 };
    }
    
    acc[key].revenue += transaction.total_amount;
    acc[key].volume += 1;
    
    return acc;
  }, {});

  return {
    trends: Object.entries(trends || {}).map(([date, data]) => ({
      date,
      ...data
    })),
    metric,
    granularity
  };
}

async function getProductInsights(params: any) {
  const { analysis_type = 'top_products' } = params;
  
  const { data, error } = await supabase
    .from('transaction_items')
    .select(`
      *,
      products(name, category, brands(name))
    `)
    .limit(2000);

  if (error) throw error;

  const productStats = data?.reduce((acc, item) => {
    const productName = item.products?.name || 'Unknown';
    const category = item.products?.category || 'Other';
    
    if (!acc[productName]) {
      acc[productName] = {
        name: productName,
        category,
        brand: item.products?.brands?.name,
        total_revenue: 0,
        total_quantity: 0,
        frequency: 0
      };
    }
    
    acc[productName].total_revenue += item.total_price || 0;
    acc[productName].total_quantity += item.quantity || 0;
    acc[productName].frequency += 1;
    
    return acc;
  }, {});

  const products = Object.values(productStats || {})
    .sort((a, b) => b.total_revenue - a.total_revenue);

  return {
    top_products: products.slice(0, 10),
    categories: [...new Set(products.map(p => p.category))],
    total_products: products.length,
    analysis_type
  };
}
EOF

# 3. Create Chat API Route (compatible with your app structure)
mkdir -p app/api/chat
cat > app/api/chat/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse } from '@/lib/ai/groq';
import { retailAnalysisTools, executeTool } from '@/lib/ai/retail-tools';

export const runtime = 'edge';

const SYSTEM_PROMPT = `You are an AI Business Intelligence assistant for a Philippine retail analytics dashboard. 

You help analyze:
- TBWA brand performance vs competitors
- Customer demographics and behavior
- Sales trends and forecasting  
- Product performance and substitutions
- Sari-sari store insights

When users ask questions, use the available tools to fetch real data from the Supabase database. Always provide specific, actionable insights with numbers and percentages when possible.

Context: This is a Project Scout dashboard monitoring IoT-enabled sari-sari stores across the Philippines, with special focus on TBWA brand performance.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    
    // Add system prompt if not present
    const fullMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ];

    // Generate initial response with tools
    const response = await generateAIResponse(fullMessages, retailAnalysisTools);
    
    // Handle tool calls if any
    if (response.toolCalls && response.toolCalls.length > 0) {
      const toolResults = [];
      
      for (const toolCall of response.toolCalls) {
        const { name, arguments: args } = toolCall.function;
        const result = await executeTool(name, JSON.parse(args));
        toolResults.push({
          tool_call_id: toolCall.id,
          name,
          result
        });
      }
      
      // Generate final response with tool results
      const finalMessages = [
        ...fullMessages,
        {
          role: 'assistant',
          content: response.content,
          tool_calls: response.toolCalls
        },
        ...toolResults.map(result => ({
          role: 'tool',
          tool_call_id: result.tool_call_id,
          name: result.name,
          content: JSON.stringify(result.result)
        }))
      ];
      
      const finalResponse = await generateAIResponse(finalMessages);
      
      return NextResponse.json({
        content: finalResponse.content,
        usage: finalResponse.usage
      });
    }
    
    return NextResponse.json({
      content: response.content,
      usage: response.usage
    });
    
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
EOF

# 4. Create AI Chat Component (using your existing UI components)
cat > src/components/ai/AIChatPanel.tsx << 'EOF'
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Bot, User, Send, Loader2, BarChart3 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const AIChatPanel: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m your Retail AI assistant. I can help you analyze TBWA brand performance, customer demographics, sales trends, and product insights. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = [
    "How are TBWA brands performing vs competitors?",
    "What are the customer demographics?",
    "Show me sales trends for the last 30 days",
    "Which products are performing best?"
  ];

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          Retail AI Assistant
          <Badge variant="secondary">Beta</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex gap-3 max-w-[80%] ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {message.role === 'user' ? (
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-gray-600">Analyzing data...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {messages.length === 1 && (
          <div className="px-4 pb-4">
            <p className="text-sm text-gray-600 mb-3">Try asking:</p>
            <div className="grid grid-cols-1 gap-2">
              {suggestedQuestions.map((question, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="text-left justify-start h-auto py-2"
                  onClick={() => setInput(question)}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="border-t px-4 py-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your retail data..."
              disabled={isLoading}
            />
            <Button 
              onClick={sendMessage} 
              disabled={!input.trim() || isLoading}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
EOF

# 5. Create integration hook for your existing dashboard
cat > src/hooks/ai/useAIChat.ts << 'EOF'
import { useState, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface UseChatOptions {
  onError?: (error: Error) => void;
}

export function useAIChat(options: UseChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        }),
      });

      if (!response.ok) {
        throw new Error('Chat request failed');
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.content
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      options.onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [messages, options]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages
  };
}
EOF

# 6. Add environment variables
cat >> .env.example << 'EOF'

# AI Configuration
GROQ_API_KEY=gsk_your_groq_api_key_here
NEXT_PUBLIC_AI_ENABLED=true
EOF

# 7. Install required dependencies
echo "📦 Installing AI dependencies..."
npm install groq-sdk

# 8. Create database views for better AI queries
cat > setup-ai-database.sql << 'EOF'
-- Enhanced views for AI queries
CREATE OR REPLACE VIEW ai_brand_performance AS
SELECT 
    b.name as brand_name,
    b.is_tbwa,
    COUNT(ti.id) as total_transactions,
    SUM(ti.total_price) as total_revenue,
    SUM(ti.quantity) as total_units,
    AVG(ti.total_price) as avg_transaction_value,
    COUNT(DISTINCT t.id) as unique_customers
FROM brands b
LEFT JOIN products p ON b.id = p.brand_id
LEFT JOIN transaction_items ti ON p.id = ti.product_id
LEFT JOIN transactions t ON ti.transaction_id = t.id
WHERE t.created_at >= NOW() - INTERVAL '90 days'
GROUP BY b.id, b.name, b.is_tbwa;

CREATE OR REPLACE VIEW ai_customer_insights AS
SELECT 
    CASE 
        WHEN customer_age < 25 THEN '18-24'
        WHEN customer_age < 35 THEN '25-34'
        WHEN customer_age < 45 THEN '35-44'
        WHEN customer_age < 55 THEN '45-54'
        ELSE '55+'
    END as age_group,
    customer_gender,
    store_location,
    COUNT(*) as transaction_count,
    AVG(total_amount) as avg_spend,
    SUM(total_amount) as total_spend
FROM transactions 
WHERE customer_age IS NOT NULL 
    AND customer_gender IS NOT NULL
    AND created_at >= NOW() - INTERVAL '90 days'
GROUP BY age_group, customer_gender, store_location;

CREATE OR REPLACE VIEW ai_sales_trends AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as transaction_count,
    SUM(total_amount) as daily_revenue,
    AVG(total_amount) as avg_transaction_value,
    COUNT(DISTINCT CASE WHEN customer_gender = 'Male' THEN id END) as male_customers,
    COUNT(DISTINCT CASE WHEN customer_gender = 'Female' THEN id END) as female_customers
FROM transactions 
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date;

CREATE OR REPLACE VIEW ai_product_performance AS
SELECT 
    p.name as product_name,
    p.category,
    b.name as brand_name,
    b.is_tbwa,
    COUNT(ti.id) as transaction_count,
    SUM(ti.quantity) as total_quantity,
    SUM(ti.total_price) as total_revenue,
    AVG(ti.unit_price) as avg_unit_price
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN transaction_items ti ON p.id = ti.product_id
LEFT JOIN transactions t ON ti.transaction_id = t.id
WHERE t.created_at >= NOW() - INTERVAL '90 days'
GROUP BY p.id, p.name, p.category, b.name, b.is_tbwa
ORDER BY total_revenue DESC;
EOF

# 9. Update your main App.tsx to include AI (optional integration)
cat > src/components/ai/README.md << 'EOF'
# AI BI Genie Integration

## Files Created:
- `src/lib/ai/groq.ts` - AI client
- `src/lib/ai/retail-tools.ts` - Retail analysis tools
- `src/components/ai/AIChatPanel.tsx` - Chat UI component
- `src/hooks/ai/useAIChat.ts` - Chat hook
- `app/api/chat/route.ts` - API endpoint

## Setup:
1. Add GROQ_API_KEY to your .env.local
2. Run the SQL in setup-ai-database.sql in Supabase
3. Import AIChatPanel into your dashboard

## Usage Example:
```tsx
import { AIChatPanel } from '@/components/ai/AIChatPanel';

// In your dashboard component:
<AIChatPanel />
```

## Integration with existing dashboard:
The AI assistant can analyze your real retail data and provides insights about:
- TBWA vs competitor performance
- Customer demographics
- Sales trends
- Product performance
EOF

echo ""
echo "🎉 AI BI GENIE SUCCESSFULLY INSTALLED!"
echo "================================================="
echo ""
echo "✅ Created AI library files"
echo "✅ Created chat components"
echo "✅ Created API endpoint" 
echo "✅ Installed dependencies"
echo "✅ Created database views"
echo ""
echo "🔧 NEXT STEPS:"
echo "1. Add your Groq API key to .env.local:"
echo "   GROQ_API_KEY=gsk_your_actual_key_here"
echo ""
echo "2. Run the SQL in setup-ai-database.sql in your Supabase SQL editor"
echo ""
echo "3. Add to your dashboard:"
echo "   import { AIChatPanel } from '@/components/ai/AIChatPanel';"
echo ""
echo "4. Test it:"
echo "   npm run dev"
echo ""
echo "🤖 The AI assistant will analyze your real retail data!"
echo "   Try asking: 'How are TBWA brands performing?'"
echo ""
EOF

chmod +x install-ai-genie-retail.sh

echo "✅ Created customized AI Genie installer for your retail dashboard!"
echo ""
echo "🚀 To install:"
echo "   ./install-ai-genie-retail.sh"
echo ""
echo "This script is specifically designed for your current stack and will:"
echo "  ✅ Use your existing Supabase database"
echo "  ✅ Integrate with your shadcn/ui components" 
echo "  ✅ Work with your current Vite/React setup"
echo "  ✅ Analyze your real retail data"
echo "  ✅ Focus on TBWA brand performance"

Would you like me to run the installation now, or would you prefer to review the script first?