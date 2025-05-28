// Feature flags for production deployment
export const FEATURE_FLAGS = {
  // Production Ready Features
  DASHBOARD_OVERVIEW: true,
  CONSUMER_INSIGHTS: true,
  PRODUCT_MIX: true,
  BRANDS_PAGE: true,
  BASIC_FILTERS: true,
  TRENDS_PAGE: true,
  SETTINGS_PAGE: true,
  
  // Disable for Production (Stage 2)
  ADVANCED_CONNECTORS: false,  // Parquet, PostgreSQL, MongoDB
  QUERY_BUILDER: false,        // Visual Query Builder
  AI_RECOMMENDATIONS: false,   // AI Panel
  REALTIME_UPDATES: false,     // Supabase subscriptions
  ADVANCED_EXPORTS: false,     // PDF/Excel exports
  ENHANCED_FILTERS: false,     // Advanced filter combinations
  
  // Testing/Development Features
  MOCK_AUTH: true,             // Keep for demo
  MOCK_DATA_FALLBACK: true,    // Keep for resilience
  DEV_TOOLS: process.env.NODE_ENV !== 'production',
  ENV_TEST_PAGE: false,        // Already disabled
  
  // Database Features
  SUPABASE_INTEGRATION: true,   // Keep basic connection
  ADVANCED_QUERIES: false,      // Complex RPC functions
  DATABASE_MIGRATIONS: false,  // Migration tools
};

// Production environment detection
export const PRODUCTION_MODE = process.env.NODE_ENV === 'production' || 
                              import.meta.env.VITE_APP_ENV === 'production';

// Runtime feature check utility
export function isFeatureEnabled(feature: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[feature] === true;
}

// Production overrides
if (PRODUCTION_MODE) {
  // Force disable development features in production
  (FEATURE_FLAGS as any).DEV_TOOLS = false;
  (FEATURE_FLAGS as any).ADVANCED_CONNECTORS = false;
  (FEATURE_FLAGS as any).AI_RECOMMENDATIONS = false;
}