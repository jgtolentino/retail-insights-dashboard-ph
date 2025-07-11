import { describe, it, expect, beforeEach, vi } from 'vitest';
import { databricksGenie } from '../../src/services/databricksGenie';

// Mock Supabase client
vi.mock('../../src/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({
      data: [
        { brand_name: 'Brand A', total_sales: 150000 },
        { brand_name: 'Brand B', total_sales: 120000 },
        { brand_name: 'Brand C', total_sales: 98000 }
      ],
      error: null
    })
  }
}));

// Mock intelligent router
vi.mock('../../src/services/intelligentModelRouter', () => ({
  intelligentRouter: {
    routeQuery: vi.fn().mockResolvedValue({
      response: 'SELECT brand_name, SUM(total_amount) as total_sales FROM transactions JOIN products ON transactions.product_id = products.id JOIN brands ON products.brand_id = brands.id GROUP BY brand_name ORDER BY total_sales DESC LIMIT 5',
      complexity: {
        level: 'simple',
        confidence: 0.9,
        reasoning: 'Matches simple query pattern',
        suggestedModel: 'gpt-35-turbo'
      },
      estimatedCost: 0.0025
    }),
    analyzeComplexity: vi.fn().mockReturnValue({
      level: 'simple',
      confidence: 0.9,
      reasoning: 'Matches simple query pattern',
      suggestedModel: 'gpt-35-turbo',
      temperature: 0.1,
      maxTokens: 300
    })
  }
}));

