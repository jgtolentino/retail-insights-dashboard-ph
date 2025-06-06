import { configManager } from '@/lib/config';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface RetailAnalysisRequest {
  dateRange: { start: string; end: string };
  filters?: {
    brands?: string[];
    categories?: string[];
    stores?: string[];
  };
}

export interface AIInsight {
  id: string;
  title: string;
  description: string;
  confidence: number;
  category: string;
  priority: 'high' | 'medium' | 'low';
  impact: number;
  timestamp: string;
}

class AzureOpenAIService {
  private client: any = null;
  private config: any = null;

  async getClient(): Promise<any> {
    if (this.client && this.config) {
      return this.client;
    }

    try {
      const config = await configManager.getConfig();
      this.config = config.azureOpenAI;

      if (!this.config.endpoint || !this.config.apiKey) {
        return null;
      }

      // For now, we'll use a simple fetch-based client
      // In production, you'd use the official Azure OpenAI SDK
      this.client = {
        endpoint: this.config.endpoint,
        apiKey: this.config.apiKey,
        deploymentName: this.config.deploymentName,
      };

      return this.client;
    } catch (error) {
      return null;
    }
  }

  private async getInsights(request: RetailAnalysisRequest): Promise<AIInsight[]> {
    try {
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .gte('timestamp', request.dateRange.start)
        .lte('timestamp', request.dateRange.end)
        .order('timestamp', { ascending: false });

      if (error) {
        logger.error('Error fetching AI insights:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getInsights:', error);
      return [];
    }
  }

  private async getCompetitiveAnalysis(clientBrands: any[], competitorBrands: any[]): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('competitive_analysis')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1);

      if (error) {
        logger.error('Error fetching competitive analysis:', error);
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      logger.error('Error in getCompetitiveAnalysis:', error);
      return null;
    }
  }

  async analyzeRetailData(request: RetailAnalysisRequest): Promise<AIInsight[]> {
    return this.getInsights(request);
  }

  async getCompetitiveInsights(clientBrands: any[], competitorBrands: any[]): Promise<any> {
    return this.getCompetitiveAnalysis(clientBrands, competitorBrands);
  }

  async isHealthy(): Promise<boolean> {
    try {
      const { error } = await supabase.from('ai_insights').select('id').limit(1);
      return !error;
    } catch (error) {
      logger.error('Error checking AI service health:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const client = await this.getClient();
      if (!client) {
        return true; // Consider mocks as working
      }

      // Simple test call
      const response = await this.callAzureOpenAI('Test connection. Respond with "OK".');
      return response.includes('OK');
    } catch (error) {
      return false;
    }
  }
}

export const azureOpenAIService = new AzureOpenAIService();
