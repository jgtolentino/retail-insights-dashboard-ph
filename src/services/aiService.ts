import { Configuration, OpenAIApi } from 'openai';

// AI Insight Types
export interface AIInsight {
  id: string;
  type: 'recommendation' | 'anomaly' | 'prediction' | 'trend';
  title: string;
  content: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  actions?: Array<{
    label: string;
    type: 'primary' | 'secondary';
    onClick: () => void;
  }>;
  metadata?: {
    affectedMetrics?: string[];
    timeframe?: string;
    impact?: 'positive' | 'negative' | 'neutral';
  };
}

export interface DashboardData {
  transactions: {
    total: number;
    growth: number;
    avgBasketSize: number;
  };
  revenue: {
    total: number;
    growth: number;
    trend: number[];
  };
  products: {
    topSellers: Array<{ name: string; sales: number }>;
    categories: Array<{ name: string; performance: number }>;
  };
  customers: {
    ageDistribution: Array<{ age: string; count: number }>;
    genderDistribution: Array<{ gender: string; count: number }>;
  };
  timeData?: {
    hourlyTrends: Array<{ hour: number; sales: number }>;
    dailyTrends: Array<{ date: string; sales: number }>;
  };
}

export interface AnomalyData {
  metric: string;
  value: number;
  expected: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high';
  context?: string;
}

class AIService {
  private openai: OpenAIApi | null = null;

  constructor() {
    // Initialize Azure OpenAI client if credentials are available
    if (import.meta.env.VITE_AZURE_OPENAI_KEY && import.meta.env.VITE_AZURE_OPENAI_ENDPOINT) {
      const configuration = new Configuration({
        apiKey: import.meta.env.VITE_AZURE_OPENAI_KEY,
        basePath: `${import.meta.env.VITE_AZURE_OPENAI_ENDPOINT}/openai/deployments/${import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT || 'gpt-4'}`,
        baseOptions: {
          headers: {
            'api-key': import.meta.env.VITE_AZURE_OPENAI_KEY,
          },
          params: {
            'api-version': '2024-02-15-preview'
          }
        }
      });
      
      this.openai = new OpenAIApi(configuration);
    }
  }

  /**
   * Generate AI-powered recommendations based on dashboard data
   */
  async getRecommendations(context: DashboardData): Promise<AIInsight[]> {
    try {
      if (!this.openai) {
        return this.getFallbackRecommendations(context);
      }

      const prompt = this.buildRecommendationPrompt(context);
      
      const response = await this.openai.createChatCompletion({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a retail analytics AI assistant. Analyze the provided data and generate actionable business recommendations. Focus on practical insights that can improve sales, customer satisfaction, and operational efficiency.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      });

      const recommendations = this.parseAIResponse(response.data.choices[0]?.message?.content || '');
      return recommendations;
      
    } catch (error) {
      console.warn('AI service error, falling back to rule-based recommendations:', error);
      return this.getFallbackRecommendations(context);
    }
  }

  /**
   * Detect anomalies in the data
   */
  async detectAnomalies(metrics: DashboardData): Promise<AIInsight[]> {
    const anomalies: AIInsight[] = [];

    // Revenue growth anomaly
    if (metrics.revenue.growth < -20) {
      anomalies.push({
        id: `anomaly-revenue-${Date.now()}`,
        type: 'anomaly',
        title: 'Significant Revenue Decline Detected',
        content: `Revenue has declined by ${Math.abs(metrics.revenue.growth).toFixed(1)}% compared to the previous period. This requires immediate attention.`,
        confidence: 0.9,
        priority: 'critical',
        timestamp: new Date().toISOString(),
        metadata: {
          affectedMetrics: ['revenue'],
          impact: 'negative'
        }
      });
    }

    // Transaction volume anomaly
    if (metrics.transactions.growth < -15) {
      anomalies.push({
        id: `anomaly-transactions-${Date.now()}`,
        type: 'anomaly',
        title: 'Transaction Volume Drop',
        content: `Transaction count has decreased by ${Math.abs(metrics.transactions.growth).toFixed(1)}%. Consider investigating customer acquisition channels.`,
        confidence: 0.8,
        priority: 'high',
        timestamp: new Date().toISOString(),
        metadata: {
          affectedMetrics: ['transactions'],
          impact: 'negative'
        }
      });
    }

    // Basket size anomaly
    if (metrics.transactions.avgBasketSize > 0) {
      const expectedRange = [50, 500]; // Example range
      if (metrics.transactions.avgBasketSize < expectedRange[0] || metrics.transactions.avgBasketSize > expectedRange[1]) {
        anomalies.push({
          id: `anomaly-basket-${Date.now()}`,
          type: 'anomaly',
          title: 'Unusual Average Basket Size',
          content: `Average basket size of ₱${metrics.transactions.avgBasketSize.toFixed(2)} is outside normal range. This may indicate data quality issues or significant customer behavior changes.`,
          confidence: 0.7,
          priority: 'medium',
          timestamp: new Date().toISOString(),
          metadata: {
            affectedMetrics: ['avgBasketSize'],
            impact: 'neutral'
          }
        });
      }
    }

    return anomalies;
  }

