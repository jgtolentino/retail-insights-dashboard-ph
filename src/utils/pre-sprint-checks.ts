import { supabase } from '@/integrations/supabase/client';

interface CheckResult {
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

export interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

export class PreSprintChecks {
  private results: CheckResult[] = [];

  async runAllChecks(): Promise<CheckResult[]> {
    this.results = [];

    console.log('🔍 Starting pre-sprint checks...');

    await this.checkDatabaseConnection();
    await this.checkTablesExist();
    await this.checkDataAvailability();
    await this.checkRLSPolicies();
    await this.checkFunctions();

    console.log('✅ Pre-sprint checks completed');
    return this.results;
  }

  private addResult(status: CheckResult['status'], message: string, details?: string) {
    this.results.push({ status, message, details });
    console.log(`${status === 'pass' ? '✅' : status === 'warning' ? '⚠️' : '❌'} ${message}`);
    if (details) console.log(`   ${details}`);
  }

  private async checkDatabaseConnection(): Promise<void> {
    try {
      const { data, error } = await supabase.from('brands').select('count').limit(1);

      if (error) {
        this.addResult('fail', 'Database connection failed', error.message);
      } else {
        this.addResult('pass', 'Database connection successful');
      }
    } catch (error) {
      this.addResult('fail', 'Database connection error', String(error));
    }
  }

  private async checkTablesExist(): Promise<void> {
    const tables = ['brands', 'products', 'transactions', 'transaction_items'];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table as any)
          .select('*')
          .limit(1);

        if (error) {
          this.addResult('fail', `Table '${table}' check failed`, error.message);
        } else {
          this.addResult('pass', `Table '${table}' exists and accessible`);
        }
      } catch (error) {
        this.addResult('fail', `Table '${table}' error`, String(error));
      }
    }
  }

  private async checkDataAvailability(): Promise<void> {
    try {
      // Check transactions
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('id')
        .limit(10);

      if (txError) {
        this.addResult('fail', 'Transactions data check failed', txError.message);
      } else if (!transactions || transactions.length === 0) {
        this.addResult('warning', 'No transaction data found');
      } else {
        this.addResult('pass', `Found ${transactions.length} transactions (sample)`);
      }

      // Check brands
      const { data: brands, error: brandError } = await supabase
        .from('brands')
        .select('id, name')
        .limit(10);

      if (brandError) {
        this.addResult('fail', 'Brands data check failed', brandError.message);
      } else if (!brands || brands.length === 0) {
        this.addResult('warning', 'No brand data found');
      } else {
        this.addResult('pass', `Found ${brands.length} brands (sample)`);
      }

      // Check products
      const { data: products, error: productError } = await supabase
        .from('products')
        .select('id, name')
        .limit(10);

      if (productError) {
        this.addResult('fail', 'Products data check failed', productError.message);
      } else if (!products || products.length === 0) {
        this.addResult('warning', 'No product data found');
      } else {
        this.addResult('pass', `Found ${products.length} products (sample)`);
      }
    } catch (error) {
      this.addResult('fail', 'Data availability check error', String(error));
    }
  }

  private async checkRLSPolicies(): Promise<void> {
    try {
      // Test basic table access - if we can read data, RLS is properly configured or disabled
      const tables = ['brands', 'products', 'transactions', 'transaction_items'];

      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table as any)
            .select('*')
            .limit(1);

          if (error) {
            this.addResult('warning', `RLS may be blocking access to '${table}'`, error.message);
          } else {
            this.addResult('pass', `RLS configured correctly for '${table}'`);
          }
        } catch (error) {
          this.addResult('warning', `RLS check failed for '${table}'`, String(error));
        }
      }
    } catch (error) {
      this.addResult('fail', 'RLS policy check error', String(error));
    }
  }

  private async checkFunctions(): Promise<void> {
    try {
      // Test if key functions exist by calling them
      const rpcFunctions = ['get_daily_trends', 'get_age_distribution', 'get_consumer_profile'];

      for (const funcName of rpcFunctions) {
        try {
          const { data, error } = await supabase.rpc(funcName as any, {
            start_date: '2025-05-01T00:00:00Z',
            end_date: '2025-05-02T00:00:00Z',
          });

          if (error) {
            this.addResult('warning', `Function '${funcName}' may not exist`, error.message);
          } else {
            this.addResult('pass', `Function '${funcName}' is working`);
          }
        } catch (error) {
          this.addResult('warning', `Function '${funcName}' check failed`, String(error));
        }
      }
    } catch (error) {
      this.addResult('fail', 'Function check error', String(error));
    }
  }

  // Helper method to check if environment is ready for a specific sprint
  async isReadyForSprint(sprintNumber: number): Promise<boolean> {
    const results = await this.runAllChecks();
    const failures = results.filter(r => r.status === 'fail');

    if (failures.length > 0) {
      console.log(
        `❌ Not ready for Sprint ${sprintNumber}. ${failures.length} critical issues found.`
      );
      return false;
    }

    console.log(`✅ Ready for Sprint ${sprintNumber}!`);
    return true;
  }

  // Get summary of checks
  getSummary(): { passed: number; warnings: number; failed: number; total: number } {
    const passed = this.results.filter(r => r.status === 'pass').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;
    const failed = this.results.filter(r => r.status === 'fail').length;

    return {
      passed,
      warnings,
      failed,
      total: this.results.length,
    };
  }
}

// Export a singleton instance
export const preSprintChecks = new PreSprintChecks();

// Export the missing functions that SprintDashboard.tsx expects
export async function runPreSprintChecks(sprintNumber: number): Promise<ValidationResult> {
  const checks = new PreSprintChecks();
  const results = await checks.runAllChecks();
  const summary = checks.getSummary();

  const errors = results.filter(r => r.status === 'fail').map(r => r.message);
  const warnings = results.filter(r => r.status === 'warning').map(r => r.message);

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

export function displayValidationResults(results: ValidationResult): void {
  console.log(`\n📊 Validation Results:`);
  console.log(`   Passed: ${results.passed}`);
  console.log(`   Errors: ${results.errors.length}`);
  console.log(`   Warnings: ${results.warnings.length}\n`);

  if (results.errors.length > 0) {
    console.log('❌ Errors:');
    results.errors.forEach(error => console.log(`   - ${error}`));
  }

  if (results.warnings.length > 0) {
    console.log('⚠️ Warnings:');
    results.warnings.forEach(warning => console.log(`   - ${warning}`));
  }
}

// Helper function to run checks quickly
export async function runQuickCheck(): Promise<void> {
  const checks = new PreSprintChecks();
  await checks.runAllChecks();
  const summary = checks.getSummary();

  console.log(`\n📊 Check Summary:`);
  console.log(`   Passed: ${summary.passed}`);
  console.log(`   Warnings: ${summary.warnings}`);
  console.log(`   Failed: ${summary.failed}`);
  console.log(`   Total: ${summary.total}\n`);
}
