// AI service for generating insights - Mock implementation to avoid build errors
// In production, this would integrate with Azure OpenAI or other AI services

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

class AIService {
  /**
   * Generate AI-powered recommendations based on dashboard data
   */
  async getRecommendations(context: DashboardData): Promise<AIInsight[]> {
    // For now, return rule-based recommendations
    return this.getFallbackRecommendations(context);
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
          impact: 'negative',
        },
      });
    }

    return anomalies;
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
        content:
          'Revenue has declined. Consider promotional campaigns, customer retention programs, or new product introductions to boost sales.',
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
        content:
          'Strong transaction growth detected. Consider expanding inventory, optimizing checkout processes, or hiring additional staff to handle increased demand.',
        confidence: 0.9,
        priority: 'medium',
        timestamp: new Date().toISOString(),
      });
    }

    return recommendations;
  }
}

export const aiService = new AIService();
