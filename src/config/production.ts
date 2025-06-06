// Production Configuration Template
// Replace with actual production values

export const config = {
  database: {
    url: process.env.DATABASE_URL || 'YOUR_PRODUCTION_DATABASE_URL',
    key: process.env.DATABASE_KEY || 'YOUR_PRODUCTION_DATABASE_KEY'
  },
  api: {
    baseUrl: process.env.API_BASE_URL || 'YOUR_PRODUCTION_API_URL'
  },
  features: {
    debug: false,
    monitoring: true,
    analytics: true
  }
};