  /**
   * Generate predictions based on historical data
   */
  async generatePredictions(context: DashboardData): Promise<AIInsight[]> {
    const predictions: AIInsight[] = [];

    // Simple trend-based prediction for revenue
    if (context.revenue.trend && context.revenue.trend.length >= 3) {
      const recentTrend = context.revenue.trend.slice(-3);
      const avgGrowth = recentTrend.reduce((acc, val, i) => {
        if (i === 0) return acc;
        return acc + ((val - recentTrend[i-1]) / recentTrend[i-1]);
      }, 0) / (recentTrend.length - 1);

      const nextPeriodPrediction = context.revenue.total * (1 + avgGrowth);
      
      predictions.push({
        id: `prediction-revenue-${Date.now()}`,
        type: 'prediction',
        title: 'Revenue Forecast',
        content: `Based on recent trends, next period revenue is predicted to be ₱${nextPeriodPrediction.toLocaleString('en-PH', { minimumFractionDigits: 2 })} (${(avgGrowth * 100).toFixed(1)}% change).`,
        confidence: 0.75,
        priority: 'medium',
        timestamp: new Date().toISOString(),
        metadata: {
          affectedMetrics: ['revenue'],
          timeframe: 'next period',
          impact: avgGrowth > 0 ? 'positive' : 'negative'
        }
      });
    }

    return predictions;
  }

  /**
   * Get consumer profiling insights with AI enhancement
   */
  async getConsumerInsights(customerData: DashboardData['customers']): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // Age distribution analysis
    if (customerData.ageDistribution && customerData.ageDistribution.length > 0) {
      const totalCustomers = customerData.ageDistribution.reduce((sum, item) => sum + item.count, 0);
      const dominantAgeGroup = customerData.ageDistribution.reduce((prev, current) => 
        prev.count > current.count ? prev : current
      );
      
      const percentage = ((dominantAgeGroup.count / totalCustomers) * 100).toFixed(1);
      
      insights.push({
        id: `insight-age-${Date.now()}`,
        type: 'recommendation',
        title: 'Dominant Customer Segment Identified',
        content: `${dominantAgeGroup.age} age group represents ${percentage}% of your customer base. Consider tailoring marketing campaigns and product offerings to this demographic.`,
        confidence: 0.85,
        priority: 'medium',
        timestamp: new Date().toISOString(),
        actions: [
          {
            label: 'View Age Segments',
            type: 'primary',
            onClick: () => window.location.hash = '#consumer-insights'
          }
        ],
        metadata: {
          affectedMetrics: ['customer demographics'],
          impact: 'positive'
        }
      });
    }

