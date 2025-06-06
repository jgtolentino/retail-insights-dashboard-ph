/**
 * Azure OpenAI Service for AI Panel
 *
 * Integrates Azure OpenAI API with our Supabase + Vercel architecture
 * Provides AI-powered retail insights, predictions, and recommendations
 */

interface AzureOpenAIConfig {
  endpoint: string;
  apiKey: string;
  deploymentName: string;
  apiVersion: string;
}

interface AIInsight {
  id: string;
  title: string;
  description: string;
  impact: string;
  confidence: number;
  category: 'revenue' | 'inventory' | 'customer' | 'operational' | 'predictive';
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  implementationEffort: 'easy' | 'moderate' | 'complex';
  expectedROI?: string;
  timeframe?: string;
}

interface SalesData {
  totalRevenue: number;
  totalTransactions: number;
  topBrands: Array<{ name: string; sales: number; category: string }>;
  timeSeriesData: Array<{ date: string; revenue: number; transactions: number }>;
  regionalData?: Array<{ region: string; sales: number; growth: number }>;
}

interface AIPrediction {
  metric: string;
  currentValue: number;
  predictedValue: number;
  confidence: number;
  timeframe: string;
  factors: string[];
  recommendations: string[];
}

export class AzureOpenAIService {
  private config: AzureOpenAIConfig;

  constructor() {
    this.config = {
      endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
      apiKey: process.env.AZURE_OPENAI_API_KEY || '',
      deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4',
      apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
    };
  }

  /**
   * Generate AI insights from retail data
   */
  async generateRetailInsights(salesData: SalesData): Promise<AIInsight[]> {
    try {
      const prompt = this.buildRetailInsightsPrompt(salesData);

      const completion = await this.callAzureOpenAI(prompt, {
        maxTokens: 2000,
        temperature: 0.3, // Lower temperature for more consistent business insights
        topP: 0.9,
      });

      return this.parseInsightsResponse(completion);
    } catch (error) {
      console.error('❌ Failed to generate AI insights:', error);
      return this.getFallbackInsights(salesData);
    }
  }

  /**
   * Generate sales predictions using AI
   */
  async generateSalesPrediction(
    salesData: SalesData,
    timeframe: string = '30 days'
  ): Promise<AIPrediction[]> {
    try {
      const prompt = this.buildPredictionPrompt(salesData, timeframe);

      const completion = await this.callAzureOpenAI(prompt, {
        maxTokens: 1500,
        temperature: 0.2, // Very low temperature for predictions
        topP: 0.8,
      });

      return this.parsePredictionResponse(completion);
    } catch (error) {
      console.error('❌ Failed to generate predictions:', error);
      return this.getFallbackPredictions(salesData);
    }
  }

  /**
   * Analyze anomalies in sales data
   */
  async detectAnomalies(salesData: SalesData): Promise<
    Array<{
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
      affectedMetric: string;
      suggestedAction: string;
    }>
  > {
    try {
      const prompt = this.buildAnomalyDetectionPrompt(salesData);

      const completion = await this.callAzureOpenAI(prompt, {
        maxTokens: 1000,
        temperature: 0.4,
      });

      return this.parseAnomaliesResponse(completion);
    } catch (error) {
      console.error('❌ Failed to detect anomalies:', error);
      return [];
    }
  }

  /**
   * Generate optimization suggestions
   */
  async generateOptimizationSuggestions(salesData: SalesData): Promise<
    Array<{
      category: string;
      suggestion: string;
      expectedImpact: string;
      implementationSteps: string[];
      timeToImplement: string;
      difficulty: 'easy' | 'moderate' | 'complex';
    }>
  > {
    try {
      const prompt = this.buildOptimizationPrompt(salesData);

      const completion = await this.callAzureOpenAI(prompt, {
        maxTokens: 1800,
        temperature: 0.3,
      });

      return this.parseOptimizationResponse(completion);
    } catch (error) {
      console.error('❌ Failed to generate optimization suggestions:', error);
      return this.getFallbackOptimizations();
    }
  }

