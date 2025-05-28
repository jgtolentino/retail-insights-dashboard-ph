import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Brain, TrendingUp, AlertTriangle, Lightbulb, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { aiService, type AIInsight, type DashboardData } from '@/services/aiService';

interface AIPanelProps {
  dashboardData?: DashboardData;
  className?: string;
}

const priorityColors = {
  low: 'bg-blue-100 text-blue-800 border-blue-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
};

const typeIcons = {
  recommendation: Lightbulb,
  anomaly: AlertTriangle,
  prediction: TrendingUp,
  trend: Brain,
};

export function AIPanel({ dashboardData, className = '' }: AIPanelProps) {
  const [selectedInsightId, setSelectedInsightId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  // Fetch AI insights based on dashboard data
  const { data: insights = [], isLoading, error, refetch } = useQuery({
    queryKey: ['ai-insights', dashboardData],
    queryFn: async () => {
      if (!dashboardData) return [];
      
      const [recommendations, anomalies, predictions, consumerInsights] = await Promise.all([
        aiService.getRecommendations(dashboardData),
        aiService.detectAnomalies(dashboardData),
        aiService.generatePredictions(dashboardData),
        aiService.getConsumerInsights(dashboardData.customers),
      ]);

      return [...recommendations, ...anomalies, ...predictions, ...consumerInsights]
        .sort((a, b) => {
          // Sort by priority, then by confidence
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return b.confidence - a.confidence;
        });
    },
    enabled: !!dashboardData,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider stale after 2 minutes
  });

  // Auto-collapse if no insights
  useEffect(() => {
    if (insights.length === 0 && !isLoading) {
      setIsExpanded(false);
    }
  }, [insights.length, isLoading]);

  if (!isExpanded) {
    return (
      <Card className={`p-3 border-dashed border-2 ${className}`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="w-full justify-start"
        >
          <Brain className="h-4 w-4 mr-2" />
          AI Insights ({insights.length})
        </Button>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-lg">AI Insights</h3>
            {insights.length > 0 && (
              <Badge variant="secondary">{insights.length}</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {isLoading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-6">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Unable to generate AI insights. Using fallback analysis.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        )}

        {!isLoading && !error && insights.length === 0 && (
          <div className="text-center py-6">
            <Brain className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              No insights available yet. Check back once you have more data.
            </p>
          </div>
        )}

        {insights.length > 0 && (
          <div className="space-y-3">
            {insights.slice(0, 5).map((insight) => {
              const Icon = typeIcons[insight.type];
              const isSelected = selectedInsightId === insight.id;
              
              return (
                <Card
                  key={insight.id}
                  className={`p-3 cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedInsightId(isSelected ? null : insight.id)}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                      insight.type === 'anomaly' ? 'text-red-500' :
                      insight.type === 'recommendation' ? 'text-blue-500' :
                      insight.type === 'prediction' ? 'text-green-500' :
                      'text-purple-500'
                    }`} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm leading-tight">
                          {insight.title}
                        </h4>
                        <Badge
                          variant="outline"
                          className={`text-xs flex-shrink-0 ${priorityColors[insight.priority]}`}
                        >
                          {insight.priority}
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {insight.content}
                      </p>
                      
                      {isSelected && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs text-gray-700">
                            {insight.content}
                          </p>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Confidence: {(insight.confidence * 100).toFixed(0)}%</span>
                            <span>{new Date(insight.timestamp).toLocaleTimeString()}</span>
                          </div>
                          
                          {insight.actions && insight.actions.length > 0 && (
                            <div className="flex gap-2 pt-2">
                              {insight.actions.map((action, index) => (
                                <Button
                                  key={index}
                                  variant={action.type === 'primary' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    action.onClick();
                                  }}
                                >
                                  {action.label}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
            
            {insights.length > 5 && (
              <div className="text-center pt-2">
                <Button variant="outline" size="sm">
                  View All {insights.length} Insights
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}