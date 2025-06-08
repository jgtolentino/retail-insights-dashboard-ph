import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Send,
  Sparkles,
  BarChart3,
  Database,
  Clock,
  Cpu,
  DollarSign,
  Target,
} from 'lucide-react';
import { databricksGenie, GenieQuery, GenieResponse } from '@/services/databricksGenie';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DatabricksGeniePanelProps {
  className?: string;
}

export default function DatabricksGeniePanel({ className }: DatabricksGeniePanelProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<GenieQuery[]>([]);
  const [suggestions] = useState(databricksGenie.getSuggestedQueries());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const handleSubmit = async (query?: string) => {
    const questionText = query || input;
    if (!questionText.trim() || isLoading) return;

    const newQuery: GenieQuery = {
      id: Date.now().toString(),
      query: questionText,
      timestamp: new Date(),
      status: 'processing',
    };

    setConversation(prev => [...prev, newQuery]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await databricksGenie.askGenie(questionText);

      setConversation(prev =>
        prev.map(q => (q.id === newQuery.id ? { ...q, response, status: 'completed' as const } : q))
      );
    } catch (error) {
      console.error('Genie query error:', error);
      setConversation(prev =>
        prev.map(q =>
          q.id === newQuery.id
            ? {
                ...q,
                response: {
                  answer: 'Sorry, I encountered an error processing your request.',
                  suggestedQueries: [],
                  confidence: 0,
                },
                status: 'error' as const,
              }
            : q
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderChart = (response: GenieResponse) => {
    if (!response.data || response.data.length === 0) return null;

    const data = response.data.slice(0, 10); // Limit to 10 items for readability

    switch (response.chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={Object.keys(data[0])[0]} />
              <YAxis />
              <Tooltip />
              <Bar dataKey={Object.keys(data[0])[1]} fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={Object.keys(data[0])[0]} />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey={Object.keys(data[0])[1]}
                stroke="#3b82f6"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie': {
        const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey={Object.keys(data[0])[1]}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      }

      case 'table':
      default:
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {Object.keys(data[0]).map((key, index) => (
                    <th key={index} className="p-2 text-left font-medium">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 5).map((row, index) => (
                  <tr key={index} className="border-b">
                    {Object.values(row).map((value, cellIndex) => (
                      <td key={cellIndex} className="p-2">
                        {typeof value === 'number' ? value.toLocaleString() : String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {data.length > 5 && (
              <p className="mt-2 text-xs text-gray-500">Showing 5 of {data.length} results</p>
            )}
          </div>
        );
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          Databricks AI Genie
          <Badge variant="secondary" className="ml-auto">
            Powered by Azure OpenAI
          </Badge>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Ask questions about your retail data in natural language
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Conversation History */}
        <div className="h-96 space-y-4 overflow-y-auto rounded-lg border bg-gray-50 p-4">
          {conversation.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              <Database className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p>Start by asking a question about your data!</p>
              <p className="mt-1 text-xs">Try: "What are the top selling brands this month?"</p>
            </div>
          )}

          {conversation.map(query => (
            <div key={query.id} className="space-y-3">
              {/* User Question */}
              <div className="flex justify-end">
                <div className="max-w-md rounded-lg bg-blue-500 px-4 py-2 text-white">
                  {query.query}
                </div>
              </div>

              {/* Genie Response */}
              {query.status === 'processing' && (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Analyzing your question...</span>
                </div>
              )}

              {query.response && (
                <div className="space-y-3">
                  <div className="max-w-full rounded-lg border bg-white p-4">
                    {/* Answer */}
                    <p className="mb-3 text-gray-800">{query.response.answer}</p>

                    {/* Metadata */}
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      {query.response.executionTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {query.response.executionTime}ms
                        </span>
                      )}
                      {query.response.rowCount && (
                        <span className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" />
                          {query.response.rowCount} rows
                        </span>
                      )}
                      {query.response.complexity && (
                        <Badge
                          variant={
                            query.response.complexity.level === 'simple'
                              ? 'secondary'
                              : query.response.complexity.level === 'medium'
                                ? 'default'
                                : 'destructive'
                          }
                          className="flex items-center gap-1 text-xs"
                        >
                          <Target className="h-3 w-3" />
                          {query.response.complexity.level}
                        </Badge>
                      )}
                      {query.response.modelUsed && (
                        <span className="flex items-center gap-1">
                          <Cpu className="h-3 w-3" />
                          {query.response.modelUsed}
                        </span>
                      )}
                      {query.response.estimatedCost && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />$
                          {query.response.estimatedCost.toFixed(4)}
                        </span>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {Math.round(query.response.confidence * 100)}% confidence
                      </Badge>
                    </div>

                    {/* Chart Visualization */}
                    {query.response.data && query.response.data.length > 0 && (
                      <div className="mt-4">{renderChart(query.response)}</div>
                    )}

                    {/* SQL Query */}
                    {query.response.sql && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                          View SQL Query
                        </summary>
                        <pre className="mt-2 overflow-x-auto rounded bg-gray-100 p-2 text-xs">
                          {query.response.sql}
                        </pre>
                      </details>
                    )}

                    {/* Suggested Follow-ups */}
                    {query.response.suggestedQueries.length > 0 && (
                      <div className="mt-3">
                        <p className="mb-2 text-xs text-gray-500">Suggested follow-ups:</p>
                        <div className="space-y-1">
                          {query.response.suggestedQueries.slice(0, 3).map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleSubmit(suggestion)}
                              className="block text-left text-xs text-blue-600 hover:text-blue-800 hover:underline"
                              disabled={isLoading}
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about your retail data..."
              onKeyPress={e => e.key === 'Enter' && handleSubmit()}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={() => handleSubmit()}
              disabled={isLoading || !input.trim()}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Quick Suggestions */}
          {conversation.length === 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">Try these questions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.slice(0, 4).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSubmit(suggestion)}
                    disabled={isLoading}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs transition-colors hover:bg-gray-200"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
