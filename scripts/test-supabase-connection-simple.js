#!/usr/bin/env node

// Simple Supabase connection test using @supabase/supabase-js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = 'https://lcoxtanyckjzyxxcsjzz.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_KEY or VITE_SUPABASE_ANON_KEY environment variable not set');
  console.log('Set it with: export SUPABASE_KEY="your_service_role_key"');
  process.exit(1);
}

async function testSupabaseConnection() {
  try {
    console.log('🔌 Creating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created successfully!');

    // Test a simple query - check if we can access any table
    console.log('📊 Testing database access...');
    
    // Try to get a count from a common table (adjust table name as needed)
    try {
      const { data, error, count } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true });
      
      if (error) {
        console.log('⚠️ Products table access failed:', error.message);
        
        // Try alternative tables
        const tables = ['transactions', 'stores', 'brands', 'customers'];
        for (const table of tables) {
          try {
            const { data: testData, error: testError } = await supabase
              .from(table)
              .select('*')
              .limit(1);
            
            if (!testError && testData) {
              console.log(`✅ Successfully accessed '${table}' table`);
              console.log(`📈 Sample record found: ${testData.length > 0 ? 'Yes' : 'No'}`);
              break;
            }
          } catch (e) {
            console.log(`⚠️ Table '${table}' not accessible`);
          }
        }
      } else {
        console.log(`✅ Products table accessible`);
        console.log(`📈 Total products: ${count || 'Unknown'}`);
      }
    } catch (queryError) {
      console.log('⚠️ Query test failed:', queryError.message);
    }

    // Test RPC function call (if any exist)
    try {
      console.log('🔧 Testing RPC functions...');
      const { data: rpcData, error: rpcError } = await supabase.rpc('test_connection');
      if (!rpcError) {
        console.log('✅ RPC function test successful');
      } else {
        console.log('⚠️ No test_connection RPC function found (this is normal)');
      }
    } catch (e) {
      console.log('⚠️ RPC test skipped (no functions available)');
    }

    console.log('🎉 Supabase connection test completed!');

  } catch (error) {
    console.error('❌ Supabase connection error:', error.message);
    process.exit(1);
  }
}

testSupabaseConnection();