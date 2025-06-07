import React, { useState } from 'react';
import { useChat } from 'ai/react';
import { Bot, Send, TrendingUp, BarChart3, MapPin, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StockBotProps {
  onClose?: () => void;
  isOpen?: boolean;
}

export function GroqStockBot({ onClose, isOpen = true }: StockBotProps) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: '1',
        role: 'assistant',
        content: '👋 Hi! I\'m StockBot, your Philippine retail analytics assistant. I can help you analyze TBWA client performance, regional insights, and detect market anomalies. What would you like to explore?',
      },
    ],
  });

  // Quick action buttons for common queries
  const quickActions = [
    {
      icon: TrendingUp,
      label: 'Sales Today',
      query: 'Show me today\'s sales metrics across all TBWA clients',
    },
    {
      icon: BarChart3,
      label: 'Brand Comparison',
      query: 'Compare TBWA client brands vs competitors this month',
    },
    {
      icon: MapPin,
      label: 'Regional Performance',
      query: 'Show regional performance across NCR, Luzon, Visayas, and Mindanao',
    },
    {
      icon: AlertTriangle,
      label: 'Detect Anomalies',
      query: 'Detect any unusual patterns or anomalies in the last week',
    },
  ];

  const handleQuickAction = (query: string) => {
    handleInputChange({ target: { value: query } } as React.ChangeEvent<HTMLInputElement>);
    handleSubmit({ preventDefault: () => {} } as React.FormEvent<HTMLFormElement>);
  };

  if (!isOpen) return null;

  return (
    <Card className="w-full max-w-2xl mx-auto h-[600px] flex flex-col">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          StockBot - Philippine Retail Analytics
          {onClose && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="ml-auto text-white hover:bg-white/20"
            >
              ×
            </Button>
          )}
        </CardTitle>
        <p className="text-sm text-blue-100">
          Powered by Groq AI • Real-time Supabase data • TBWA insights
        </p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Quick Actions */}
        {messages.length <= 1 && (
          <div className="p-4 border-b bg-gray-50">
            <p className="text-sm text-gray-600 mb-3">Quick actions:</p>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(action.query)}
                  className="flex items-center gap-2 text-left justify-start h-auto py-2"
                >
                  <action.icon className="h-4 w-4 text-blue-600" />
                  <span className="text-xs">{action.label}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="h-4 w-4 text-blue-600" />
                    <Badge variant="secondary" className="text-xs">
                      StockBot
                    </Badge>
                  </div>
                )}
                <div className="text-sm whitespace-pre-wrap">
                  {message.content}
                </div>
                
                {/* Display tool results if present */}
                {message.toolInvocations?.map((tool, index) => (
                  <div key={index} className="mt-3 p-3 bg-white rounded border">
                    <div className="text-xs text-gray-500 mb-2">
                      📊 {tool.toolName.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </div>
                    <pre className="text-xs text-gray-700 overflow-x-auto">
                      {JSON.stringify(tool.result, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-2">
                <Bot className="h-4 w-4 text-blue-600 animate-pulse" />
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask about TBWA performance, regional insights, or anomalies..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            💡 Try: "Compare Del Monte vs Alaska this month" or "Any anomalies in NCR sales?"
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default GroqStockBot;