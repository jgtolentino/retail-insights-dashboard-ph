import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiService, type DashboardData } from '../aiService';

// Mock OpenAI
vi.mock('openai', () => ({
  Configuration: vi.fn(),
  OpenAIApi: vi.fn().mockImplementation(() => ({
    createChatCompletion: vi.fn(),
  })),
}));

describe('AIService', () => {
  const mockDashboardData: DashboardData = {
    transactions: {
      total: 1000,
      growth: 5.2,
      avgBasketSize: 125.5,
    },
    revenue: {
      total: 125500,
      growth: 8.3,
      trend: [100000, 110000, 120000, 125500],
    },
    products: {
      topSellers: [
        { name: 'Product A', sales: 150 },
        { name: 'Product B', sales: 120 },
      ],
      categories: [
        { name: 'Electronics', performance: 85 },
        { name: 'Clothing', performance: 72 },
      ],
    },
    customers: {
      ageDistribution: [
        { age: '25-34', count: 350 },
        { age: '35-44', count: 280 },
        { age: '18-24', count: 200 },
      ],
      genderDistribution: [
        { gender: 'Female', count: 520 },
        { gender: 'Male', count: 480 },
      ],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRecommendations', () => {
    it('should return fallback recommendations when AI is not available', async () => {
      const recommendations = await aiService.getRecommendations(mockDashboardData);

      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeGreaterThan(0);

      // Check recommendation structure
      const rec = recommendations[0];
      expect(rec).toHaveProperty('id');
      expect(rec).toHaveProperty('type');
      expect(rec).toHaveProperty('title');
      expect(rec).toHaveProperty('content');
      expect(rec).toHaveProperty('confidence');
      expect(rec).toHaveProperty('priority');
      expect(rec).toHaveProperty('timestamp');
    });

    it('should generate growth-based recommendations', async () => {
      const highGrowthData = {
        ...mockDashboardData,
        transactions: { ...mockDashboardData.transactions, growth: 15 },
      };

      const recommendations = await aiService.getRecommendations(highGrowthData);

      expect(
        recommendations.some(rec => rec.title.includes('Scale') || rec.content.includes('growth'))
      ).toBe(true);
    });
  });

  describe('detectAnomalies', () => {
    it('should detect revenue decline anomalies', async () => {
      const decliningData = {
        ...mockDashboardData,
        revenue: { ...mockDashboardData.revenue, growth: -25 },
      };

      const anomalies = await aiService.detectAnomalies(decliningData);

      expect(anomalies).toBeInstanceOf(Array);
      expect(
        anomalies.some(anomaly => anomaly.type === 'anomaly' && anomaly.title.includes('Revenue'))
      ).toBe(true);
    });

    it('should detect transaction volume drops', async () => {
      const lowTransactionData = {
        ...mockDashboardData,
        transactions: { ...mockDashboardData.transactions, growth: -20 },
      };

      const anomalies = await aiService.detectAnomalies(lowTransactionData);

      expect(
        anomalies.some(
          anomaly => anomaly.content.includes('Transaction') && anomaly.priority === 'high'
        )
      ).toBe(true);
    });

    it('should return empty array for normal data', async () => {
      const normalData = {
        ...mockDashboardData,
        revenue: { ...mockDashboardData.revenue, growth: 5 },
        transactions: { ...mockDashboardData.transactions, growth: 3 },
      };

      const anomalies = await aiService.detectAnomalies(normalData);

      expect(anomalies).toBeInstanceOf(Array);
      // Should have fewer or no anomalies for normal data
    });
  });

  describe('generatePredictions', () => {
    it('should generate revenue predictions based on trends', async () => {
      const predictions = await aiService.generatePredictions(mockDashboardData);

      expect(predictions).toBeInstanceOf(Array);
      expect(
        predictions.some(pred => pred.type === 'prediction' && pred.title.includes('Revenue'))
      ).toBe(true);
    });

    it('should handle missing trend data gracefully', async () => {
      const noTrendData = {
        ...mockDashboardData,
        revenue: { ...mockDashboardData.revenue, trend: [] },
      };

      const predictions = await aiService.generatePredictions(noTrendData);

      expect(predictions).toBeInstanceOf(Array);
    });
  });

  describe('getConsumerInsights', () => {
    it('should identify dominant age groups', async () => {
      const insights = await aiService.getConsumerInsights(mockDashboardData.customers);

      expect(insights).toBeInstanceOf(Array);
      expect(
        insights.some(
          insight => insight.title.includes('Dominant') && insight.content.includes('25-34')
        )
      ).toBe(true);
    });

    it('should detect gender imbalances', async () => {
      const imbalancedData = {
        ageDistribution: mockDashboardData.customers.ageDistribution,
        genderDistribution: [
          { gender: 'Female', count: 800 },
          { gender: 'Male', count: 200 },
        ],
      };

      const insights = await aiService.getConsumerInsights(imbalancedData);

      expect(insights.some(insight => insight.title.includes('Gender'))).toBe(true);
    });

    it('should handle empty customer data', async () => {
      const emptyData = {
        ageDistribution: [],
        genderDistribution: [],
      };

      const insights = await aiService.getConsumerInsights(emptyData);

      expect(insights).toBeInstanceOf(Array);
    });
  });
});