  /**
   * Analyze Filipino consumer behavior patterns
   */
  async analyzeFilipinoConsumerBehavior(salesData: SalesData): Promise<{
    insights: string[];
    culturalFactors: string[];
    seasonalPatterns: string[];
    recommendedStrategies: string[];
  }> {
    try {
      const prompt = this.buildFilipinoConsumerPrompt(salesData);

      const completion = await this.callAzureOpenAI(prompt, {
        maxTokens: 1500,
        temperature: 0.4,
      });

      return this.parseConsumerBehaviorResponse(completion);
    } catch (error) {
      console.error('❌ Failed to analyze consumer behavior:', error);
      return {
        insights: ['Unable to analyze consumer patterns at this time'],
        culturalFactors: [],
        seasonalPatterns: [],
        recommendedStrategies: [],
      };
    }
  }

  /**
   * Call Azure OpenAI API
   */
  private async callAzureOpenAI(
    prompt: string,
    options: {
      maxTokens?: number;
      temperature?: number;
      topP?: number;
    } = {}
  ): Promise<string> {
    const { maxTokens = 1000, temperature = 0.7, topP = 1.0 } = options;

    const url = `${this.config.endpoint}/openai/deployments/${this.config.deploymentName}/chat/completions?api-version=${this.config.apiVersion}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.config.apiKey,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content:
              'You are an expert retail analytics AI assistant specializing in Philippine retail markets. Provide actionable, data-driven insights in JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: maxTokens,
        temperature,
        top_p: topP,
      }),
    });

    if (!response.ok) {
      throw new Error(`Azure OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  /**
   * Build retail insights prompt
   */
  private buildRetailInsightsPrompt(salesData: SalesData): string {
    return `
Analyze the following Philippine retail sales data and provide actionable insights:

Sales Overview:
- Total Revenue: ₱${salesData.totalRevenue.toLocaleString()}
- Total Transactions: ${salesData.totalTransactions.toLocaleString()}
- Average Transaction Value: ₱${(salesData.totalRevenue / salesData.totalTransactions) || 0).toFixed(2)}

Top Brands:
${salesData.topBrands
  .map(brand => `- ${brand.name} (${brand.category}): ₱${brand.sales.toLocaleString()}`)
  .join('\n')}

Recent Sales Trend:
${salesData.timeSeriesData
  .slice(-7)
  .map(day => `- ${day.date}: ₱${day.revenue.toLocaleString()} (${day.transactions} transactions)`)
  .join('\n')}

Please provide insights in this JSON format:
{
  "insights": [
    {
      "id": "unique_id",
      "title": "Brief insight title",
      "description": "Detailed description of the insight",
      "impact": "Quantified business impact",
      "confidence": 85,
      "category": "revenue|inventory|customer|operational|predictive",
      "priority": "high|medium|low",
      "actionable": true,
      "implementationEffort": "easy|moderate|complex",
      "expectedROI": "Expected return on investment",
      "timeframe": "Implementation timeframe"
    }
  ]
}

Focus on Philippine retail context, sari-sari store dynamics, and actionable recommendations.
`;
  }

  /**
   * Build prediction prompt
   */
  private buildPredictionPrompt(salesData: SalesData, timeframe: string): string {
    return `
Based on this Philippine retail sales data, predict key metrics for the next ${timeframe}:

Historical Data:
${salesData.timeSeriesData
  .map(
    day => `${day.date}: ₱${day.revenue.toLocaleString()} revenue, ${day.transactions} transactions`
  )
  .join('\n')}

Current Performance:
- Daily Average Revenue: ₱${(salesData.totalRevenue / salesData.timeSeriesData.length).toLocaleString()}
- Daily Average Transactions: ${Math.round(salesData.totalTransactions / salesData.timeSeriesData.length)}

Provide predictions in JSON format:
{
  "predictions": [
    {
      "metric": "daily_revenue",
      "currentValue": ${salesData.totalRevenue / salesData.timeSeriesData.length},
      "predictedValue": predicted_value,
      "confidence": confidence_percentage,
      "timeframe": "${timeframe}",
      "factors": ["factor1", "factor2"],
      "recommendations": ["recommendation1", "recommendation2"]
    }
  ]
}

Consider Philippine market seasonality, holidays, and consumer patterns.
`;
  }

  /**
   * Build anomaly detection prompt
   */
  private buildAnomalyDetectionPrompt(salesData: SalesData): string {
    return `
Detect anomalies in this Philippine retail sales data:

${salesData.timeSeriesData
  .map(
    day => `${day.date}: ₱${day.revenue.toLocaleString()} revenue, ${day.transactions} transactions`
  )
  .join('\n')}

Brand Performance:
${salesData.topBrands.map(brand => `${brand.name}: ₱${brand.sales.toLocaleString()}`).join('\n')}

Identify unusual patterns and provide analysis in JSON format:
{
  "anomalies": [
    {
      "type": "revenue_spike|revenue_drop|transaction_anomaly|brand_anomaly",
      "description": "Description of the anomaly",
      "severity": "low|medium|high",
      "affectedMetric": "revenue|transactions|brand_performance",
      "suggestedAction": "Recommended action to take"
    }
  ]
}

Consider Philippine retail patterns, weather effects, paydays, and holidays.
`;
  }

  /**
   * Build optimization prompt
   */
  private buildOptimizationPrompt(salesData: SalesData): string {
    return `
Suggest optimizations for this Philippine retail operation:

Performance Data:
- Total Revenue: ₱${salesData.totalRevenue.toLocaleString()}
- Total Transactions: ${salesData.totalTransactions.toLocaleString()}
- Transaction Efficiency: ${(salesData.totalRevenue / salesData.totalTransactions) || 0).toFixed(2)}

Top Performing Categories:
${salesData.topBrands
  .map(brand => `- ${brand.category}: ₱${brand.sales.toLocaleString()}`)
  .join('\n')}

Provide optimization suggestions in JSON format:
{
  "optimizations": [
    {
      "category": "inventory|pricing|marketing|operations",
      "suggestion": "Specific optimization suggestion",
      "expectedImpact": "Quantified expected improvement",
      "implementationSteps": ["step1", "step2", "step3"],
      "timeToImplement": "Timeline for implementation",
      "difficulty": "easy|moderate|complex"
    }
  ]
}

Focus on Philippine retail context and sari-sari store operations.
`;
  }

  /**
   * Build Filipino consumer behavior prompt
   */
  private buildFilipinoConsumerPrompt(salesData: SalesData): string {
    return `
Analyze Filipino consumer behavior patterns from this retail data:

Sales Patterns:
${salesData.timeSeriesData
  .slice(-14)
  .map(day => `${day.date}: ${day.transactions} transactions, ₱${day.revenue.toLocaleString()}`)
  .join('\n')}

Popular Categories:
${salesData.topBrands
  .map(brand => `${brand.category}: ${brand.name} - ₱${brand.sales.toLocaleString()}`)
  .join('\n')}

Analyze and provide insights in JSON format:
{
  "insights": ["Cultural shopping patterns observed"],
  "culturalFactors": ["Factors influencing purchasing decisions"],
  "seasonalPatterns": ["Seasonal buying behaviors"],
  "recommendedStrategies": ["Strategies to align with Filipino consumer preferences"]
}

Consider: Filipino family dynamics, payday cycles, religious observances, regional preferences, and sari-sari store culture.
`;
  }

  /**
   * Parse insights response from AI
   */
  private parseInsightsResponse(response: string): AIInsight[] {
    try {
      const parsed = JSON.parse(response);
      return parsed.insights || [];
    } catch (error) {
      console.error('Failed to parse insights response:', error);
      return [];
    }
  }

  /**
   * Parse prediction response from AI
   */
  private parsePredictionResponse(response: string): AIPrediction[] {
    try {
      const parsed = JSON.parse(response);
      return parsed.predictions || [];
    } catch (error) {
      console.error('Failed to parse prediction response:', error);
      return [];
    }
  }

  /**
   * Parse anomalies response from AI
   */
  private parseAnomaliesResponse(response: string): Array<any> {
    try {
      const parsed = JSON.parse(response);
      return parsed.anomalies || [];
    } catch (error) {
      console.error('Failed to parse anomalies response:', error);
      return [];
    }
  }

  /**
   * Parse optimization response from AI
   */
  private parseOptimizationResponse(response: string): Array<any> {
    try {
      const parsed = JSON.parse(response);
      return parsed.optimizations || [];
    } catch (error) {
      console.error('Failed to parse optimization response:', error);
      return [];
    }
  }

  /**
   * Parse consumer behavior response from AI
   */
  private parseConsumerBehaviorResponse(response: string): any {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse consumer behavior response:', error);
      return {
        insights: [],
        culturalFactors: [],
        seasonalPatterns: [],
        recommendedStrategies: [],
      };
    }
  }

