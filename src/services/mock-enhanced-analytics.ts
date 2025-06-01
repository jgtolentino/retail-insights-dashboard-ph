// Mock Enhanced Analytics Service for Sprint 4 Demo
export const mockEnhancedAnalyticsService = {
  async getSubstitutionPatterns() {
    return window.SPRINT4_DEMO_DATA?.substitutionPatterns || [];
  },

  async getRequestBehaviorStats() {
    return window.SPRINT4_DEMO_DATA?.requestBehaviors || [];
  },

  async getCheckoutDurationAnalysis() {
    return window.SPRINT4_DEMO_DATA?.checkoutDurations || [];
  },

  async getPaymentMethodAnalysis() {
    return window.SPRINT4_DEMO_DATA?.paymentMethods || [];
  },

  async generateAIRecommendations() {
    return window.SPRINT4_DEMO_DATA?.aiRecommendations || [];
  },

  async getDashboardSummary() {
    return {
      totalTransactions: 18000,
      totalRevenue: 4500000,
      avgCheckoutTime: 75,
      avgSubstitutionRate: 15,
      avgDigitalPaymentRate: 60,
      ...window.SPRINT4_DEMO_DATA,
    };
  },
};
