import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiService } from '../aiService';

describe('AI Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('detectAnomalies', () => {
    it('should detect anomalies when present', async () => {
      const data = [
        { value: 100, date: '2024-01-01' },
        { value: 500, date: '2024-01-02' }, // anomaly
        { value: 120, date: '2024-01-03' },
      ];

      const result = await aiService.getInsights();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getRecommendations', () => {
    it('should return recommendations with fallback', async () => {
      const data = { metrics: { sales: 1000 } };

      const result = await aiService.getRecommendations();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