  /**
   * Fallback insights when AI is unavailable
   */
  private getFallbackInsights(salesData: SalesData): AIInsight[] {
    const avgTransaction = salesData.totalRevenue / salesData.totalTransactions;
    const topBrand = salesData.topBrands[0];

    return [
      {
        id: 'fallback-1',
        title: 'Transaction Value Optimization',
        description: `Current average transaction value is ₱${avgTransaction || 0).toFixed(2)}. Consider bundling strategies to increase basket size.`,
        impact: '+10-15% revenue potential',
        confidence: 75,
        category: 'revenue',
        priority: 'high',
        actionable: true,
        implementationEffort: 'easy',
        expectedROI: '200-300%',
        timeframe: '2-4 weeks',
      },
      {
        id: 'fallback-2',
        title: 'Top Brand Focus',
        description: `${topBrand?.name} is your top performer with ₱${topBrand?.sales.toLocaleString()} in sales. Ensure adequate stock levels.`,
        impact: 'Prevent stockouts',
        confidence: 90,
        category: 'inventory',
        priority: 'high',
        actionable: true,
        implementationEffort: 'easy',
        timeframe: 'Immediate',
      },
    ];
  }

  /**
   * Fallback predictions when AI is unavailable
   */
  private getFallbackPredictions(salesData: SalesData): AIPrediction[] {
    const avgRevenue = salesData.totalRevenue / salesData.timeSeriesData.length;
    const avgTransactions = salesData.totalTransactions / salesData.timeSeriesData.length;

    return [
      {
        metric: 'daily_revenue',
        currentValue: avgRevenue,
        predictedValue: avgRevenue * 1.05, // 5% growth prediction
        confidence: 70,
        timeframe: '30 days',
        factors: ['Historical trend', 'Seasonal adjustment'],
        recommendations: ['Monitor inventory levels', 'Prepare for increased demand'],
      },
      {
        metric: 'daily_transactions',
        currentValue: avgTransactions,
        predictedValue: Math.round(avgTransactions * 1.03), // 3% growth
        confidence: 75,
        timeframe: '30 days',
        factors: ['Customer retention', 'Market growth'],
        recommendations: ['Optimize store hours', 'Enhance customer experience'],
      },
    ];
  }

  /**
   * Fallback optimizations when AI is unavailable
   */
  private getFallbackOptimizations(): Array<any> {
    return [
      {
        category: 'inventory',
        suggestion: 'Implement ABC analysis for inventory management',
        expectedImpact: '15-20% reduction in carrying costs',
        implementationSteps: [
          'Categorize products by sales volume',
          'Adjust reorder points for each category',
          'Monitor stock turnover rates',
        ],
        timeToImplement: '2-3 weeks',
        difficulty: 'moderate',
      },
      {
        category: 'pricing',
        suggestion: 'Implement dynamic pricing for fast-moving items',
        expectedImpact: '5-10% margin improvement',
        implementationSteps: [
          'Identify price-elastic products',
          'Set up automated pricing rules',
          'Monitor competitor pricing',
        ],
        timeToImplement: '1-2 weeks',
        difficulty: 'easy',
      },
    ];
  }
}

// Export singleton instance
export const azureOpenAIService = new AzureOpenAIService();

// Export types for use in components
export type { AIInsight, AIPrediction, SalesData };
