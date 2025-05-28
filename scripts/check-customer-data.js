import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wsnwfnwfvqhkjxgqjdxe.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  throw new Error('Missing required environment variable: VITE_SUPABASE_ANON_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCustomerData() {
  console.log('🔍 Checking customer data structure...');
  
  try {
    // Check if transactions table has customer fields
    const { data: sampleTransactions, error } = await supabase
      .from('transactions')
      .select('id, customer_age, customer_gender, amount, created_at')
      .limit(5);
    
    if (error) {
      console.error('❌ Error querying transactions:', error);
      return;
    }
    
    console.log('📊 Sample transactions data:');
    console.table(sampleTransactions);
    
    // Check for customer_age distribution
    const agesWithData = sampleTransactions?.filter(t => t.customer_age !== null);
    const gendersWithData = sampleTransactions?.filter(t => t.customer_gender !== null);
    
    console.log(`\n📈 Data availability:`);
    console.log(`- Total sample transactions: ${sampleTransactions?.length || 0}`);
    console.log(`- Transactions with age data: ${agesWithData?.length || 0}`);
    console.log(`- Transactions with gender data: ${gendersWithData?.length || 0}`);
    
    if (agesWithData?.length === 0) {
      console.log('\n⚠️  WARNING: No customer_age data found. The age distribution chart will be empty.');
      console.log('💡 Consider adding customer_age values to your transactions table.');
    }
    
    if (gendersWithData?.length === 0) {
      console.log('\n⚠️  WARNING: No customer_gender data found. The gender distribution chart will be empty.');
      console.log('💡 Consider adding customer_gender values to your transactions table.');
    }
    
    if (agesWithData?.length > 0 && gendersWithData?.length > 0) {
      console.log('\n✅ Customer data looks good! The charts should work once SQL functions are applied.');
    }
    
  } catch (error) {
    console.error('💥 Failed to check customer data:', error);
  }
}

checkCustomerData();