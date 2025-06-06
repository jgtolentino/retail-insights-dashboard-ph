import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

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

export const aiService = {
  async getInsights(): Promise<AIInsight[]> {
    try {
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
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
  },

  async getRecommendations(): Promise<AIInsight[]> {
    try {
      const { data, error } = await supabase
        .from('ai_recommendations')
        .select('*')
        .order('priority', { ascending: false });

      if (error) {
        logger.error('Error fetching AI recommendations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getRecommendations:', error);
      return [];
    }
  },

  async getCompetitiveAnalysis(): Promise<any> {
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
};
