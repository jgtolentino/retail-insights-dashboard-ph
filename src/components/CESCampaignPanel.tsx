import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Send,
  TrendingUp,
  BarChart3,
  DollarSign,
  Target,
  Zap,
  Users,
  Eye,
  MousePointer,
  ShoppingCart,
} from 'lucide-react';
import { CESQuery, CESResponse } from '@/services/cesGenie';
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
  FunnelChart,
  Funnel,
  TrendChart,
} from 'recharts';

interface CESCampaignPanelProps {
  className?: string;
  defaultTenant?: string;
}

const CHANNELS = ['facebook', 'tiktok', 'x', 'google', 'linkedin', 'youtube'];
const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

export default function CESCampaignPanel({
  className,
  defaultTenant = 'ces',
}: CESCampaignPanelProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<CESQuery[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [campaignId, setCampaignId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [suggestions] = useState([
    'What was the CES score trend for top campaigns last week?',
    'Compare cost-per-conversion of TikTok vs Meta this month',
    'Which campaigns have the highest conversion rates?',
    'Show me the top performing channels by CES score',
    'Analyze campaign performance across different creative types',
    'What are the conversion funnel drop-off points?',
    'Compare weekend vs weekday campaign performance',
    'Which demographics have the best CES scores?',
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const handleSubmit = async (query?: string) => {
    const questionText = query || input;
    if (!questionText.trim() || isLoading) return;

    const newQuery: CESQuery = {
      id: Date.now().toString(),
      query: questionText,
      timestamp: new Date(),
      status: 'processing',
      campaign_id: campaignId || undefined,
      channel: selectedChannel || undefined,
    };

    setConversation(prev => [...prev, newQuery]);
    setInput('');
    setIsLoading(true);

    try {
      // Call CES Vercel API endpoint with Azure PostgreSQL
      const apiResponse = await fetch('/api/ces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': defaultTenant,
          'x-campaign-id': campaignId || '',
          'x-channel': selectedChannel || '',
        },
        body: JSON.stringify({
          query: questionText,
          tenant_id: defaultTenant,
          campaign_id: campaignId || undefined,
          channel: selectedChannel || undefined,
        }),
      });

      if (!apiResponse.ok) {
        throw new Error(`CES API error: ${apiResponse.status}`);
      }

      const { data: response } = await apiResponse.json();

      setConversation(prev =>
        prev.map(q => (q.id === newQuery.id ? { ...q, response, status: 'completed' as const } : q))
      );
    } catch (error) {
      console.error('CES Genie query error:', error);
      setConversation(prev =>
        prev.map(q =>
          q.id === newQuery.id
            ? {
                ...q,
                response: {
                  answer: 'Sorry, I encountered an error analyzing your campaign data.',
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

  const renderCampaignChart = (response: CESResponse) => {
    if (!response.data || response.data.length === 0) return null;

    const data = response.data.slice(0, 10);
    const chartProps = {
      width: '100%',
      height: 300,
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (response.chartType) {
      case 'funnel':
        return (
          <ResponsiveContainer {...chartProps}>
            <BarChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: any) => [value.toLocaleString(), 'Count']} />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'trend':
      case 'line':
        return (
          <ResponsiveContainer {...chartProps}>
            <LineChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={Object.keys(data[0])[0]} />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey={
                  Object.keys(data[0]).find(key => typeof data[0][key] === 'number') || 'value'
                }
                stroke="#8884d8"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer {...chartProps}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey={
                  Object.keys(data[0]).find(key => typeof data[0][key] === 'number') || 'value'
                }
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'bar':
      default:
        return (
          <ResponsiveContainer {...chartProps}>
            <BarChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={Object.keys(data[0])[0]} />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey={
                  Object.keys(data[0]).find(key => typeof data[0][key] === 'number') || 'value'
                }
                fill="#8884d8"
              />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  const renderCESMetrics = (response: CESResponse) => {
    if (!response.cesScore && !response.data) return null;

    return (
      <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        {response.cesScore && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">CES Score</p>
                  <p className="text-2xl font-bold text-green-600">{response.cesScore}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {response.data && response.data.length > 0 && (
          <>
            {response.data[0].spend && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">Total Spend</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ${Number(response.data[0].spend).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {response.data[0].impressions && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium">Impressions</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {Number(response.data[0].impressions).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {response.data[0].conversions && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <ShoppingCart className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Conversions</p>
                      <p className="text-2xl font-bold text-green-600">
                        {Number(response.data[0].conversions).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <Card className={`mx-auto w-full max-w-4xl ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          CES Campaign Analytics Genie
          <Badge variant="outline" className="ml-auto">
            Tenant: {defaultTenant.toUpperCase()}
          </Badge>
        </CardTitle>

        {/* Campaign Context Controls */}
        <div className="flex gap-2 pt-2">
          <Input
            placeholder="Campaign ID (optional)"
            value={campaignId}
            onChange={e => setCampaignId(e.target.value)}
            className="flex-1"
          />
          <Select value={selectedChannel} onValueChange={setSelectedChannel}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Channels</SelectItem>
              {CHANNELS.map(channel => (
                <SelectItem key={channel} value={channel}>
                  {channel.charAt(0).toUpperCase() + channel.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Conversation History */}
        <div className="h-96 space-y-4 overflow-y-auto rounded-lg border p-4">
          {conversation.length === 0 && (
            <div className="mt-8 text-center text-gray-500">
              <TrendingUp className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>Ask me about your campaign performance!</p>
              <p className="mt-2 text-sm">
                I can analyze CES scores, channel performance, and campaign optimization
                opportunities.
              </p>
            </div>
          )}

          {conversation.map(query => (
            <div key={query.id} className="space-y-3">
              {/* User Query */}
              <div className="flex justify-end">
                <div className="max-w-xs rounded-lg bg-blue-500 p-3 text-white">
                  <p className="text-sm">{query.query}</p>
                  {(query.campaign_id || query.channel) && (
                    <div className="mt-2 flex gap-1">
                      {query.campaign_id && (
                        <Badge variant="secondary" className="text-xs">
                          Campaign: {query.campaign_id}
                        </Badge>
                      )}
                      {query.channel && (
                        <Badge variant="secondary" className="text-xs">
                          {query.channel}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Genie Response */}
              {query.response && (
                <div className="space-y-3">
                  {/* CES Metrics Dashboard */}
                  {renderCESMetrics(query.response)}

                  {/* Main Response */}
                  <div className="rounded-lg bg-gray-50 p-4">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="mt-1 h-6 w-6 flex-shrink-0 text-blue-600" />
                      <div className="flex-1 space-y-3">
                        <p className="text-sm leading-relaxed">{query.response.answer}</p>

                        {/* Metadata Badges */}
                        <div className="flex flex-wrap gap-2">
                          {query.response.complexity && (
                            <Badge
                              variant={
                                query.response.complexity.level === 'simple'
                                  ? 'secondary'
                                  : query.response.complexity.level === 'medium'
                                    ? 'default'
                                    : 'destructive'
                              }
                            >
                              <Target className="mr-1 h-3 w-3" />
                              {query.response.complexity.level}
                            </Badge>
                          )}

                          {query.response.modelUsed && (
                            <Badge variant="outline">
                              <Zap className="mr-1 h-3 w-3" />
                              {query.response.modelUsed}
                            </Badge>
                          )}

                          {query.response.executionTime && (
                            <Badge variant="outline">
                              <BarChart3 className="mr-1 h-3 w-3" />
                              {query.response.executionTime}ms
                            </Badge>
                          )}

                          {query.response.estimatedCost && (
                            <Badge variant="outline">
                              <DollarSign className="mr-1 h-3 w-3" />$
                              {query.response.estimatedCost.toFixed(4)}
                            </Badge>
                          )}
                        </div>

                        {/* Chart Visualization */}
                        {renderCampaignChart(query.response)}

                        {/* Suggested Follow-up Questions */}
                        {query.response.suggestedQueries &&
                          query.response.suggestedQueries.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-gray-600">Try asking:</p>
                              <div className="flex flex-wrap gap-2">
                                {query.response.suggestedQueries
                                  .slice(0, 3)
                                  .map((suggestion, index) => (
                                    <Button
                                      key={index}
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={() => handleSubmit(suggestion)}
                                    >
                                      {suggestion}
                                    </Button>
                                  ))}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {query.status === 'processing' && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <p className="text-sm text-gray-600">Analyzing campaign data...</p>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Section */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about campaign performance, CES scores, channel analysis..."
              onKeyPress={e => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={() => handleSubmit()} disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Suggestion Pills */}
          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, 4).map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handleSubmit(suggestion)}
                disabled={isLoading}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
