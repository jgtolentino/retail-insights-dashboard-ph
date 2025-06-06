// Feature flags for production deployment
export const FEATURE_FLAGS = {
  // Production Ready Features
  DASHBOARD_OVERVIEW: true,
  CONSUMER_INSIGHTS: true,
  PRODUCT_INSIGHTS: true, // Merged Product Mix + Brands
  BASKET_BEHAVIOR: true, // New page for basket analysis
  BASIC_FILTERS: true,
  TRENDS_PAGE: true,
  SETTINGS_PAGE: true,
  AI_RECOMMENDATIONS: true, // Enable AI recommendations panel

  // Legacy pages (deprecated in Phase 1)
  PRODUCT_MIX: false, // Merged into Product Insights
  BRANDS_PAGE: false, // Merged into Product Insights

  // Disable for Production (Stage 2)
  ADVANCED_CONNECTORS: false, // Parquet, PostgreSQL, MongoDB
  QUERY_BUILDER: false, // Visual Query Builder
  REALTIME_UPDATES: false, // Supabase subscriptions
  ADVANCED_EXPORTS: false, // PDF/Excel exports
  ENHANCED_FILTERS: false, // Advanced filter combinations

  // Testing/Development Features
  MOCK_AUTH: true, // Keep for demo
  MOCK_DATA_FALLBACK: true, // Keep for resilience
  DEV_TOOLS: process.env.NODE_ENV !== 'production',
  ENV_TEST_PAGE: false, // Already disabled

  // Database Features
  SUPABASE_INTEGRATION: true, // Keep basic connection
  ADVANCED_QUERIES: false, // Complex RPC functions
  DATABASE_MIGRATIONS: false, // Migration tools
};

// Production environment detection
export const PRODUCTION_MODE =
  process.env.NODE_ENV === 'production' || import.meta.env.VITE_APP_ENV === 'production';

// Runtime feature check utility
export function isFeatureEnabled(feature: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[feature] === true;
}

// Production overrides
if (PRODUCTION_MODE) {
  // Force disable development features in production
  (FEATURE_FLAGS as any).DEV_TOOLS = false;
  (FEATURE_FLAGS as any).ADVANCED_CONNECTORS = false;
  // Note: AI_RECOMMENDATIONS now enabled for production
}

export const features = {
  ENABLE_AI_INSIGHTS: true,
  ENABLE_COMPETITIVE_ANALYSIS: true,
  ENABLE_CUSTOMER_DENSITY: true,
  ENABLE_SYSTEM_HEALTH: true,
  ENABLE_BASKET_ANALYSIS: true,
  ENABLE_RETAIL_ANALYTICS: true,
  ENABLE_ADVANCED_FILTERS: true,
  ENABLE_EXPORT: true,
  ENABLE_DIAGNOSTIC_PANEL: true,
  ENABLE_DATA_TEST: true,
  ENABLE_PURCHASE_PATTERNS: true,
  ENABLE_STORE_PERFORMANCE: true,
  ENABLE_CUSTOMER_INSIGHTS: true,
  ENABLE_AI_RECOMMENDATIONS: true,
  ENABLE_PERFORMANCE_MONITOR: true,
  ENABLE_CONSUMER_INSIGHTS: true,
  ENABLE_BASKET_BEHAVIOR: true,
  ENABLE_AI_SERVICE: true,
  ENABLE_AZURE_OPENAI: true,
  ENABLE_DASHBOARD: true,
  ENABLE_ENHANCED_ANALYTICS: true,
  ENABLE_COMPATIBLE_ANALYTICS: true,
  ENABLE_EXPORT_SERVICE: true,
  ENABLE_KEYVAULT: true,
  ENABLE_SENTRY: true,
  ENABLE_SUPABASE: true,
  ENABLE_LOGGER: true,
  ENABLE_CONFIG: true,
  ENABLE_TEST: true,
  ENABLE_SETUP: true,
  ENABLE_CHARTS: true,
  ENABLE_UI: true,
  ENABLE_COMPONENTS: true,
  ENABLE_PAGES: true,
  ENABLE_HOOKS: true,
  ENABLE_SERVICES: true,
  ENABLE_INTEGRATIONS: true,
  ENABLE_UTILS: true,
  ENABLE_LIB: true,
  ENABLE_TYPES: true,
  ENABLE_CONSTANTS: true,
  ENABLE_STYLES: true,
  ENABLE_ASSETS: true,
  ENABLE_PUBLIC: true,
  ENABLE_APP: true,
  ENABLE_SRC: true,
  ENABLE_ROOT: true
};
