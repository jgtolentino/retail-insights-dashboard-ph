/**
 * AI Insights Panel Component
 *
 * Integrates Azure OpenAI with our retail analytics dashboard
 * Provides AI-powered insights, predictions, and recommendations
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  TrendingUp,
  Brain,
  Lightbulb,
  BarChart3,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { azureOpenAIService, AIInsight, AIPrediction, SalesData } from '@/services/azure-openai';
import { simpleDashboardService } from '@/services/simple-dashboard';

interface AIInsightsPanelProps {
  className?: string;
}

export function AIInsightsPanel({ className }: AIInsightsPanelProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [predictions, setPredictions] = useState<AIPrediction[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [optimizations, setOptimizations] = useState<any[]>([]);
  const [consumerBehavior, setConsumerBehavior] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    generateAIInsights();
  }, []);

  const generateAIInsights = async () => {
    setIsLoading(true);
    setError('');

    try {
      console.log('🤖 Generating AI insights...');

      // Get current dashboard data
      const dashboardData = await simpleDashboardService.getDashboardData();

      const salesData: SalesData = {
        totalRevenue: dashboardData.totalRevenue,
        totalTransactions: dashboardData.totalTransactions,
        topBrands: dashboardData.topBrands,
        timeSeriesData: dashboardData.timeSeriesData,
      };

      // Generate all AI insights in parallel
      const [
        generatedInsights,
        generatedPredictions,
        detectedAnomalies,
        generatedOptimizations,
        behaviorAnalysis,
      ] = await Promise.all([
        azureOpenAIService.generateRetailInsights(salesData),
        azureOpenAIService.generateSalesPrediction(salesData, '30 days'),
        azureOpenAIService.detectAnomalies(salesData),
        azureOpenAIService.generateOptimizationSuggestions(salesData),
        azureOpenAIService.analyzeFilipinoConsumerBehavior(salesData),
      ]);

      setInsights(generatedInsights);
      setPredictions(generatedPredictions);
      setAnomalies(detectedAnomalies);
      setOptimizations(generatedOptimizations);
      setConsumerBehavior(behaviorAnalysis);
      setLastUpdated(new Date().toLocaleString());

      console.log('✅ AI insights generated successfully');
    } catch (error) {
      console.error('❌ Failed to generate AI insights:', error);
      setError('Failed to generate AI insights. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Brain className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">AI Retail Insights</h2>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            Powered by Azure OpenAI
          </Badge>
        </div>

        <div className="flex items-center space-x-2">
          {lastUpdated && (
            <span className="text-sm text-gray-500">Last updated: {lastUpdated}</span>
          )}
          <Button onClick={generateAIInsights} disabled={isLoading} variant="outline" size="sm">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {isLoading ? 'Generating...' : 'Refresh Insights'}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-lg">Generating AI insights...</span>
            </div>
            <p className="mt-2 text-center text-gray-500">
              Analyzing your retail data with Azure OpenAI
            </p>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {!isLoading && !error && (
        <Tabs defaultValue="insights" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="insights" className="flex items-center space-x-1">
              <Lightbulb className="h-4 w-4" />
              <span>Insights</span>
            </TabsTrigger>
            <TabsTrigger value="predictions" className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4" />
              <span>Predictions</span>
            </TabsTrigger>
            <TabsTrigger value="anomalies" className="flex items-center space-x-1">
              <AlertTriangle className="h-4 w-4" />
              <span>Anomalies</span>
            </TabsTrigger>
            <TabsTrigger value="optimizations" className="flex items-center space-x-1">
              <BarChart3 className="h-4 w-4" />
              <span>Optimize</span>
            </TabsTrigger>
            <TabsTrigger value="behavior" className="flex items-center space-x-1">
              <Brain className="h-4 w-4" />
              <span>Consumer</span>
            </TabsTrigger>
          </TabsList>

          {/* Key Insights Tab */}
          <TabsContent value="insights" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {insights.map((insight, index) => (
                <Card key={insight.id || index} className="transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{insight.title}</CardTitle>
                      <Badge className={getPriorityColor(insight.priority)}>
                        {insight.priority}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">{insight.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-green-600">Impact:</span>
                        <span>{insight.impact}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Confidence:</span>
                        <span className={getConfidenceColor(insight.confidence)}>
                          {insight.confidence}%
                        </span>
                      </div>

                      {insight.expectedROI && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">Expected ROI:</span>
                          <span className="text-blue-600">{insight.expectedROI}</span>
                        </div>
                      )}

                      {insight.timeframe && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">Timeframe:</span>
                          <span>{insight.timeframe}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {insight.category}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            insight.implementationEffort === 'easy'
                              ? 'bg-green-50 text-green-700'
                              : insight.implementationEffort === 'moderate'
                                ? 'bg-yellow-50 text-yellow-700'
                                : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {insight.implementationEffort}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {insights.length === 0 && !isLoading && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Brain className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <p className="text-gray-500">
                    No insights available. Click refresh to generate AI insights.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Predictions Tab */}
          <TabsContent value="predictions" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {predictions.map((prediction, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="capitalize">
                      {prediction.metric.replace(/_/g, ' ')}
                    </CardTitle>
                    <CardDescription>Prediction for {prediction.timeframe}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Current:</span>
                        <span className="text-lg font-bold">
                          {prediction.metric.includes('revenue') ? '₱' : ''}
                          {prediction.currentValue.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Predicted:</span>
                        <span className="text-lg font-bold text-blue-600">
                          {prediction.metric.includes('revenue') ? '₱' : ''}
                          {prediction.predictedValue.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Change:</span>
                        <span
                          className={`text-lg font-bold ${
                            prediction.predictedValue > prediction.currentValue
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {prediction.predictedValue > prediction.currentValue ? '+' : ''}
                          {(
                            ((prediction.predictedValue - prediction.currentValue) /
                              prediction.currentValue) *
                            100
                          ).toFixed(1)}
                          %
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Confidence:</span>
                        <span className={getConfidenceColor(prediction.confidence)}>
                          {prediction.confidence}%
                        </span>
                      </div>

                      {prediction.factors.length > 0 && (
                        <div>
                          <p className="mb-2 text-sm font-medium">Key Factors:</p>
                          <div className="space-y-1">
                            {prediction.factors.map((factor, i) => (
                              <Badge key={i} variant="outline" className="mb-1 mr-1 text-xs">
                                {factor}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {prediction.recommendations.length > 0 && (
                        <div>
                          <p className="mb-2 text-sm font-medium">Recommendations:</p>
                          <ul className="space-y-1 text-sm">
                            {prediction.recommendations.map((rec, i) => (
                              <li key={i} className="flex items-start space-x-1">
                                <span className="text-blue-500">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {predictions.length === 0 && !isLoading && (
              <Card>
                <CardContent className="p-8 text-center">
                  <TrendingUp className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <p className="text-gray-500">
                    No predictions available. Click refresh to generate predictions.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Anomalies Tab */}
          <TabsContent value="anomalies" className="space-y-4">
            <div className="space-y-4">
              {anomalies.map((anomaly, index) => (
                <Card key={index} className="border-l-4 border-l-orange-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg capitalize">
                        {anomaly.type?.replace(/_/g, ' ') || 'Anomaly Detected'}
                      </CardTitle>
                      <Badge className={getSeverityColor(anomaly.severity)}>
                        {anomaly.severity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-gray-700">{anomaly.description}</p>

                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Affected Metric:</span>
                        <Badge variant="outline">{anomaly.affectedMetric}</Badge>
                      </div>

                      <div className="rounded-lg bg-blue-50 p-3">
                        <p className="mb-1 text-sm font-medium text-blue-800">Suggested Action:</p>
                        <p className="text-sm text-blue-700">{anomaly.suggestedAction}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {anomalies.length === 0 && !isLoading && (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <p className="text-gray-500">
                    No anomalies detected. Your data patterns look normal.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Optimizations Tab */}
          <TabsContent value="optimizations" className="space-y-4">
            <div className="space-y-4">
              {optimizations.map((optimization, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg capitalize">
                        {optimization.category} Optimization
                      </CardTitle>
                      <Badge
                        className={
                          optimization.difficulty === 'easy'
                            ? 'bg-green-100 text-green-800'
                            : optimization.difficulty === 'moderate'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }
                      >
                        {optimization.difficulty}
                      </Badge>
                    </div>
                    <CardDescription>{optimization.suggestion}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Expected Impact:</span>
                        <span className="text-green-600">{optimization.expectedImpact}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Implementation Time:</span>
                        <span>{optimization.timeToImplement}</span>
                      </div>

                      <div>
                        <p className="mb-2 text-sm font-medium">Implementation Steps:</p>
                        <ol className="space-y-1 text-sm">
                          {optimization.implementationSteps.map((step: string, i: number) => (
                            <li key={i} className="flex items-start space-x-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-800">
                                {i + 1}
                              </span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {optimizations.length === 0 && !isLoading && (
              <Card>
                <CardContent className="p-8 text-center">
                  <BarChart3 className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <p className="text-gray-500">
                    No optimization suggestions available. Click refresh to analyze your operations.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Consumer Behavior Tab */}
          <TabsContent value="behavior" className="space-y-4">
            {consumerBehavior && (
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Cultural Insights</CardTitle>
                    <CardDescription>Filipino consumer behavior patterns</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {consumerBehavior.insights?.map((insight: string, index: number) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="font-bold text-blue-500">•</span>
                          <span className="text-sm">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Cultural Factors</CardTitle>
                    <CardDescription>Factors influencing purchasing decisions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {consumerBehavior.culturalFactors?.map((factor: string, index: number) => (
                        <Badge key={index} variant="outline" className="mb-1 mr-1">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Seasonal Patterns</CardTitle>
                    <CardDescription>Seasonal buying behaviors</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {consumerBehavior.seasonalPatterns?.map((pattern: string, index: number) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="font-bold text-green-500">•</span>
                          <span className="text-sm">{pattern}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recommended Strategies</CardTitle>
                    <CardDescription>Strategies to align with Filipino preferences</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {consumerBehavior.recommendedStrategies?.map(
                        (strategy: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="font-bold text-purple-500">•</span>
                            <span className="text-sm">{strategy}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}

            {!consumerBehavior && !isLoading && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Brain className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <p className="text-gray-500">
                    No consumer behavior analysis available. Click refresh to analyze patterns.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
