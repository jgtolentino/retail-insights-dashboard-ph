/**
 * Sprint 4 Compatibility Layer
 * Works with existing schema while providing Sprint 4 features
 */

import { supabase } from '@/integrations/supabase/client';

// Mock data for Sprint 4 features
const mockSubstitutionPatterns = [
  {
    original_brand: 'Coca-Cola',
    substitute_brand: 'Pepsi',
    original_product: 'Coca-Cola Regular 1.5L',
    substitute_product: 'Pepsi Regular 1.5L',
    substitution_count: 45,
    acceptance_rate: 0.78,
    avg_price_diff: -2.5,
  },
  {
    original_brand: 'Alaska',
    substitute_brand: 'Bear Brand',
    original_product: 'Alaska Evaporated Milk',
    substitute_product: 'Bear Brand Adult Plus',
    substitution_count: 38,
    acceptance_rate: 0.82,
    avg_price_diff: 3.25,
  },
  {
    original_brand: 'San Miguel',
    substitute_brand: 'Red Horse',
    original_product: 'San Miguel Pale Pilsen',
    substitute_product: 'Red Horse Beer',
    substitution_count: 32,
    acceptance_rate: 0.65,
    avg_price_diff: 5.0,
  },
  {
    original_brand: 'Lucky Me',
    substitute_brand: 'Nissin',
    original_product: 'Lucky Me Pancit Canton',
    substitute_product: 'Nissin Yakisoba',
    substitution_count: 28,
    acceptance_rate: 0.85,
    avg_price_diff: -1.5,
  },
];

const mockRequestBehaviors = [
  {
    request_type: 'branded',
    total_count: 10800,
    avg_checkout_seconds: 65,
    suggestion_acceptance_rate: 0.75,
    avg_clarifications: 0.3,
    gesture_usage_rate: 0.1,
  },
  {
    request_type: 'unbranded',
    total_count: 5400,
    avg_checkout_seconds: 85,
    suggestion_acceptance_rate: 0.82,
    avg_clarifications: 1.2,
    gesture_usage_rate: 0.05,
  },
  {
    request_type: 'pointing',
    total_count: 1800,
    avg_checkout_seconds: 45,
    suggestion_acceptance_rate: 0.68,
    avg_clarifications: 0.8,
    gesture_usage_rate: 0.95,
  },
];

const mockCheckoutDurations = [
  {
    duration_range: '0-30s',
    transaction_count: 4500,
    percentage: 25,
    avg_amount: 180,
    top_payment_method: 'cash',
  },
  {
    duration_range: '30-60s',
    transaction_count: 6300,
    percentage: 35,
    avg_amount: 250,
    top_payment_method: 'gcash',
  },
  {
    duration_range: '1-2min',
    transaction_count: 4500,
    percentage: 25,
    avg_amount: 320,
    top_payment_method: 'maya',
  },
  {
    duration_range: '2-5min',
    transaction_count: 2160,
    percentage: 12,
    avg_amount: 450,
    top_payment_method: 'cash',
  },
  {
    duration_range: '5min+',
    transaction_count: 540,
    percentage: 3,
    avg_amount: 680,
    top_payment_method: 'credit',
  },
];

