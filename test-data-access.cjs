#!/usr/bin/env node

/**
 * Quick test to verify data access
 * Run this to check if your 18,000 records are accessible
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lcoxtanyckjzyxxcsjzz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDUzMjcsImV4cCI6MjA2MzkyMTMyN30.W2JgvZdXubvWpKCNZ7TfjLiKANZO1Hlb164fBEKH2dA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDataAccess() {
  console.log('🔍 Testing data access...\n');
  
  try {
    // Test 1: Count records
    console.log('1. Counting transactions...');
    const { count, error: countError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log('❌ Count Error:', countError.message);
      console.log('   Code:', countError.code);
      
      if (countError.code === 'PGRST301') {
        console.log('🚨 RLS ISSUE: Row Level Security is blocking access');
        console.log('   Fix: Run fix-rls.sql in Supabase SQL Editor');
      }
      return;
    }
    
    console.log(`✅ Found ${count} records\n`);
    
    // Test 2: Get sample data
    console.log('2. Getting sample data...');
    const { data: sample, error: sampleError } = await supabase
      .from('transactions')
      .select('id, total_amount, transaction_date')
      .limit(5);
    
    if (sampleError) {
      console.log('❌ Sample Error:', sampleError.message);
      return;
    }
    
    console.log('✅ Sample records:');
    sample.forEach(record => {
      console.log(`   ID: ${record.id}, Amount: ₱${record.total_amount}, Date: ${record.transaction_date}`);
    });
    
    // Test 3: Check date range
    console.log('\n3. Checking date range...');
    const { data: dates } = await supabase
      .from('transactions')
      .select('transaction_date')
      .order('transaction_date', { ascending: true })
      .limit(1);
    
    const { data: latestDates } = await supabase
      .from('transactions')
      .select('transaction_date')
      .order('transaction_date', { ascending: false })
      .limit(1);
    
    if (dates && latestDates) {
      console.log(`✅ Date range: ${dates[0].transaction_date} to ${latestDates[0].transaction_date}`);
    }
    
    // Test 4: Revenue calculation
    console.log('\n4. Calculating revenue...');
    const { data: revenue } = await supabase
      .from('transactions')
      .select('total_amount');
    
    if (revenue) {
      const totalRevenue = revenue.reduce((sum, t) => sum + t.total_amount, 0);
      const avgTransaction = totalRevenue / revenue.length;
      
      console.log(`✅ Total Revenue: ₱${totalRevenue.toLocaleString()}`);
      console.log(`✅ Average Transaction: ₱${avgTransaction.toFixed(2)}`);
    }
    
    console.log('\n🎉 Data access is working! Your dashboard should show these numbers.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDataAccess();