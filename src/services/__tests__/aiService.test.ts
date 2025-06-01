import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectAnomalies, getRecommendations } from '../aiService';

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

      const result = await detectAnomalies(data);
      expect(result.detected).toBe(true);
      expect(result.anomalies.length).toBeGreaterThan(0);
    });
  });

  describe('getRecommendations', () => {
    it('should return recommendations with fallback', async () => {
      const data = { metrics: { sales: 1000 } };

      const result = await getRecommendations(data);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
