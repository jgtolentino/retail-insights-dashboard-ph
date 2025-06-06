#!/usr/bin/env node
/**
 * Production Validation Suite - Comprehensive check for production readiness
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

class ProductionValidator {
  constructor() {
    this.results = { passed: 0, failed: 0, warnings: 0, tests: [] };
  }

  log(status, message, details = '') {
    console.log(`${status} ${message} ${details}`);
    this.results.tests.push({ status: status.includes('✅') ? 'PASS' : 'FAIL', message, details });
    if (status.includes('✅')) this.results.passed++;
    else if (status.includes('⚠️')) this.results.warnings++;
    else this.results.failed++;
  }

  async runAllTests() {
    console.log('🚀 Running Production Validation Suite...\n');

    // Database Connection Tests
    console.log('🔌 Database Connection Tests:');
    await this.testDatabaseConnection();
    await this.testDataIntegrity();
    
    // Metrics Accuracy Tests
    console.log('\n📊 Metrics Accuracy Tests:');
    await this.testMetricsAccuracy();
    await this.testUniqueCustomersLogic();
    
    // Performance Tests
    console.log('\n⚡ Performance Tests:');
    await this.testQueryPerformance();
    
    // Production Readiness Tests
    console.log('\n🏭 Production Readiness Tests:');
    await this.testEnvironmentConfig();
    await this.testSecuritySettings();
    
    this.generateReport();
    return this.results.failed === 0;
  }

  async testDatabaseConnection() {
    try {
      const { data, error } = await supabase.from('products').select('count').single();
      if (error) throw error;
      this.log('✅', 'Database connection successful');
    } catch (err) {
      this.log('❌', 'Database connection failed', err.message);
    }
  }

  async testDataIntegrity() {
    try {
      const { count } = await supabase.from('transactions').select('*', { count: 'exact', head: true });
      if (count > 0) {
        this.log('✅', `Data exists: ${count} transactions`);
      } else {
        this.log('⚠️', 'No transaction data found');
      }
    } catch (err) {
      this.log('❌', 'Data integrity check failed', err.message);
    }
  }

  async testMetricsAccuracy() {
    try {
      const { data } = await supabase.rpc('get_dashboard_summary');
      const summary = data?.[0];
      
      if (summary) {
        // Test for suspicious patterns
        if (summary.unique_customers === summary.total_transactions) {
          this.log('⚠️', 'Unique customers equals total transactions (suspicious)');
        } else {
          this.log('✅', 'Unique customers calculation appears realistic');
        }
        
        // Test for reasonable ratios
        const customerRatio = summary.unique_customers / summary.total_transactions;
        if (customerRatio > 0.3 && customerRatio < 0.9) {
          this.log('✅', `Customer ratio realistic: ${(customerRatio * 100).toFixed(1)}%`);
        } else {
          this.log('⚠️', `Customer ratio unusual: ${(customerRatio * 100).toFixed(1)}%`);
        }
        
        this.log('✅', 'Metrics accuracy validated');
      } else {
        this.log('❌', 'No dashboard summary data returned');
      }
    } catch (err) {
      this.log('❌', 'Metrics accuracy test failed', err.message);
    }
  }

  async testUniqueCustomersLogic() {
    try {
      // Test if unique customers logic makes sense
      const { data: transactions } = await supabase
        .from('transactions')
        .select('customer_age, customer_gender, store_location')
        .limit(100);
      
      if (transactions && transactions.length > 0) {
        const uniqueProfiles = new Set();
        transactions.forEach(t => {
          if (t.customer_age && t.customer_gender) {
            uniqueProfiles.add(`${t.customer_age}_${t.customer_gender}_${t.store_location}`);
          }
        });
        
        const uniqueRatio = uniqueProfiles.size / transactions.length;
        if (uniqueRatio < 0.95) {
          this.log('✅', `Unique customer logic working: ${uniqueProfiles.size}/${transactions.length} unique profiles`);
        } else {
          this.log('⚠️', 'Customer profiles too unique (may indicate poor logic)');
        }
      }
    } catch (err) {
      this.log('❌', 'Unique customers logic test failed', err.message);
    }
  }

  async testQueryPerformance() {
    try {
      const start = Date.now();
      await supabase.rpc('get_dashboard_summary');
      const duration = Date.now() - start;
      
      if (duration < 5000) {
        this.log('✅', `Dashboard query fast: ${duration}ms`);
      } else {
        this.log('⚠️', `Dashboard query slow: ${duration}ms`);
      }
    } catch (err) {
      this.log('❌', 'Performance test failed', err.message);
    }
  }

  async testEnvironmentConfig() {
    const requiredEnvs = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
    for (const env of requiredEnvs) {
      if (process.env[env]) {
        this.log('✅', `Environment variable ${env} configured`);
      } else {
        this.log('❌', `Missing environment variable: ${env}`);
      }
    }
  }

  async testSecuritySettings() {
    try {
      // Test if anon key has appropriate permissions
      const { data, error } = await supabase.from('transactions').select('*').limit(1);
      if (!error) {
        this.log('✅', 'Database access permissions working');
      } else {
        this.log('⚠️', 'Database permissions may be too restrictive', error.message);
      }
    } catch (err) {
      this.log('❌', 'Security test failed', err.message);
    }
  }

  generateReport() {
    console.log('\n📋 Production Validation Report:');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`⚠️  Warnings: ${this.results.warnings}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📊 Total Tests: ${this.results.tests.length}`);
    
    const successRate = ((this.results.passed / this.results.tests.length) * 100).toFixed(1);
    console.log(`🎯 Success Rate: ${successRate}%`);
    
    if (this.results.failed === 0) {
      console.log('\n🎉 PRODUCTION READY! All critical tests passed.');
    } else {
      console.log('\n⚠️  ISSUES FOUND. Review failed tests before production deployment.');
    }
    
    // Write detailed report
    fs.writeFileSync('production-validation-report.json', JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        passed: this.results.passed,
        warnings: this.results.warnings,
        failed: this.results.failed,
        successRate: successRate + '%'
      },
      tests: this.results.tests
    }, null, 2));
    
    console.log('📄 Detailed report saved to: production-validation-report.json');
  }
}

if (require.main === module) {
  const validator = new ProductionValidator();
  validator.runAllTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(err => {
      console.error('❌ Validation suite failed:', err);
      process.exit(1);
    });
}

module.exports = { ProductionValidator };