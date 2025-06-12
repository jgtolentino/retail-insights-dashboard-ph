/**
 * Intelligent Model Router for Azure OpenAI
 * Routes queries to appropriate GPT models based on complexity
 * Simple queries → GPT-3.5-turbo (fast, cheap)
 * Complex queries → GPT-4 (powerful, accurate)
 */

import { AzureOpenAI } from 'openai';

export interface TaskComplexity {
  level: 'simple' | 'medium' | 'complex';
  confidence: number;
  reasoning: string;
  suggestedModel: string;
  temperature: number;
  maxTokens: number;
}

export interface ModelConfig {
  deployment: string;
  temperature: number;
  maxTokens: number;
  costPerToken: number;
}

export class IntelligentModelRouter {
  private azureOpenAI: AzureOpenAI;
  private models: Record<string, ModelConfig>;

  constructor() {
    this.azureOpenAI = new AzureOpenAI({
      endpoint: import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || process.env.AZURE_OPENAI_ENDPOINT,
      apiKey: import.meta.env.VITE_AZURE_OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY,
      apiVersion:
        import.meta.env.VITE_AZURE_OPENAI_API_VERSION ||
        process.env.AZURE_OPENAI_API_VERSION ||
        '2024-02-15-preview',
      dangerouslyAllowBrowser: true,
    });

    // Model configurations based on complexity
    this.models = {
      simple: {
        deployment: 'gpt-35-turbo', // Fast and cheap for simple tasks
        temperature: 0.1,
        maxTokens: 300,
        costPerToken: 0.0005,
      },
      medium: {
        deployment: 'gpt-35-turbo-16k', // More context for medium complexity
        temperature: 0.3,
        maxTokens: 800,
        costPerToken: 0.001,
      },
      complex: {
        deployment: 'gpt-4', // Most powerful for complex analysis
        temperature: 0.2,
        maxTokens: 1500,
        costPerToken: 0.03,
      },
    };
  }

  /**
   * Analyze query complexity using pattern matching and heuristics
   */
  analyzeComplexity(query: string): TaskComplexity {
    const cleanQuery = query.toLowerCase().trim();
    const wordCount = cleanQuery.split(/\s+/).length;
    const charCount = cleanQuery.length;

    // Simple patterns (use GPT-3.5-turbo)
    const simplePatterns = [
      /^(what|show|list|get|find)\s+(top|best|worst)\s+\d+/i, // "show top 5 brands"
      /^(what|show)\s+(is|are)\s+the\s+\w+/i, // "what is the total"
      /^count\s+\w+/i, // "count customers"
      /^(sum|total|average|mean)\s+\w+/i, // "sum sales"
      /^simple\s+/i, // explicit "simple"
      /^\w+\s*[+\-*/]\s*\w+$/i, // basic math
    ];

    // Complex patterns (use GPT-4)
    const complexPatterns = [
      /(analyze|analysis|compare|comparison|correlation)/i,
      /(trend|pattern|insight|recommendation|strategy)/i,
      /(why|how|explain|because|reason|factor)/i,
      /(predict|forecast|projection|future)/i,
      /(segment|cluster|group|categorize)/i,
      /(anomaly|outlier|unusual|strange)/i,
      /(optimization|optimize|improve|enhance)/i,
      /\b(versus|vs|against|compared to)\b/i,
    ];

    // SQL generation complexity indicators
    const sqlComplexityIndicators = [
      /(join|group by|having|window|partition)/i,
      /(subquery|nested|complex)/i,
      /(multiple|several|various|different)/i,
    ];

    // Check for simple patterns first
    for (const pattern of simplePatterns) {
      if (pattern.test(cleanQuery)) {
        return {
          level: 'simple',
          confidence: 0.9,
          reasoning: 'Matches simple query pattern',
          suggestedModel: this.models.simple.deployment,
          temperature: this.models.simple.temperature,
          maxTokens: this.models.simple.maxTokens,
        };
      }
    }

    // Check for complex patterns
    for (const pattern of complexPatterns) {
      if (pattern.test(cleanQuery)) {
        return {
          level: 'complex',
          confidence: 0.85,
          reasoning: 'Matches complex analysis pattern',
          suggestedModel: this.models.complex.deployment,
          temperature: this.models.complex.temperature,
          maxTokens: this.models.complex.maxTokens,
        };
      }
    }

    // Check SQL complexity
    for (const pattern of sqlComplexityIndicators) {
      if (pattern.test(cleanQuery)) {
        return {
          level: 'complex',
          confidence: 0.8,
          reasoning: 'Requires complex SQL generation',
          suggestedModel: this.models.complex.deployment,
          temperature: this.models.complex.temperature,
          maxTokens: this.models.complex.maxTokens,
        };
      }
    }

    // Heuristic-based classification
    let complexityScore = 0;

    // Length indicators
    if (wordCount > 20) complexityScore += 2;
    else if (wordCount > 10) complexityScore += 1;

    if (charCount > 100) complexityScore += 1;

    // Question type indicators
    if (cleanQuery.includes('?')) {
      const questionWords = ['why', 'how', 'what if', 'explain'];
      if (questionWords.some(word => cleanQuery.includes(word))) {
        complexityScore += 2;
      }
    }

    // Multiple criteria
    const criteriaWords = ['and', 'or', 'but', 'also', 'additionally', 'furthermore'];
    if (criteriaWords.some(word => cleanQuery.includes(word))) {
      complexityScore += 1;
    }

    // Time-based analysis
    const timeWords = ['trend', 'over time', 'historical', 'monthly', 'yearly', 'seasonal'];
    if (timeWords.some(word => cleanQuery.includes(word))) {
      complexityScore += 1;
    }

    // Determine final complexity
    if (complexityScore <= 1) {
      return {
        level: 'simple',
        confidence: 0.7,
        reasoning: `Low complexity score: ${complexityScore}`,
        suggestedModel: this.models.simple.deployment,
        temperature: this.models.simple.temperature,
        maxTokens: this.models.simple.maxTokens,
      };
    } else if (complexityScore <= 3) {
      return {
        level: 'medium',
        confidence: 0.6,
        reasoning: `Medium complexity score: ${complexityScore}`,
        suggestedModel: this.models.medium.deployment,
        temperature: this.models.medium.temperature,
        maxTokens: this.models.medium.maxTokens,
      };
    } else {
      return {
        level: 'complex',
        confidence: 0.8,
        reasoning: `High complexity score: ${complexityScore}`,
        suggestedModel: this.models.complex.deployment,
        temperature: this.models.complex.temperature,
        maxTokens: this.models.complex.maxTokens,
      };
    }
  }

