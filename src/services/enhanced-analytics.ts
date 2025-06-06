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

export interface SubstitutionPattern {
  original_product: string;
  substitute_product: string;
  original_brand: string;
  substitute_brand: string;
  substitution_count: number;
  acceptance_rate: number;
  category: string;
}

export interface DashboardSummary {
  totalTransactions: number;
  totalRevenue: number;
  avgCheckoutTime: number;
  avgSubstitutionRate: number;
  avgDigitalPaymentRate: number;
}

export interface DateRange {
  start: string;
  end: string;
}

// Enhanced analytics service with substitution patterns and dashboard summary
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
        expectedLift: 15,
      },
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
        extractedEntities: { brand: 'Marlboro', category: 'cigarettes' },
      },
    ];
  },

  async getSubstitutionPatterns(dateRange?: DateRange): Promise<SubstitutionPattern[]> {
    // Mock substitution patterns data
    return [
      {
        original_product: 'Marlboro Gold',
        substitute_product: 'Philip Morris',
        original_brand: 'Marlboro',
        substitute_brand: 'Philip Morris',
        substitution_count: 45,
        acceptance_rate: 0.78,
        category: 'Cigarettes',
      },
      {
        original_product: 'Coca-Cola Regular',
        substitute_product: 'Pepsi Cola',
        original_brand: 'Coca-Cola',
        substitute_brand: 'Pepsi',
        substitution_count: 32,
        acceptance_rate: 0.65,
        category: 'Beverages',
      },
      {
        original_product: 'Lucky Me Beef',
        substitute_product: 'Nissin Beef',
        original_brand: 'Lucky Me',
        substitute_brand: 'Nissin',
        substitution_count: 28,
        acceptance_rate: 0.82,
        category: 'Instant Noodles',
      },
    ];
  },

  async getDashboardSummary(dateRange: DateRange): Promise<DashboardSummary> {
    // Mock dashboard summary
    return {
      totalTransactions: 18002,
      totalRevenue: 4713642,
      avgCheckoutTime: 45.3,
      avgSubstitutionRate: 2.8,
      avgDigitalPaymentRate: 67.5,
    };
  },
};
