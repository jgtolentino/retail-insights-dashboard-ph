import { supabase } from '@/integrations/supabase/client';

interface SprintRequirements {
  env?: string[];
  tables?: string[];
  fields?: Record<string, string[]>;
  libraries?: string[];
  endpoints?: string[];
}

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

export async function runPreSprintChecks(sprintNumber: number): Promise<ValidationResult> {
  const result: ValidationResult = {
    passed: true,
    errors: [],
    warnings: []
  };

  try {
    switch (sprintNumber) {
      case 1: // Transaction Trends
        // Check time series data structure
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('id, created_at, total_amount')
          .limit(1);
        
        if (txError || !txData) {
          result.errors.push('Cannot access transactions table');
          result.passed = false;
        } else if (!txData[0]?.created_at) {
          result.errors.push('Missing created_at field in transactions');
          result.passed = false;
        }
        
        // Check stores for location data
        const { data: storeData } = await supabase
          .from('stores')
          .select('id, store_location')
          .limit(1);
        
        if (!storeData?.[0]?.store_location) {
          result.warnings.push('Missing store location data for location filters');
        }
        break;

      case 2: // Product Mix & SKU
        // Check product relationships
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('id, name, brand_id')
          .limit(1);
        
        if (productError || !productData) {
          result.errors.push('Cannot access products table');
          result.passed = false;
        }
        
        // Check brands table for category
        const { data: brandData, error: brandError } = await supabase
          .from('brands')
          .select('id, name, category')
          .limit(1);
        
        if (brandError || !brandData) {
          result.errors.push('Cannot access brands table');
          result.passed = false;
        } else if (!brandData[0]?.category) {
          result.warnings.push('Missing category field in brands');
        }
        
        // Check transaction items
        const { data: itemData } = await supabase
          .from('transaction_items')
          .select('id, product_id, quantity')
          .limit(1);
        
        if (!itemData) {
          result.errors.push('Cannot access transaction_items table');
          result.passed = false;
        }
        break;

      case 3: // Consumer Behavior
        // Check for behavior tracking fields
        const { data: behaviorData } = await supabase
          .from('transactions')
          .select('id')
          .limit(1);
        
        if (!behaviorData) {
          result.errors.push('Cannot validate consumer behavior fields');
          result.passed = false;
        } else {
          // These fields might not exist yet
          result.warnings.push('Ensure request_method and suggestion_accepted fields exist');
        }
        break;

      case 4: // Consumer Profiling
        // Check location data for mapping
        const { data: geoData } = await supabase
          .from('stores')
          .select('id, latitude, longitude, barangay')
          .limit(1);
        
        if (!geoData) {
          result.errors.push('Cannot access store location data');
          result.passed = false;
        } else if (!geoData[0]?.latitude || !geoData[0]?.longitude) {
          result.errors.push('Missing latitude/longitude coordinates');
          result.passed = false;
        }
        
        // Check if Google Maps can be loaded
        if (typeof window !== 'undefined' && !window.google?.maps) {
          result.warnings.push('Google Maps API not loaded');
        }
        break;

      case 5: // AI Recommendations
        // Check API keys
        if (!import.meta.env.VITE_OPENAI_KEY) {
          result.errors.push('Missing VITE_OPENAI_KEY environment variable');
          result.passed = false;
        }
        
        // Check data volume for insights
        const { count } = await supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true });
        
        if (!count || count < 100) {
          result.warnings.push(`Only ${count} transactions found. AI insights work better with more data.`);
        }
        break;

      default:
        result.warnings.push(`No validation configured for sprint ${sprintNumber}`);
    }
  } catch (error) {
    result.errors.push(`Pre-sprint check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    result.passed = false;
  }

  return result;
}

export async function validateSprintRequirements(sprint: number): Promise<ValidationResult> {
  const requirements: Record<number, SprintRequirements> = {
    1: {
      env: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'],
      tables: ['transactions', 'stores'],
      fields: {
        transactions: ['created_at', 'total_amount'],
        stores: ['store_location']
      }
    },
    2: {
      tables: ['products', 'brands', 'transaction_items'],
      fields: {
        products: ['id', 'name', 'brand_id'],
        brands: ['id', 'name', 'category'],
        transaction_items: ['product_id', 'quantity', 'price']
      }
    },
    3: {
      fields: {
        transactions: ['request_method', 'suggestion_accepted']
      }
    },
    4: {
      tables: ['stores'],
      fields: {
        stores: ['latitude', 'longitude', 'barangay']
      },
      libraries: ['@react-google-maps/api']
    },
    5: {
      env: ['VITE_OPENAI_KEY'],
      endpoints: ['/api/insights', '/api/recommendations']
    }
  };

  const result: ValidationResult = {
    passed: true,
    errors: [],
    warnings: []
  };

  const sprintReqs = requirements[sprint];
  if (!sprintReqs) {
    result.warnings.push(`No requirements defined for sprint ${sprint}`);
    return result;
  }

  // Check environment variables
  if (sprintReqs.env) {
    for (const envVar of sprintReqs.env) {
      if (!import.meta.env[envVar]) {
        result.errors.push(`Missing environment variable: ${envVar}`);
        result.passed = false;
      }
    }
  }

  // Check tables exist
  if (sprintReqs.tables) {
    for (const table of sprintReqs.tables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          result.errors.push(`Cannot access table: ${table}`);
          result.passed = false;
        }
      } catch (error) {
        result.errors.push(`Error checking table ${table}`);
        result.passed = false;
      }
    }
  }

  // Check required fields
  if (sprintReqs.fields) {
    for (const [table, fields] of Object.entries(sprintReqs.fields)) {
      try {
        const { data, error } = await supabase.from(table).select(fields.join(',')).limit(1);
        if (error) {
          result.errors.push(`Cannot verify fields in ${table}: ${error.message}`);
          result.passed = false;
        } else if (!data || data.length === 0) {
          result.warnings.push(`No data found in ${table} to verify fields`);
        }
      } catch (error) {
        result.errors.push(`Error checking fields in ${table}`);
        result.passed = false;
      }
    }
  }

  return result;
}

// Utility function to display validation results
export function displayValidationResults(results: ValidationResult): void {
  if (results.passed) {
    console.log('✅ All validations passed!');
  } else {
    console.log('❌ Validation failed!');
  }

  if (results.errors.length > 0) {
    console.group('🚨 Errors:');
    results.errors.forEach(error => console.error(`  • ${error}`));
    console.groupEnd();
  }

  if (results.warnings.length > 0) {
    console.group('⚠️  Warnings:');
    results.warnings.forEach(warning => console.warn(`  • ${warning}`));
    console.groupEnd();
  }
}

export const preSprintChecks = {
  async checkSupabaseConnection(): Promise<CheckResult> {
    console.log('🔍 Checking Supabase connection...');
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .limit(1);

      if (error) {
        return {
          status: 'error',
          message: `Supabase connection check failed: ${error.message}`,
          details: { error }
        };
      }

      return {
        status: 'success',
        message: 'Supabase connection check passed',
        details: {}
      };

    } catch (error) {
      return {
        status: 'error',
        message: `Supabase connection check failed: ${error}`,
        details: { error }
      };
    }
  },

  async checkDatabaseStructure(): Promise<CheckResult> {
    console.log('🔍 Checking database structure...');
    
    try {
      // Check transactions table
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('id, total_amount, created_at')
        .limit(1);

      if (txError) {
        return {
          status: 'error',
          message: `Transactions check failed: ${txError.message}`,
          details: { error: txError }
        };
      }

      // Check stores table
      const { data: stores, error: storeError } = await supabase
        .from('stores')
        .select('id, store_location')
        .limit(1);

      if (storeError) {
        return {
          status: 'error',
          message: `Stores check failed: ${storeError.message}`,
          details: { error: storeError }
        };
      }

      // Check products table
      const { data: products, error: productError } = await supabase
        .from('products')
        .select('id, name, brand_id')
        .limit(1);

      if (productError) {
        return {
          status: 'error',
          message: `Products check failed: ${productError.message}`,
          details: { error: productError }
        };
      }

      // Check brands table
      const { data: brands, error: brandError } = await supabase
        .from('brands')
        .select('id, name, category')
        .limit(1);

      if (brandError) {
        return {
          status: 'error',
          message: `Brands check failed: ${brandError.message}`,
          details: { error: brandError }
        };
      }

      // Check transaction_items table
      const { data: items, error: itemError } = await supabase
        .from('transaction_items')
        .select('id, product_id, quantity')
        .limit(1);

      if (itemError) {
        return {
          status: 'error',
          message: `Transaction items check failed: ${itemError.message}`,
          details: { error: itemError }
        };
      }

      return {
        status: 'success',
        message: 'Database structure check passed',
        details: {}
      };

    } catch (error) {
      return {
        status: 'error',
        message: `Database structure check failed: ${error}`,
        details: { error }
      };
    }
  },

  async checkDataAvailability(): Promise<CheckResult> {
    console.log('📊 Checking data availability...');
    
    try {
      // Check transactions table
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('id, total_amount, created_at')
        .limit(1);

      if (txError) {
        return {
          status: 'error',
          message: `Transactions check failed: ${txError.message}`,
          details: { error: txError }
        };
      }

      // Check stores table
      const { data: stores, error: storeError } = await supabase
        .from('stores')
        .select('id, store_location')
        .limit(1);

      if (storeError) {
        return {
          status: 'error',
          message: `Stores check failed: ${storeError.message}`,
          details: { error: storeError }
        };
      }

      // Check products table
      const { data: products, error: productError } = await supabase
        .from('products')
        .select('id, name, brand_id')
        .limit(1);

      if (productError) {
        return {
          status: 'error',
          message: `Products check failed: ${productError.message}`,
          details: { error: productError }
        };
      }

      // Check brands table
      const { data: brands, error: brandError } = await supabase
        .from('brands')
        .select('id, name, category')
        .limit(1);

      if (brandError) {
        return {
          status: 'error',
          message: `Brands check failed: ${brandError.message}`,
          details: { error: brandError }
        };
      }

      // Check transaction_items table
      const { data: items, error: itemError } = await supabase
        .from('transaction_items')
        .select('id, product_id, quantity')
        .limit(1);

      if (itemError) {
        return {
          status: 'error',
          message: `Transaction items check failed: ${itemError.message}`,
          details: { error: itemError }
        };
      }

      return {
        status: 'success',
        message: 'Data availability check passed',
        details: {}
      };

    } catch (error) {
      return {
        status: 'error',
        message: `Data availability check failed: ${error}`,
        details: { error }
      };
    }
  },

  async checkTableExists(tableName: string): Promise<boolean> {
    try {
      // Use proper table names from the database schema
      const validTables = ['brands', 'products', 'transactions', 'stores', 'substitutions', 'transaction_items'];
      
      if (!validTables.includes(tableName)) {
        console.warn(`⚠️ Unknown table name: ${tableName}`);
        return false;
      }

      const { data, error } = await supabase
        .from(tableName as any)
        .select('*')
        .limit(1);

      return !error;
    } catch (error) {
      console.error(`❌ Error checking table ${tableName}:`, error);
      return false;
    }
  },

  async checkFunctionExists(functionName: string): Promise<boolean> {
    try {
      // Test the function with minimal parameters
      const { error } = await supabase
        .rpc(functionName as any, {});

      // If we get a parameter error, the function exists
      return !error || error.message.includes('parameter');
    } catch (error) {
      console.error(`❌ Error checking function ${functionName}:`, error);
      return false;
    }
  }
};