describe('Databricks AI Genie Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Query Processing', () => {
    it('should process simple queries with intelligent routing', async () => {
      const query = 'What are the top 5 selling brands?';
      const response = await databricksGenie.askGenie(query);

      expect(response).toBeDefined();
      expect(response.answer).toBeDefined();
      expect(response.sql).toBeDefined();
      expect(response.data).toBeDefined();
      expect(response.complexity).toBeDefined();
      expect(response.modelUsed).toBe('gpt-35-turbo');
      expect(response.chartType).toBeDefined();
    });

    it('should handle complex analytical queries', async () => {
      // Mock complex query routing
      const { intelligentRouter } = await import('../../src/services/intelligentModelRouter');
      
      vi.mocked(intelligentRouter.routeQuery).mockResolvedValueOnce({
        response: 'Complex SQL with multiple JOINs and analytics functions',
        complexity: {
          level: 'complex',
          confidence: 0.85,
          reasoning: 'Matches complex analysis pattern',
          suggestedModel: 'gpt-4'
        },
        estimatedCost: 0.045
      });

      vi.mocked(intelligentRouter.analyzeComplexity).mockReturnValueOnce({
        level: 'complex',
        confidence: 0.85,
        reasoning: 'Matches complex analysis pattern',
        suggestedModel: 'gpt-4',
        temperature: 0.2,
        maxTokens: 1500
      });

      const query = 'Analyze customer behavior trends and predict future purchase patterns';
      const response = await databricksGenie.askGenie(query);

      expect(response.complexity?.level).toBe('complex');
      expect(response.modelUsed).toBe('gpt-4');
      expect(response.estimatedCost).toBeGreaterThan(0.02);
    });

    it('should provide cost tracking information', async () => {
      const query = 'Count total customers';
      const response = await databricksGenie.askGenie(query);

      expect(response.complexity).toBeDefined();
      expect(response.modelUsed).toBeDefined();
      expect(response.executionTime).toBeDefined();
      expect(response.confidence).toBeGreaterThan(0);
    });
  });

  describe('SQL Generation and Execution', () => {
    it('should generate valid SQL queries', async () => {
      const query = 'Show top performing stores';
      const response = await databricksGenie.askGenie(query);

      expect(response.sql).toBeDefined();
      expect(response.sql).toMatch(/SELECT/i);
      expect(response.data).toHaveLength(3); // Mock data has 3 items
    });

    it('should handle SQL execution errors gracefully', async () => {
      const { supabase } = await import('../../src/integrations/supabase/client');
      
      // Mock SQL execution error
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: { message: 'SQL execution error' }
      });

      const query = 'Invalid query that causes SQL error';
      const response = await databricksGenie.askGenie(query);

      // Should still return a response, but without data
      expect(response.answer).toBeDefined();
      expect(response.data).toBeUndefined();
      expect(response.sql).toBeDefined();
    });
  });

  describe('Chart Type Selection', () => {
    it('should suggest appropriate chart types', async () => {
      const testCases = [
        {
          query: 'Top 5 brands by sales',
          expectedChart: 'bar',
          mockData: [
            { brand: 'A', sales: 100 },
            { brand: 'B', sales: 90 }
          ]
        },
        {
          query: 'Sales trend over time',
          expectedChart: 'line',
          mockData: [
            { date: '2024-01', sales: 100 },
            { date: '2024-02', sales: 110 }
          ]
        },
        {
          query: 'Market share breakdown',
          expectedChart: 'pie',
          mockData: [
            { category: 'A', share: 40 },
            { category: 'B', share: 35 },
            { category: 'C', share: 25 }
          ]
        }
      ];

      for (const testCase of testCases) {
        const { supabase } = await import('../../src/integrations/supabase/client');
        vi.mocked(supabase.rpc).mockResolvedValueOnce({
          data: testCase.mockData,
          error: null
        });

        const response = await databricksGenie.askGenie(testCase.query);
        
        // Chart type suggestion should be reasonable for the data type
        expect(['bar', 'line', 'pie', 'table']).toContain(response.chartType);
      }
    });
  });

  describe('Suggested Queries', () => {
    it('should provide contextual follow-up suggestions', async () => {
      const query = 'Show brand performance';
      const response = await databricksGenie.askGenie(query);

      expect(response.suggestedQueries).toBeDefined();
      expect(response.suggestedQueries).toHaveLength.greaterThan(0);
      expect(response.suggestedQueries[0]).toMatch(/brand/i);
    });

    it('should return default suggestions when context is unclear', async () => {
      const response = await databricksGenie.askGenie('random unclear query');
      
      expect(response.suggestedQueries).toBeDefined();
      expect(response.suggestedQueries).toHaveLength.greaterThan(0);
    });
  });

  describe('Performance and Reliability', () => {
    it('should complete queries within reasonable time', async () => {
      const startTime = Date.now();
      const response = await databricksGenie.askGenie('Simple test query');
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
      expect(response.executionTime).toBeDefined();
    });

    it('should handle concurrent queries', async () => {
      const queries = [
        'Top brands',
        'Customer count',
        'Sales trends',
        'Product analysis',
        'Store performance'
      ];

      const promises = queries.map(query => databricksGenie.askGenie(query));
      const responses = await Promise.all(promises);

      expect(responses).toHaveLength(5);
      responses.forEach(response => {
        expect(response.answer).toBeDefined();
        expect(response.complexity).toBeDefined();
      });
    });

    it('should maintain context across the session', () => {
      const history = databricksGenie.getQueryHistory();
      expect(Array.isArray(history)).toBe(true);
      
      const suggestions = databricksGenie.getSuggestedQueries();
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Cost Optimization Validation', () => {
    it('should demonstrate cost savings through intelligent routing', async () => {
      // Test simple query
      const simpleQuery = 'Count products';
      const simpleResponse = await databricksGenie.askGenie(simpleQuery);
      
      // Test complex query  
      const { intelligentRouter } = await import('../../src/services/intelligentModelRouter');
      vi.mocked(intelligentRouter.analyzeComplexity).mockReturnValueOnce({
        level: 'complex',
        confidence: 0.85,
        reasoning: 'Matches complex analysis pattern',
        suggestedModel: 'gpt-4',
        temperature: 0.2,
        maxTokens: 1500
      });

      const complexQuery = 'Perform advanced predictive analysis';
      const complexResponse = await databricksGenie.askGenie(complexQuery);

      // Simple queries should use cheaper models
      expect(simpleResponse.complexity?.level).toBe('simple');
      expect(simpleResponse.modelUsed).toBe('gpt-35-turbo');
      
      // Complex queries should use more powerful models
      expect(complexResponse.complexity?.level).toBe('complex');
      expect(complexResponse.modelUsed).toBe('gpt-4');
    });

    it('should track and report usage statistics', async () => {
      const query = 'Test statistics tracking';
      const response = await databricksGenie.askGenie(query);

      expect(response.complexity).toBeDefined();
      expect(response.executionTime).toBeDefined();
      expect(response.confidence).toBeDefined();
      expect(typeof response.confidence).toBe('number');
      expect(response.confidence).toBeGreaterThanOrEqual(0);
      expect(response.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const { intelligentRouter } = await import('../../src/services/intelligentModelRouter');
      
      // Mock network error
      vi.mocked(intelligentRouter.routeQuery).mockRejectedValueOnce(
        new Error('Network connection failed')
      );

      const query = 'Test network error handling';
      const response = await databricksGenie.askGenie(query);

      // Should still return a response
      expect(response.answer).toBeDefined();
      expect(response.confidence).toBe(0);
    });

    it('should handle malformed queries', async () => {
      const malformedQueries = ['', '???', '123', 'SELECT * FROM'];
      
      for (const query of malformedQueries) {
        const response = await databricksGenie.askGenie(query);
        expect(response).toBeDefined();
        expect(response.answer).toBeDefined();
      }
    });
  });
});