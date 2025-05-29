import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addInsertPolicies() {
  console.log('🔒 FIXING RLS POLICIES FOR DATA GENERATION\n');
  
  // First, let's check current transaction count
  const { count: current } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true });
  
  console.log(`📊 Current transactions: ${current}`);
  console.log(`🎯 Target: 18,000`);
  console.log(`➕ Need to add: ${18000 - current}\n`);
  
  // Create a simple batch with proper error handling
  console.log('🔧 Attempting direct insert with current permissions...');
  
  const testTransaction = {
    created_at: new Date().toISOString(),
    total_amount: 150,
    customer_age: 25,
    customer_gender: 'Female',
    store_location: 'Manila Central',
    store_id: 1,
    checkout_seconds: 120,
    is_weekend: false
  };
  
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([testTransaction]);
      
    if (error) {
      console.error('❌ RLS Policy Issue:', error.message);
      console.log('\n📋 MANUAL SOLUTION REQUIRED:');
      console.log('='.repeat(50));
      console.log('Please run this SQL in your Supabase SQL Editor:\n');
      
      const rlsSQL = `
-- Add INSERT policies for data generation
CREATE POLICY "Allow anonymous insert to transactions" ON transactions
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous insert to transaction_items" ON transaction_items
FOR INSERT WITH CHECK (true);

-- Also allow UPDATE for brand status
CREATE POLICY "Allow anonymous update to brands" ON brands
FOR UPDATE USING (true);
      `;
      
      console.log(rlsSQL);
      console.log('\nAfter running the SQL above, re-run this script.');
      
    } else {
      console.log('✅ Insert successful! RLS policies allow data generation.');
      
      // Clean up test transaction
      await supabase
        .from('transactions')
        .delete()
        .eq('id', data[0].id);
        
      console.log('🧹 Cleaned up test transaction.');
      console.log('\n▶️ Now run: node scripts/final-simple-generation.js');
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

// Alternative: Generate via service role if available
async function generateWithServiceRole() {
  console.log('\n🔑 CHECKING FOR SERVICE ROLE ACCESS...');
  
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceKey) {
    console.log('ℹ️ No service role key found. Using anon key with RLS policies.');
    return false;
  }
  
  console.log('🚀 Service role available - bypassing RLS...');
  
  const serviceSupabase = createClient(supabaseUrl, serviceKey);
  
  try {
    // Test service role access
    const { count } = await serviceSupabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
      
    console.log(`✅ Service role works! Current count: ${count}`);
    return serviceSupabase;
    
  } catch (err) {
    console.log('❌ Service role access failed:', err.message);
    return false;
  }
}

async function quickGenerate() {
  console.log('\n⚡ QUICK GENERATION ATTEMPT');
  console.log('='.repeat(40));
  
  // Try service role first
  const serviceSupabase = await generateWithServiceRole();
  const client = serviceSupabase || supabase;
  
  // Get current count
  const { count: current } = await client
    .from('transactions')
    .select('*', { count: 'exact', head: true });
    
  const needed = 18000 - current;
  
  if (needed <= 0) {
    console.log('✅ Already at target!');
    return;
  }
  
  console.log(`📈 Generating ${Math.min(needed, 1000)} transactions...`);
  
  const transactions = [];
  const batchSize = Math.min(needed, 1000);
  
  for (let i = 0; i < batchSize; i++) {
    const date = new Date('2024-06-01');
    date.setDate(date.getDate() + Math.floor(Math.random() * 365));
    
    transactions.push({
      created_at: date.toISOString(),
      total_amount: 50 + Math.floor(Math.random() * 500),
      customer_age: 18 + Math.floor(Math.random() * 50),
      customer_gender: Math.random() < 0.52 ? 'Female' : 'Male',
      store_location: ['Manila Central', 'Quezon City', 'Makati', 'Cebu City Center'][Math.floor(Math.random() * 4)],
      store_id: [1, 2, 3, 4][Math.floor(Math.random() * 4)],
      checkout_seconds: 30 + Math.floor(Math.random() * 270),
      is_weekend: Math.random() < 0.3
    });
  }
  
  try {
    const { error } = await client.from('transactions').insert(transactions);
    
    if (error) {
      throw error;
    }
    
    console.log(`✅ Successfully added ${batchSize} transactions!`);
    
    // Check final count
    const { count: final } = await client
      .from('transactions')
      .select('*', { count: 'exact', head: true });
      
    console.log(`📊 New total: ${final}`);
    
    if (final >= 18000) {
      console.log('🎉 TARGET ACHIEVED! 18,000+ transactions!');
    } else {
      console.log(`📈 Progress: ${final}/18,000 (${Math.round(final/18000*100)}%)`);
    }
    
  } catch (error) {
    console.error('❌ Generation failed:', error.message);
    return false;
  }
  
  return true;
}

async function run() {
  await addInsertPolicies();
  
  // Try quick generation
  const success = await quickGenerate();
  
  if (!success) {
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Apply the RLS policy SQL above in Supabase');
    console.log('2. Re-run: node scripts/final-simple-generation.js');
  }
}

run();