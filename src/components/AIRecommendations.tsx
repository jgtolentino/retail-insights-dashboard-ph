/**
 * Enhanced AI Recommendations Panel
 * Provides intelligent insights and actionable recommendations based on data patterns
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Target,
  AlertCircle,
  TrendingUp,
  Lightbulb,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  ShoppingCart,
  MessageSquare,
  Brain,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  enhancedAnalyticsService,
  AIRecommendation,
  TranscriptionInsight,
  DateRange,
} from '@/services/enhanced-analytics';

interface AIRecommendationsProps {
  dateRange?: DateRange;
  className?: string;
}

interface NLPInsights {
  sentimentAnalysis: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topPhrases: Array<{
    phrase: string;
    frequency: number;
    sentiment: number;
  }>;
  communicationPatterns: Array<{
    pattern: string;
    impact: string;
    recommendation: string;
  }>;
}

export function AIRecommendations({ dateRange, className }: AIRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [nlpInsights, setNlpInsights] = useState<NLPInsights>({
    sentimentAnalysis: { positive: 0, neutral: 0, negative: 0 },
    topPhrases: [],
    communicationPatterns: [],
  });
  const [transcriptionInsights, setTranscriptionInsights] = useState<TranscriptionInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAIRecommendations();
  }, [dateRange]);

  const loadAIRecommendations = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Load AI recommendations and transcription insights
      const [recommendations, transcriptions] = await Promise.all([
        enhancedAnalyticsService.generateAIRecommendations(dateRange),
        enhancedAnalyticsService.getTranscriptionInsights(dateRange),
      ]);

      setRecommendations(recommendations);
      setTranscriptionInsights(transcriptions);

      // Process NLP insights
      const nlpData = processNLPInsights(transcriptions);
      setNlpInsights(nlpData);
    } catch (err) {
      console.error('Error loading AI recommendations:', err);
      setError('Failed to load AI recommendations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const processNLPInsights = (insights: TranscriptionInsight[]): NLPInsights => {
    // Calculate sentiment distribution
    const totalInsights = insights.length;
    const positive = insights.filter(i => i.sentiment_score >= 0.7).length;
    const negative = insights.filter(i => i.sentiment_score < 0.5).length;
    const neutral = totalInsights - positive - negative;

    const sentimentAnalysis = {
      positive: totalInsights > 0 ? (positive / totalInsights) * 100 : 0,
      neutral: totalInsights > 0 ? (neutral / totalInsights) * 100 : 0,
      negative: totalInsights > 0 ? (negative / totalInsights) * 100 : 0,
    };

    // Extract top phrases
    const topPhrases = insights.slice(0, 8).map(insight => ({
      phrase: insight.common_phrase,
      frequency: insight.frequency,
      sentiment: insight.sentiment_score,
    }));

    // Generate communication patterns
    const communicationPatterns = generateCommunicationPatterns(insights);

    return {
      sentimentAnalysis,
      topPhrases,
      communicationPatterns,
    };
  };

  const generateCommunicationPatterns = (insights: TranscriptionInsight[]) => {
    const patterns = [];

    // Analyze out of stock responses
    const outOfStockInsights = insights.filter(
      i =>
        i.common_phrase.toLowerCase().includes('out of stock') ||
        i.common_phrase.toLowerCase().includes('wala po')
    );

    if (outOfStockInsights.length > 0) {
      patterns.push({
        pattern: 'High Out-of-Stock Responses',
        impact: `${outOfStockInsights.reduce((sum, i) => sum + i.frequency, 0)} customer interactions`,
        recommendation: 'Improve inventory management and implement stock alerts',
      });
    }

    // Analyze gesture-based requests
    const gestureRequests = insights.filter(
      i =>
        i.common_phrase.toLowerCase().includes('gesture') ||
        i.common_phrase.toLowerCase().includes('points')
    );

    if (gestureRequests.length > 0) {
      patterns.push({
        pattern: 'Gesture-Based Communication',
        impact: `${gestureRequests.reduce((sum, i) => sum + i.frequency, 0)} pointing interactions`,
        recommendation: 'Enhance product labeling and visual merchandising',
      });
    }

    // Analyze brand clarifications
    const brandClarifications = insights.filter(
      i =>
        i.common_phrase.toLowerCase().includes('brand clarification') ||
        i.common_phrase.toLowerCase().includes('anong brand')
    );

    if (brandClarifications.length > 0) {
      patterns.push({
        pattern: 'Brand Clarification Requests',
        impact: `${brandClarifications.reduce((sum, i) => sum + i.frequency, 0)} clarification requests`,
        recommendation: 'Train staff on brand knowledge and create quick reference guides',
      });
    }

    return patterns.slice(0, 5);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'inventory':
        return <ShoppingCart className="h-4 w-4" />;
      case 'operations':
        return <Clock className="h-4 w-4" />;
      case 'merchandising':
        return <TrendingUp className="h-4 w-4" />;
      case 'customer_service':
        return <Users className="h-4 w-4" />;
      case 'pricing':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Powered Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-96 items-center justify-center">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Generating AI insights...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            AI-Powered Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-96 items-center justify-center">
            <div className="text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
              <p className="mb-4 text-red-600">{error}</p>
              <Button onClick={() => loadAIRecommendations(true)} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Powered Recommendations
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadAIRecommendations(true)}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="recommendations" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="nlp">NLP Insights</TabsTrigger>
            <TabsTrigger value="patterns">Communication</TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations" className="space-y-4">
            {recommendations.length === 0 ? (
              <div className="py-8 text-center">
                <Lightbulb className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <p className="text-gray-600">No recommendations available for this period</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recommendations.map(rec => (
                  <div key={rec.id} className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          {getPriorityIcon(rec.priority)}
                          <h4 className="font-medium">{rec.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {rec.category.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="mb-3 text-sm text-gray-600">{rec.description}</p>

                        <div className="space-y-2">
                          <h5 className="text-xs font-medium text-gray-800">Action Items:</h5>
                          <ul className="space-y-1 text-xs">
                            {rec.actionItems.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle className="mt-0.5 h-3 w-3 flex-shrink-0 text-green-500" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="ml-4 text-right">
                        <div className="text-2xl font-bold text-green-600">
                          +{rec.potentialIncrease}%
                        </div>
                        <div className="text-xs text-gray-500">potential lift</div>
                        <Badge
                          variant={
                            rec.impact === 'high'
                              ? 'destructive'
                              : rec.impact === 'medium'
                                ? 'default'
                                : 'secondary'
                          }
                          className="mt-2"
                        >
                          {rec.impact} impact
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="nlp" className="space-y-4">
            {/* Sentiment Analysis */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Customer Sentiment Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {(nlpInsights.sentimentAnalysis.positive || 0).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Positive</div>
                    <Progress value={nlpInsights.sentimentAnalysis.positive} className="mt-2 h-2" />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {(nlpInsights.sentimentAnalysis.neutral || 0).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Neutral</div>
                    <Progress value={nlpInsights.sentimentAnalysis.neutral} className="mt-2 h-2" />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {(nlpInsights.sentimentAnalysis.negative || 0).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Negative</div>
                    <Progress value={nlpInsights.sentimentAnalysis.negative} className="mt-2 h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Customer Phrases */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Top Customer Phrases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {nlpInsights.topPhrases.map((phrase, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded border p-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{phrase.phrase}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            phrase.sentiment >= 0.7
                              ? 'default'
                              : phrase.sentiment >= 0.5
                                ? 'secondary'
                                : 'destructive'
                          }
                          className="text-xs"
                        >
                          {phrase.sentiment >= 0.7
                            ? 'Positive'
                            : phrase.sentiment >= 0.5
                              ? 'Neutral'
                              : 'Negative'}
                        </Badge>
                        <span className="text-xs text-gray-500">{phrase.frequency}x</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patterns" className="space-y-4">
            {nlpInsights.communicationPatterns.length === 0 ? (
              <div className="py-8 text-center">
                <MessageSquare className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <p className="text-gray-600">No communication patterns detected</p>
              </div>
            ) : (
              <div className="space-y-3">
                {nlpInsights.communicationPatterns.map((pattern, idx) => (
                  <Card key={idx}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <MessageSquare className="mt-0.5 h-5 w-5 text-blue-500" />
                        <div className="flex-1">
                          <h4 className="mb-1 font-medium">{pattern.pattern}</h4>
                          <p className="mb-2 text-sm text-gray-600">{pattern.impact}</p>
                          <div className="flex items-start gap-2">
                            <Lightbulb className="mt-0.5 h-4 w-4 text-yellow-500" />
                            <p className="text-sm text-gray-800">{pattern.recommendation}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default AIRecommendations;
