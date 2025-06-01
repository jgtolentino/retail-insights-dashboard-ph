#!/usr/bin/env node

/**
 * Sprint 4 Demo Data Generator
 * Creates demo data for Sprint 4 features using existing schema
 * This is a temporary solution until migrations can be run
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lcoxtanyckjzyxxcsjzz.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDUzMjcsImV4cCI6MjA2MzkyMTMyN30.W2JgvZdXubvWpKCNZ7TfjLiKANZO1Hlb164fBEKH2dA';
const supabase = createClient(supabaseUrl, supabaseKey);

// Sample data for Sprint 4 features (simulated)
const sprint4DemoData = {
  substitutionPatterns: [
    { original_brand: 'Coca-Cola', substitute_brand: 'Pepsi', count: 45, acceptance_rate: 0.78 },
    { original_brand: 'Alaska', substitute_brand: 'Bear Brand', count: 38, acceptance_rate: 0.82 },
    { original_brand: 'San Miguel', substitute_brand: 'Red Horse', count: 32, acceptance_rate: 0.65 },
    { original_brand: 'Lucky Me', substitute_brand: 'Pancit Canton', count: 28, acceptance_rate: 0.85 },
    { original_brand: 'Nestle', substitute_brand: 'Alpine', count: 25, acceptance_rate: 0.72 },
    { original_brand: 'Palmolive', substitute_brand: 'Safeguard', count: 22, acceptance_rate: 0.68 },
    { original_brand: 'Colgate', substitute_brand: 'Close Up', count: 20, acceptance_rate: 0.75 },
    { original_brand: 'Ariel', substitute_brand: 'Tide', count: 18, acceptance_rate: 0.80 },
  ],
  
  requestBehaviors: [
    { type: 'branded', percentage: 60, avg_checkout_time: 65 },
    { type: 'unbranded', percentage: 30, avg_checkout_time: 85 },
    { type: 'pointing', percentage: 10, avg_checkout_time: 45 }
  ],
  
  paymentMethods: [
    { method: 'cash', percentage: 40, avg_transaction: 250 },
    { method: 'gcash', percentage: 30, avg_transaction: 380 },
    { method: 'maya', percentage: 20, avg_transaction: 420 },
    { method: 'credit', percentage: 10, avg_transaction: 680 }
  ],
  
  checkoutDurations: [
    { range: '0-30s', percentage: 25 },
    { range: '30-60s', percentage: 35 },
    { range: '1-2min', percentage: 25 },
    { range: '2-5min', percentage: 12 },
    { range: '5min+', percentage: 3 }
  ],
  
  aiRecommendations: [
    {
      title: 'High Substitution Alert: Coca-Cola',
      description: 'Coca-Cola shows 45 substitutions to Pepsi with 78% acceptance. Consider inventory management.',
      impact: 'high',
      potentialIncrease: 15
    },
    {
      title: 'Optimize Checkout Duration',
      description: '15% of transactions take over 2 minutes. Streamline checkout process for efficiency.',
      impact: 'medium',
      potentialIncrease: 8
    },
    {
      title: 'Digital Payment Adoption',
      description: 'GCash and Maya account for 50% of transactions. Promote digital payment incentives.',
      impact: 'high',
      potentialIncrease: 12
    }
  ]
};

async function createDemoDataEndpoint() {
  console.log('🎯 Creating Sprint 4 Demo Data Endpoint...');
  
  // Store demo data in localStorage for the frontend
  const demoDataScript = `
    // Sprint 4 Demo Data - Injected for demonstration
    window.SPRINT4_DEMO_DATA = ${JSON.stringify(sprint4DemoData, null, 2)};
    
    console.log('✅ Sprint 4 demo data loaded successfully');
    console.log('📊 Available data:', Object.keys(window.SPRINT4_DEMO_DATA));
  `;
  
  console.log('\n📋 INSTRUCTIONS TO ENABLE SPRINT 4 DEMO:');
  console.log('\n1. Open your browser developer console');
  console.log('2. Navigate to your application');
  console.log('3. Paste the following code:\n');
  console.log(demoDataScript);
  console.log('\n4. The Sprint 4 features will now show demo data');
  
  // Also save to a file for easy access
  const fs = require('fs');
  fs.writeFileSync('sprint4-demo-data.js', demoDataScript);
  console.log('\n✅ Demo data also saved to: sprint4-demo-data.js');
}

async function checkCurrentData() {
  console.log('\n🔍 Checking current database state...');
  
  try {
    // Check transaction count
    const { count: transactionCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    console.log(`✅ Current transactions: ${transactionCount || 0}`);
    
    // Check product count
    const { count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    
    console.log(`✅ Current products: ${productCount || 0}`);
    
    // Check brands
    const { data: brands } = await supabase
      .from('products')
      .select('brand')
      .limit(10);
    
    const uniqueBrands = [...new Set(brands?.map(b => b.brand) || [])];
    console.log(`✅ Sample brands: ${uniqueBrands.slice(0, 5).join(', ')}`);
    
  } catch (error) {
    console.error('❌ Error checking data:', error.message);
  }
}

async function generateMockAnalytics() {
  console.log('\n📊 Generating Mock Analytics for Sprint 4...');
  
  // Create a mock analytics service that returns demo data
  const mockService = `
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
      ...window.SPRINT4_DEMO_DATA
    };
  }
};
`;

  const fs = require('fs');
  fs.writeFileSync('src/services/mock-enhanced-analytics.ts', mockService);
  console.log('✅ Mock service created at: src/services/mock-enhanced-analytics.ts');
}

async function main() {
  console.log('🚀 Sprint 4 Demo Data Generator');
  console.log('=' .repeat(50));
  
  await checkCurrentData();
  await createDemoDataEndpoint();
  await generateMockAnalytics();
  
  console.log('\n🎉 Sprint 4 Demo Setup Complete!');
  console.log('\n📋 Next Steps:');
  console.log('1. Run the demo data script in your browser console');
  console.log('2. Navigate to /sprint4 to see the features');
  console.log('3. All visualizations will show realistic demo data');
  
  console.log('\n⚠️  Note: This is demo data only. For real data:');
  console.log('1. Run the migrations in Supabase SQL Editor');
  console.log('2. Use the full data generation script');
}

main().catch(console.error);