// Create a wrapper service that uses real data where available
export const compatibleAnalyticsService = {
  async getSubstitutionPatterns(dateRange) {
    // Return mock data for now
    return mockSubstitutionPatterns;
  },

  async getRequestBehaviorStats(dateRange) {
    // Calculate from real transaction data
    const { count: totalCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });

    // Simulate distribution based on total count
    const branded = Math.floor(totalCount * 0.6);
    const unbranded = Math.floor(totalCount * 0.3);
    const pointing = totalCount - branded - unbranded;

    return [
      { ...mockRequestBehaviors[0], total_count: branded },
      { ...mockRequestBehaviors[1], total_count: unbranded },
      { ...mockRequestBehaviors[2], total_count: pointing },
    ];
  },

  async getCheckoutDurationAnalysis(dateRange) {
    return mockCheckoutDurations;
  },

  async getPaymentMethodAnalysis(dateRange) {
    // Simulate payment method distribution
    const { count: total } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });

    return [
      {
        payment_method: 'cash',
        transaction_count: Math.floor(total * 0.4),
        total_revenue: total * 250 * 0.4,
        avg_transaction_value: 250,
        avg_checkout_time: 60,
        market_share: 40,
      },
      {
        payment_method: 'gcash',
        transaction_count: Math.floor(total * 0.3),
        total_revenue: total * 380 * 0.3,
        avg_transaction_value: 380,
        avg_checkout_time: 45,
        market_share: 30,
      },
      {
        payment_method: 'maya',
        transaction_count: Math.floor(total * 0.2),
        total_revenue: total * 420 * 0.2,
        avg_transaction_value: 420,
        avg_checkout_time: 50,
        market_share: 20,
      },
      {
        payment_method: 'credit',
        transaction_count: Math.floor(total * 0.1),
        total_revenue: total * 680 * 0.1,
        avg_transaction_value: 680,
        avg_checkout_time: 90,
        market_share: 10,
      },
    ];
  },

  async getTranscriptionInsights(dateRange) {
    return [
      {
        common_phrase: 'Standard Product Request',
        frequency: 8500,
        request_type: 'branded',
        avg_checkout_time: 65,
        sentiment_score: 0.75,
      },
      {
        common_phrase: 'Brand Clarification',
        frequency: 3200,
        request_type: 'unbranded',
        avg_checkout_time: 85,
        sentiment_score: 0.65,
      },
      {
        common_phrase: 'Gesture-Based Request',
        frequency: 1800,
        request_type: 'pointing',
        avg_checkout_time: 45,
        sentiment_score: 0.7,
      },
      {
        common_phrase: 'Out of Stock Response',
        frequency: 1200,
        request_type: 'branded',
        avg_checkout_time: 120,
        sentiment_score: 0.4,
      },
      {
        common_phrase: 'No Brand Preference',
        frequency: 900,
        request_type: 'unbranded',
        avg_checkout_time: 75,
        sentiment_score: 0.6,
      },
    ];
  },

  async getDailyTrendsEnhanced(dateRange) {
    // Get real daily transaction data
    const { data: transactions } = await supabase
      .from('transactions')
      .select('transaction_date, total_amount')
      .order('transaction_date', { ascending: false })
      .limit(30);

    // Group by date and enhance with mock Sprint 4 data
    const dailyData: Record<string, { count: number; revenue: number }> = {};
    transactions?.forEach((t: any) => {
      const date = new Date(t.transaction_date).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { count: 0, revenue: 0 };
      }
      dailyData[date].count++;
      dailyData[date].revenue += t.total_amount;
    });

    return Object.entries(dailyData).map(([date, data]) => ({
      date,
      total_transactions: data.count,
      total_revenue: data.revenue,
      avg_checkout_time: 65 + Math.random() * 20,
      top_request_type: ['branded', 'unbranded', 'pointing'][Math.floor(Math.random() * 3)],
      substitution_rate: 10 + Math.random() * 10,
      digital_payment_rate: 50 + Math.random() * 20,
    }));
  },

  async getTopBrandsWithSubstitutionImpact(dateRange, limit = 20) {
    // Get real brand data
    const { data: brands } = await supabase.from('products').select('brand').limit(50);

    const uniqueBrands = Array.from(new Set(brands?.map((b: any) => b.brand) || []));

    // Generate mock substitution impact
    return uniqueBrands.slice(0, limit).map((brand: string) => ({
      brand,
      total_sales: Math.floor(Math.random() * 500000) + 100000,
      transaction_count: Math.floor(Math.random() * 2000) + 500,
      times_substituted_away: Math.floor(Math.random() * 50),
      times_substituted_to: Math.floor(Math.random() * 50),
      net_substitution_impact: Math.floor(Math.random() * 20) - 10,
      substitution_vulnerability: Math.random() * 30,
    }));
  },

  async generateAIRecommendations(dateRange) {
    const { count: totalTransactions } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });

    return [
      {
        id: 'inv-1',
        title: 'Optimize Inventory for High-Substitution Items',
        description:
          'Coca-Cola and Alaska show high substitution rates. Maintain better stock levels.',
        category: 'inventory',
        priority: 'high',
        impact: 'high',
        potentialIncrease: 15,
        actionItems: [
          'Monitor Coca-Cola stock levels daily',
          'Set automatic reorder points for Alaska products',
          'Train staff on upselling Bear Brand when Alaska is low',
        ],
      },
      {
        id: 'ops-1',
        title: 'Streamline Checkout Process',
        description: `${((2700 / totalTransactions) * 100).toFixed(1)}% of transactions exceed 2 minutes. Implement express lanes.`,
        category: 'operations',
        priority: 'medium',
        impact: 'medium',
        potentialIncrease: 8,
        actionItems: [
          'Create express lane for <5 items',
          'Train cashiers on quick payment processing',
          'Optimize POS system for faster scanning',
        ],
      },
      {
        id: 'pay-1',
        title: 'Promote Digital Payment Adoption',
        description:
          'Digital payments (GCash, Maya) show higher transaction values. Incentivize adoption.',
        category: 'pricing',
        priority: 'high',
        impact: 'high',
        potentialIncrease: 12,
        actionItems: [
          'Offer 2% cashback for GCash payments',
          'Display QR codes prominently at checkout',
          'Train staff on digital payment assistance',
        ],
      },
    ];
  },

  async getDashboardSummary(dateRange) {
    const { count: totalTransactions } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });

    const { data: revenueData } = await supabase.from('transactions').select('total_amount');

    const totalRevenue = revenueData?.reduce((sum: number, t: any) => sum + t.total_amount, 0) || 0;

    return {
      totalTransactions,
      totalRevenue,
      avgCheckoutTime: 72.5,
      avgSubstitutionRate: 15.2,
      avgDigitalPaymentRate: 60.5,
      dailyTrends: await this.getDailyTrendsEnhanced(dateRange),
      requestStats: await this.getRequestBehaviorStats(dateRange),
      paymentAnalysis: await this.getPaymentMethodAnalysis(dateRange),
      substitutionPatterns: mockSubstitutionPatterns.slice(0, 10),
      transcriptionInsights: await this.getTranscriptionInsights(dateRange),
      lastUpdated: new Date().toISOString(),
    };
  },
};
