// Type definitions for enhanced analytics

export interface SubstitutionPattern {
  original_brand: string;
  substitute_brand: string;
  original_product: string;
  substitute_product: string;
  substitution_count: number;
  acceptance_rate: number;
  avg_price_diff: number;
}

export interface RequestBehaviorStats {
  request_type: string;
  total_count: number;
  avg_checkout_seconds: number;
  suggestion_acceptance_rate: number;
  avg_clarifications: number;
  gesture_usage_rate: number;
}

export interface CheckoutDurationAnalysis {
  duration_range: string;
  transaction_count: number;
  percentage: number;
  avg_amount: number;
  top_payment_method: string;
}

export interface PaymentMethodAnalysis {
  payment_method: string;
  transaction_count: number;
  total_revenue: number;
  avg_transaction_value: number;
  avg_checkout_time: number;
  market_share: number;
}

export interface TranscriptionInsight {
  common_phrase: string;
  frequency: number;
  request_type: string;
  avg_checkout_time: number;
  sentiment_score: number;
}

export interface DailyTrend {
  date: string;
  total_transactions: number;
  total_revenue: number;
  avg_checkout_time: number;
  top_request_type: string;
  substitution_rate: number;
  digital_payment_rate: number;
}

export interface BrandWithSubstitution {
  brand: string;
  total_sales: number;
  transaction_count: number;
  times_substituted_away: number;
  times_substituted_to: number;
  net_substitution_impact: number;
  substitution_vulnerability: number;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  category: 'inventory' | 'operations' | 'merchandising' | 'customer_service' | 'pricing';
  priority: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  potentialIncrease: number;
  actionItems: string[];
}

export interface DashboardSummary {
  totalTransactions: number;
  totalRevenue: number;
  avgCheckoutTime: number;
  avgSubstitutionRate: number;
  avgDigitalPaymentRate: number;
  dailyTrends: DailyTrend[];
  requestStats: RequestBehaviorStats[];
  paymentAnalysis: PaymentMethodAnalysis[];
  substitutionPatterns: SubstitutionPattern[];
  transcriptionInsights: TranscriptionInsight[];
  lastUpdated: string;
}