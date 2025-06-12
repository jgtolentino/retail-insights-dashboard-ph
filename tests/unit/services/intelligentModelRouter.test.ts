import { describe, it, expect, beforeEach } from 'vitest';
import { intelligentRouter } from '../../../src/services/intelligentModelRouter';

describe('Intelligent Model Router', () => {
  beforeEach(() => {
    // Reset any state if needed
  });

  describe('Complexity Analysis', () => {
    it('should route simple queries to GPT-3.5-turbo', () => {
      const testCases = [
        'show top 5 brands',
        'what is the total sales',
        'count customers',
        'list products',
        'get store locations'
      ];

      testCases.forEach(query => {
        const complexity = intelligentRouter.analyzeComplexity(query);
        expect(complexity.level).toBe('simple');
        expect(complexity.suggestedModel).toBe('gpt-35-turbo');
        expect(complexity.confidence).toBeGreaterThan(0.7);
      });
    });

    it('should route complex queries to GPT-4', () => {
      const testCases = [
        'analyze customer behavior trends over the past 6 months',
        'explain why TBWA brands are performing better than competitors',
        'predict future sales based on historical data',
        'compare regional performance with seasonal patterns',
        'optimize product mix for maximum profitability'
      ];

      testCases.forEach(query => {
        const complexity = intelligentRouter.analyzeComplexity(query);
        expect(complexity.level).toBe('complex');
        expect(complexity.suggestedModel).toBe('gpt-4');
        expect(complexity.confidence).toBeGreaterThan(0.7);
      });
    });

    it('should route medium complexity queries to GPT-3.5-turbo-16k', () => {
      const testCases = [
        'show sales by region with demographic breakdown',
        'analyze brand performance across multiple categories',
        'compare this month vs last month sales trends'
      ];

      testCases.forEach(query => {
        const complexity = intelligentRouter.analyzeComplexity(query);
        expect(['medium', 'complex']).toContain(complexity.level);
        if (complexity.level === 'medium') {
          expect(complexity.suggestedModel).toBe('gpt-35-turbo-16k');
        }
      });
    });

    it('should handle edge cases gracefully', () => {
      const edgeCases = [
        '', // empty string
        '?', // single character
        'a'.repeat(1000), // very long string
        '123 + 456', // math expression
      ];

      edgeCases.forEach(query => {
        const complexity = intelligentRouter.analyzeComplexity(query);
        expect(['simple', 'medium', 'complex']).toContain(complexity.level);
        expect(complexity.confidence).toBeGreaterThanOrEqual(0);
        expect(complexity.confidence).toBeLessThanOrEqual(1);
        expect(complexity.reasoning).toBeDefined();
        expect(complexity.suggestedModel).toBeDefined();
      });
    });
  });

  describe('Model Configuration', () => {
    it('should have correct model configurations', () => {
      const stats = intelligentRouter.getModelStats();
      
      // Check simple model config
      expect(stats.simple.deployment).toBe('gpt-35-turbo');
      expect(stats.simple.temperature).toBe(0.1);
      expect(stats.simple.maxTokens).toBe(300);
      expect(stats.simple.costPerToken).toBe(0.0005);

      // Check medium model config
      expect(stats.medium.deployment).toBe('gpt-35-turbo-16k');
      expect(stats.medium.temperature).toBe(0.3);
      expect(stats.medium.maxTokens).toBe(800);
      expect(stats.medium.costPerToken).toBe(0.001);

      // Check complex model config
      expect(stats.complex.deployment).toBe('gpt-4');
      expect(stats.complex.temperature).toBe(0.2);
      expect(stats.complex.maxTokens).toBe(1500);
      expect(stats.complex.costPerToken).toBe(0.03);
    });

    it('should allow model configuration updates', () => {
      const originalStats = intelligentRouter.getModelStats();
      
      // Update simple model config
      intelligentRouter.updateModelConfig('simple', {
        temperature: 0.2,
        maxTokens: 400
      });

      const updatedStats = intelligentRouter.getModelStats();
      expect(updatedStats.simple.temperature).toBe(0.2);
      expect(updatedStats.simple.maxTokens).toBe(400);
      
      // Restore original config
      intelligentRouter.updateModelConfig('simple', {
        temperature: originalStats.simple.temperature,
        maxTokens: originalStats.simple.maxTokens
      });
    });
  });

  describe('Pattern Recognition', () => {
    it('should recognize SQL complexity indicators', () => {
      const sqlQueries = [
        'show data with multiple joins across tables',
        'complex nested subquery analysis',
        'group by multiple columns with having clause'
      ];

      sqlQueries.forEach(query => {
        const complexity = intelligentRouter.analyzeComplexity(query);
        expect(complexity.level).toBe('complex');
        expect(complexity.reasoning).toMatch(/complex|SQL|nested/i);
      });
    });

    it('should recognize time-based analysis', () => {
      const timeQueries = [
        'show monthly trends over time',
        'analyze seasonal patterns',
        'historical data analysis',
        'yearly performance review'
      ];

      timeQueries.forEach(query => {
        const complexity = intelligentRouter.analyzeComplexity(query);
        expect(['medium', 'complex']).toContain(complexity.level);
      });
    });

    it('should recognize question complexity', () => {
      const complexQuestions = [
        'Why are sales declining in the north region?',
        'How can we improve customer retention?',
        'What if we change our pricing strategy?'
      ];

      complexQuestions.forEach(query => {
        const complexity = intelligentRouter.analyzeComplexity(query);
        expect(['medium', 'complex']).toContain(complexity.level);
      });
    });
  });

  describe('Cost Optimization', () => {
    it('should provide cost estimates', () => {
      const queries = [
        { text: 'count products', expectedLevel: 'simple' },
        { text: 'analyze complex customer segmentation patterns', expectedLevel: 'complex' }
      ];

      queries.forEach(({ text, expectedLevel }) => {
        const complexity = intelligentRouter.analyzeComplexity(text);
        expect(complexity.level).toBe(expectedLevel);
        
        const stats = intelligentRouter.getModelStats();
        const modelConfig = stats[expectedLevel];
        expect(modelConfig.costPerToken).toBeGreaterThan(0);
        
        if (expectedLevel === 'simple') {
          expect(modelConfig.costPerToken).toBeLessThan(0.001);
        } else if (expectedLevel === 'complex') {
          expect(modelConfig.costPerToken).toBeGreaterThan(0.01);
        }
      });
    });

    it('should demonstrate cost savings', () => {
      const simpleQuery = 'show top brands';
      const complexQuery = 'analyze multi-dimensional customer behavior patterns';

      const simpleComplexity = intelligentRouter.analyzeComplexity(simpleQuery);
      const complexComplexity = intelligentRouter.analyzeComplexity(complexQuery);

      const stats = intelligentRouter.getModelStats();
      const simpleCost = stats[simpleComplexity.level].costPerToken;
      const complexCost = stats[complexComplexity.level].costPerToken;

      // Complex queries should cost significantly more per token
      expect(complexCost).toBeGreaterThan(simpleCost * 10);
      
      // But intelligent routing ensures we only pay for complexity when needed
      expect(simpleComplexity.level).toBe('simple');
      expect(complexComplexity.level).toBe('complex');
    });
  });

  describe('Performance', () => {
    it('should analyze complexity quickly', () => {
      const testQueries = [
        'simple query',
        'medium complexity analysis with multiple criteria',
        'highly complex multi-dimensional analytical query with temporal patterns and predictive modeling requirements'
      ];

      testQueries.forEach(query => {
        const startTime = performance.now();
        const complexity = intelligentRouter.analyzeComplexity(query);
        const endTime = performance.now();
        
        // Analysis should complete in under 10ms
        expect(endTime - startTime).toBeLessThan(10);
        expect(complexity).toBeDefined();
      });
    });

    it('should handle concurrent analysis', async () => {
      const queries = Array.from({ length: 100 }, (_, i) => 
        `test query ${i} with ${i % 3 === 0 ? 'complex analysis patterns' : 'simple data'}`
      );

      const startTime = performance.now();
      const results = queries.map(query => intelligentRouter.analyzeComplexity(query));
      const endTime = performance.now();

      // All analyses should complete quickly
      expect(endTime - startTime).toBeLessThan(100);
      expect(results).toHaveLength(100);
      
      // Results should be consistent
      results.forEach(result => {
        expect(['simple', 'medium', 'complex']).toContain(result.level);
        expect(result.confidence).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Reliability', () => {
    it('should provide consistent results for same query', () => {
      const query = 'analyze customer segmentation patterns';
      const results = Array.from({ length: 10 }, () => 
        intelligentRouter.analyzeComplexity(query)
      );

      // All results should be identical
      const firstResult = results[0];
      results.forEach(result => {
        expect(result.level).toBe(firstResult.level);
        expect(result.suggestedModel).toBe(firstResult.suggestedModel);
        expect(result.confidence).toBe(firstResult.confidence);
      });
    });

    it('should handle malformed queries gracefully', () => {
      const malformedQueries = [
        null,
        undefined,
        {},
        [],
        123,
        true,
        new Date(),
      ];

      malformedQueries.forEach(query => {
        expect(() => {
          // Cast to string as the function expects a string
          const complexity = intelligentRouter.analyzeComplexity(String(query));
          expect(complexity).toBeDefined();
        }).not.toThrow();
      });
    });
  });
});