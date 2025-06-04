
export interface AIRecommendation {
  id: string;
  type: 'upsell' | 'cross-sell' | 'substitution';
  title: string;
  description: string;
  confidence: number;
  products: string[];
  expectedLift: number;
}

export interface TranscriptionInsight {
  id: string;
  timestamp: string;
  transcription: string;
  intent: string;
  confidence: number;
  extractedEntities: Record<string, any>;
}

export interface DateRange {
  start: string;
  end: string;
}

// Mock enhanced analytics service
export const enhancedAnalyticsService = {
  async generateAIRecommendations(dateRange: DateRange): Promise<AIRecommendation[]> {
    return [
      {
        id: '1',
        type: 'upsell',
        title: 'Bundle Opportunity',
        description: 'Customers buying cigarettes often purchase coffee',
        confidence: 85,
        products: ['Cigarettes', 'Coffee'],
        expectedLift: 15
      }
    ];
  },

  async getTranscriptionInsights(dateRange: DateRange): Promise<TranscriptionInsight[]> {
    return [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        transcription: 'Customer asked for Marlboro',
        intent: 'product_request',
        confidence: 0.9,
        extractedEntities: { brand: 'Marlboro', category: 'cigarettes' }
      }
    ];
  }
};