  /**
   * Route query to appropriate model based on complexity
   */
  async routeQuery(
    query: string,
    systemPrompt: string,
    userPrompt?: string
  ): Promise<{ response: string; complexity: TaskComplexity; estimatedCost: number }> {
    const complexity = this.analyzeComplexity(query);
    const modelConfig = this.models[complexity.level];

    console.log(`🎯 Routing to ${complexity.level} model: ${complexity.suggestedModel}`);
    console.log(`📊 Confidence: ${complexity.confidence}, Reasoning: ${complexity.reasoning}`);

    try {
      const completion = await this.azureOpenAI.chat.completions.create({
        model: complexity.suggestedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt || query },
        ],
        temperature: complexity.temperature,
        max_tokens: complexity.maxTokens,
      });

      const response = completion.choices[0]?.message?.content || '';
      const estimatedCost = (completion.usage?.total_tokens || 0) * modelConfig.costPerToken;

      return {
        response,
        complexity,
        estimatedCost,
      };
    } catch (error) {
      console.error(
        `Error with ${complexity.suggestedModel}, falling back to simple model:`,
        error
      );

      // Fallback to simple model
      const fallbackCompletion = await this.azureOpenAI.chat.completions.create({
        model: this.models.simple.deployment,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt || query },
        ],
        temperature: this.models.simple.temperature,
        max_tokens: this.models.simple.maxTokens,
      });

      return {
        response: fallbackCompletion.choices[0]?.message?.content || '',
        complexity: {
          ...complexity,
          level: 'simple',
          suggestedModel: this.models.simple.deployment,
        },
        estimatedCost:
          (fallbackCompletion.usage?.total_tokens || 0) * this.models.simple.costPerToken,
      };
    }
  }

  /**
   * Get model statistics for monitoring
   */
  getModelStats(): Record<string, ModelConfig> {
    return this.models;
  }

  /**
   * Update model configuration
   */
  updateModelConfig(level: 'simple' | 'medium' | 'complex', config: Partial<ModelConfig>) {
    this.models[level] = { ...this.models[level], ...config };
  }
}

// Export singleton instance
export const intelligentRouter = new IntelligentModelRouter();
export default intelligentRouter;
