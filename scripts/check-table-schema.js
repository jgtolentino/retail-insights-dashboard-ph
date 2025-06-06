#!/usr/bin/env node

/**
 * Check actual table schema structure
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lcoxtanyckjzyxxcsjzz.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDUzMjcsImV4cCI6MjA2MzkyMTMyN30.W2JgvZdXubvWpKCNZ7TfjLiKANZO1Hlb164fBEKH2dA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkSchemas() {
  console.log('🔍 Checking actual table schemas...\n');
  
  // Check transactions table
  try {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing transactions:', error.message);
    } else if (transactions && transactions.length > 0) {
      console.log('✅ Transactions table structure:');
      console.log('   Columns:', Object.keys(transactions[0]));
      console.log('   Sample record:', transactions[0]);
    }
  } catch (err) {
    console.error('❌ Transactions check failed:', err.message);
  }
  
  console.log('\n' + '-'.repeat(50) + '\n');
  
  // Check transaction_items table
  try {
    const { data: items, error } = await supabase
      .from('transaction_items')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing transaction_items:', error.message);
    } else if (items && items.length > 0) {
      console.log('✅ Transaction_items table structure:');
      console.log('   Columns:', Object.keys(items[0]));
      console.log('   Sample record:', items[0]);
    }
  } catch (err) {
    console.error('❌ Transaction_items check failed:', err.message);
  }
  
  // Find our target records
  console.log('\n' + '-'.repeat(50) + '\n');
  console.log('🎯 Checking target records for deletion...\n');
  
  try {
    const { data: targets, error } = await supabase
      .from('transactions')
      .select('*')
      .in('id', [18973, 18466]);
    
    if (error) {
      console.error('❌ Error finding target records:', error.message);
    } else {
      console.log(`✅ Found ${targets.length} target records:`);
      targets.forEach((record, index) => {
        console.log(`   ${index + 1}. Transaction ID ${record.id}:`);
        console.log(`      ${JSON.stringify(record, null, 6)}`);
      });
    }
  } catch (err) {
    console.error('❌ Target record check failed:', err.message);
  }
}

checkSchemas().catch(console.error);