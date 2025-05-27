// Database configuration with fallback support

export const databaseConfig = {
  // Primary database (can switch between Supabase and Azure)
  primary: import.meta.env.VITE_USE_AZURE === 'true' ? 'azure' : 'supabase',
  
  // Supabase config
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  
  // Azure PostgreSQL config
  azure: {
    connectionString: import.meta.env.VITE_AZURE_PG_CONNECTION_STRING,
    host: import.meta.env.VITE_AZURE_PG_HOST,
    database: import.meta.env.VITE_AZURE_PG_DATABASE,
    user: import.meta.env.VITE_AZURE_PG_USER,
    password: import.meta.env.VITE_AZURE_PG_PASSWORD,
    port: parseInt(import.meta.env.VITE_AZURE_PG_PORT || '5432'),
    ssl: import.meta.env.VITE_AZURE_PG_SSL !== 'false'
  },
  
  // Feature flags
  features: {
    enableRealtime: import.meta.env.VITE_ENABLE_REALTIME !== 'false',
    enableCache: import.meta.env.VITE_ENABLE_CACHE === 'true',
    cacheTimeout: parseInt(import.meta.env.VITE_CACHE_TIMEOUT || '300000'), // 5 minutes
  }
}

export const isDevelopment = import.meta.env.DEV
export const isProduction = import.meta.env.PROD