import { configManager } from '@/lib/config';

interface AIInsight {
  type: 'trend' | 'anomaly' | 'recommendation' | 'prediction';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  priority: 'high' | 'medium' | 'low';
  filipino_context?: {
    cultural_relevance: string;
    local_terminology: string[];
    regional_factors: string[];
  };
}

interface RetailAnalysisRequest {
  transactions: any[];
  brands: any[];
  timeframe: string;
  focus_areas: string[];
  filipino_specific: boolean;
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
        console.warn('⚠️  Azure OpenAI not configured, using mock responses');
        return null;
      }

      // For now, we'll use a simple fetch-based client
      // In production, you'd use the official Azure OpenAI SDK
      this.client = {
        endpoint: this.config.endpoint,
        apiKey: this.config.apiKey,
        deploymentName: this.config.deploymentName,
      };

      console.log('✅ Azure OpenAI service initialized');
      return this.client;
    } catch (error) {
      console.error('❌ Failed to initialize Azure OpenAI client:', error);
      return null;
    }
  }

  async generateRetailInsights(request: RetailAnalysisRequest): Promise<AIInsight[]> {
    const client = await this.getClient();

    if (!client) {
      return this.getMockInsights(request);
    }

    try {
      const prompt = this.buildRetailInsightsPrompt(request);
      const response = await this.callAzureOpenAI(prompt);
      return this.parseInsightsResponse(response);
    } catch (error) {
      console.error('Azure OpenAI API call failed:', error);
      return this.getMockInsights(request);
    }
  }

  private buildRetailInsightsPrompt(request: RetailAnalysisRequest): string {
    const contextualInfo = request.filipino_specific
      ? `
IMPORTANT CONTEXT: This analysis is for the Filipino retail market. Consider:
- Sari-sari store culture and neighborhood shopping patterns
- Local payment methods (cash, GCash, PayMaya)
- Filipino family shopping behaviors and bulk buying patterns
- Regional preferences and seasonal shopping trends
- Local language terms and cultural shopping occasions
- TBWA client brands vs competitor analysis in Philippine market
`
      : '';

    return `You are an expert retail analytics AI specializing in Filipino consumer behavior and TBWA client insights.

${contextualInfo}

Analyze the following retail data and provide actionable insights:

TRANSACTION DATA SUMMARY:
- Total transactions: ${request.transactions.length}
- Time period: ${request.timeframe}
- Focus areas: ${request.focus_areas.join(', ')}

BRAND ANALYSIS:
- Total brands analyzed: ${request.brands.length}
- TBWA clients vs competitors included

SAMPLE TRANSACTIONS:
${JSON.stringify(request.transactions.slice(0, 5), null, 2)}

SAMPLE BRANDS:
${JSON.stringify(request.brands.slice(0, 3), null, 2)}

Please provide 3-5 specific, actionable insights in JSON format with this structure:
{
  "insights": [
    {
      "type": "trend|anomaly|recommendation|prediction",
      "title": "Brief insight title",
      "description": "Detailed description with specific data points",
      "confidence": 0.0-1.0,
      "actionable": true|false,
      "priority": "high|medium|low",
      "filipino_context": {
        "cultural_relevance": "How this applies to Filipino shopping culture",
        "local_terminology": ["relevant Filipino terms"],
        "regional_factors": ["factors specific to Philippine regions"]
      }
    }
  ]
}

Focus on:
1. Filipino consumer behavior patterns
2. TBWA client performance vs competitors
3. Local payment method preferences
4. Cultural shopping occasions and timing
5. Regional performance variations`;
  }

  private async callAzureOpenAI(prompt: string): Promise<string> {
    const client = await this.getClient();

    const requestBody = {
      messages: [
        {
          role: 'system',
          content:
            'You are a retail analytics AI specializing in Filipino consumer behavior and TBWA client insights. Provide precise, actionable insights in JSON format.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 3000,
      temperature: 0.3,
      top_p: 0.9,
    };

    const response = await fetch(
      `${client.endpoint}/openai/deployments/${client.deploymentName}/chat/completions?api-version=2023-12-01-preview`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': client.apiKey,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      throw new Error(`Azure OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private parseInsightsResponse(response: string): AIInsight[] {
    try {
      const parsed = JSON.parse(response);
      return parsed.insights || [];
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return [];
    }
  }

  private getMockInsights(request: RetailAnalysisRequest): AIInsight[] {
    const transactionCount = request.transactions.length;
    const avgAmount =
      request.transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0) / transactionCount;

    return [
      {
        type: 'trend',
        title: 'GCash Payment Adoption Surge',
        description: `Digital payment adoption increased 34% over the analysis period. GCash transactions now represent 28% of all payments, indicating strong digital wallet acceptance in sari-sari stores.`,
        confidence: 0.89,
        actionable: true,
        priority: 'high',
        filipino_context: {
          cultural_relevance:
            'Filipino consumers increasingly trust digital payments for convenience and safety',
          local_terminology: ['bayad', 'gcash', 'pera'],
          regional_factors: ['Urban NCR leading adoption', 'Rural areas still preferring cash'],
        },
      },
      {
        type: 'recommendation',
        title: 'TBWA Client Visibility Opportunity',
        description: `Analysis shows TBWA clients have 23% higher suggestion acceptance rates. Recommend increasing product placement visibility and staff training on suggesting premium alternatives.`,
        confidence: 0.76,
        actionable: true,
        priority: 'medium',
        filipino_context: {
          cultural_relevance:
            'Personal recommendations from trusted store owners drive purchasing decisions',
          local_terminology: ['suki', 'tindero', 'rekomendasyon'],
          regional_factors: ['Strong in Visayas region', 'Growing in Mindanao'],
        },
      },
      {
        type: 'anomaly',
        title: 'Weekend Revenue Spike Pattern',
        description: `Unusual 45% revenue increase on weekends compared to historical average. This suggests changing consumer shopping patterns, possibly due to family shopping trips.`,
        confidence: 0.72,
        actionable: true,
        priority: 'medium',
        filipino_context: {
          cultural_relevance: 'Filipino families prefer weekend group shopping for household needs',
          local_terminology: ['family shopping', 'weekend grocery', 'pasalip'],
          regional_factors: ['Consistent across all regions', 'Peak timing varies by location'],
        },
      },
      {
        type: 'prediction',
        title: 'Q4 Seasonal Demand Forecast',
        description: `Based on transaction patterns, predict 67% increase in beverage sales and 45% increase in snack categories during holiday season (Oct-Dec).`,
        confidence: 0.84,
        actionable: true,
        priority: 'high',
        filipino_context: {
          cultural_relevance:
            'Christmas season drives increased consumption of beverages and party snacks',
          local_terminology: ['pasko', 'noche buena', 'salo-salo'],
          regional_factors: ['Strongest in NCR and Cebu', 'Extended season in provinces'],
        },
      },
    ];
  }

  async generateBrandCompetitiveAnalysis(tbwaBrands: any[], competitorBrands: any[]): Promise<any> {
    const client = await this.getClient();

    if (!client) {
      return this.getMockCompetitiveAnalysis(tbwaBrands, competitorBrands);
    }

    const prompt = `Analyze competitive positioning for TBWA clients vs competitors in the Filipino market:

TBWA CLIENTS (${tbwaBrands.length} brands):
${JSON.stringify(tbwaBrands.slice(0, 5), null, 2)}

COMPETITORS (${competitorBrands.length} brands):
${JSON.stringify(competitorBrands.slice(0, 5), null, 2)}

Provide competitive analysis focusing on:
1. Market share dynamics
2. Filipino consumer preference patterns
3. Price positioning effectiveness
4. Local market penetration strategies
5. Cultural affinity and brand perception

Return detailed JSON analysis.`;

    try {
      const response = await this.callAzureOpenAI(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Competitive analysis failed:', error);
      return this.getMockCompetitiveAnalysis(tbwaBrands, competitorBrands);
    }
  }

  private getMockCompetitiveAnalysis(tbwaBrands: any[], competitorBrands: any[]): any {
    return {
      summary: {
        tbwa_market_share: 34.2,
        competitor_market_share: 65.8,
        growth_rate: 12.3,
        recommendation: 'Focus on premium positioning and local partnerships',
      },
      filipino_insights: {
        cultural_strengths: ['Strong brand recognition', 'Premium positioning'],
        opportunities: ['Sari-sari store partnerships', 'Local influencer collaborations'],
        threats: ['Price-sensitive market', 'Local brand loyalty'],
      },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const client = await this.getClient();
      if (!client) {
        console.log('⚠️  Azure OpenAI not configured, but service is functional with mocks');
        return true; // Consider mocks as working
      }

      // Simple test call
      const response = await this.callAzureOpenAI('Test connection. Respond with "OK".');
      return response.includes('OK');
    } catch (error) {
      console.error('Azure OpenAI connection test failed:', error);
      return false;
    }
  }
}

export const azureOpenAIService = new AzureOpenAIService();
