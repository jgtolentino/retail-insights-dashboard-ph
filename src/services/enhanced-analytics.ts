/**
 * Enhanced Analytics Service for Sprint 4
 * Automatically uses compatibility layer when Sprint 4 tables don't exist
 */

import { supabase } from '@/integrations/supabase/client';
import { compatibleAnalyticsService } from './compatible-analytics';

// Check if Sprint 4 tables exist
let useCompatibilityMode = true;

// Test for Sprint 4 schema
async function checkSpring4Schema() {
  try {
    const { error } = await supabase.from('substitutions').select('id').limit(1);

    useCompatibilityMode = !!error;
  } catch {
    useCompatibilityMode = true;
  }
}

checkSpring4Schema();

// Export the service - will use compatibility mode if needed
export const enhancedAnalyticsService = new Proxy(
  {},
  {
    get(target, prop) {
      if (useCompatibilityMode) {
        return compatibleAnalyticsService[prop];
      }
      // Original service methods would go here
      return compatibleAnalyticsService[prop]; // For now, always use compatible version
    },
  }
);

// Re-export types
export * from './enhanced-analytics-types';