    // Gender distribution analysis
    if (customerData.genderDistribution && customerData.genderDistribution.length > 0) {
      const genderBalance = customerData.genderDistribution.reduce((acc, item) => {
        acc[item.gender.toLowerCase()] = item.count;
        return acc;
      }, {} as Record<string, number>);

      const total = Object.values(genderBalance).reduce((sum, count) => sum + count, 0);
      const imbalanceThreshold = 0.3; // 30% threshold for significant imbalance

      Object.entries(genderBalance).forEach(([gender, count]) => {
        const percentage = count / total;
        if (percentage > (1 - imbalanceThreshold)) {
          insights.push({
            id: `insight-gender-${gender}-${Date.now()}`,
            type: 'recommendation',
            title: 'Gender Skew Opportunity',
            content: `${gender.charAt(0).toUpperCase() + gender.slice(1)} customers represent ${(percentage * 100).toFixed(1)}% of your base. Consider strategies to diversify your customer demographics.`,
            confidence: 0.7,
            priority: 'low',
            timestamp: new Date().toISOString(),
            metadata: {
              affectedMetrics: ['customer demographics'],
              impact: 'neutral'
            }
          });
        }
      });
    }

    return insights;
  }

  /**
   * Build prompt for AI recommendations
   */
  private buildRecommendationPrompt(context: DashboardData): string {
    return `
Analyze this retail store data and provide 3-5 actionable business recommendations:

PERFORMANCE METRICS:
- Total Transactions: ${context.transactions.total}
- Transaction Growth: ${context.transactions.growth}%
- Total Revenue: ₱${context.revenue.total.toLocaleString()}
- Revenue Growth: ${context.revenue.growth}%
- Average Basket Size: ₱${context.transactions.avgBasketSize}

TOP PRODUCTS:
${context.products.topSellers.map(p => `- ${p.name}: ${p.sales} sales`).join('\n')}

CUSTOMER DEMOGRAPHICS:
Age Distribution: ${context.customers.ageDistribution.map(a => `${a.age}: ${a.count}`).join(', ')}
Gender Distribution: ${context.customers.genderDistribution.map(g => `${g.gender}: ${g.count}`).join(', ')}

Please provide specific, actionable recommendations in this JSON format:
{
  "recommendations": [
    {
      "title": "Recommendation Title",
      "content": "Detailed recommendation description",
      "priority": "high|medium|low",
      "confidence": 0.8,
      "type": "recommendation"
    }
  ]
}
    `;
  }

  /**
   * Parse AI response into structured insights
   */
  private parseAIResponse(response: string): AIInsight[] {
    try {
      const parsed = JSON.parse(response);
      return parsed.recommendations.map((rec: any, index: number) => ({
        id: `ai-rec-${Date.now()}-${index}`,
        type: rec.type || 'recommendation',
        title: rec.title,
        content: rec.content,
        confidence: rec.confidence || 0.8,
        priority: rec.priority || 'medium',
        timestamp: new Date().toISOString(),
      }));
    } catch (error) {
      console.warn('Could not parse AI response:', error);
      return [];
    }
  }

  /**
   * Fallback recommendations when AI is not available
   */
  private getFallbackRecommendations(context: DashboardData): AIInsight[] {
    const recommendations: AIInsight[] = [];

    // Revenue-based recommendations
    if (context.revenue.growth < 0) {
      recommendations.push({
        id: `fallback-revenue-${Date.now()}`,
        type: 'recommendation',
        title: 'Revenue Recovery Strategy',
        content: 'Revenue has declined. Consider promotional campaigns, customer retention programs, or new product introductions to boost sales.',
        confidence: 0.8,
        priority: 'high',
        timestamp: new Date().toISOString(),
      });
    }

    // Transaction growth recommendations
    if (context.transactions.growth > 10) {
      recommendations.push({
        id: `fallback-growth-${Date.now()}`,
        type: 'recommendation',
        title: 'Scale Operations',
        content: 'Strong transaction growth detected. Consider expanding inventory, optimizing checkout processes, or hiring additional staff to handle increased demand.',
        confidence: 0.9,
        priority: 'medium',
        timestamp: new Date().toISOString(),
      });
    }

    // Product performance recommendations
    if (context.products.topSellers.length > 0) {
      const topProduct = context.products.topSellers[0];
      recommendations.push({
        id: `fallback-product-${Date.now()}`,
        type: 'recommendation',
        title: 'Leverage Top Performer',
        content: `${topProduct.name} is your top seller with ${topProduct.sales} sales. Consider cross-selling complementary products or creating bundles to increase basket size.`,
        confidence: 0.85,
        priority: 'medium',
        timestamp: new Date().toISOString(),
      });
    }

    return recommendations;
  }
}

export const aiService = new AIService();