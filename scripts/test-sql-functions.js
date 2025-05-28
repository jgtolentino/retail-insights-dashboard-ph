import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wsnwfnwfvqhkjxgqjdxe.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  throw new Error('Missing required environment variable: VITE_SUPABASE_ANON_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSQLFunctions() {
  console.log('🧪 Testing Sprint 3 SQL functions...\n');
  
  try {
    // Test 1: Age Distribution
    console.log('📊 Testing Age Distribution...');
    const { data: ageData, error: ageError } = await supabase
      .rpc('get_age_distribution', {
        start_date: '2025-04-30T00:00:00Z',
        end_date: '2025-05-30T23:59:59Z',
        bucket_size: 10
      });
    
    if (ageError) {
      console.error('❌ Age Distribution Error:', ageError.message);
    } else {
      console.log('✅ Age Distribution Results:');
      console.table(ageData);
    }
    
    // Test 2: Gender Distribution
    console.log('\n👥 Testing Gender Distribution...');
    const { data: genderData, error: genderError } = await supabase
      .rpc('get_gender_distribution', {
        start_date: '2025-04-30T00:00:00Z',
        end_date: '2025-05-30T23:59:59Z'
      });
    
    if (genderError) {
      console.error('❌ Gender Distribution Error:', genderError.message);
    } else {
      console.log('✅ Gender Distribution Results:');
      console.table(genderData);
    }
    
    // Test 3: Purchase Behavior
    console.log('\n🛒 Testing Purchase Behavior...');
    const { data: behaviorData, error: behaviorError } = await supabase
      .rpc('get_purchase_behavior_by_age', {
        start_date: '2025-04-30T00:00:00Z',
        end_date: '2025-05-30T23:59:59Z'
      });
    
    if (behaviorError) {
      console.error('❌ Purchase Behavior Error:', behaviorError.message);
    } else {
      console.log('✅ Purchase Behavior Results:');
      console.table(behaviorData);
    }
    
    // Test 4: Raw transaction sample
    console.log('\n📋 Sample transaction data...');
    const { data: sampleData, error: sampleError } = await supabase
      .from('transactions')
      .select('customer_age, customer_gender, amount, created_at')
      .not('customer_age', 'is', null)
      .limit(5);
    
    if (sampleError) {
      console.error('❌ Sample Data Error:', sampleError.message);
    } else {
      console.log('✅ Sample Transaction Data:');
      console.table(sampleData);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testSQLFunctions();