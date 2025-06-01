const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lcoxtanyckjzyxxcsjzz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDUzMjcsImV4cCI6MjA2MzkyMTMyN30.W2JgvZdXubvWpKCNZ7TfjLiKANZO1Hlb164fBEKH2dA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('🔍 Checking actual column names...\n');
  
  try {
    // Get one record to see all columns
    const { data: sample, error } = await supabase
      .from('transactions')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }
    
    if (sample && sample.length > 0) {
      console.log('✅ Available columns:');
      Object.keys(sample[0]).forEach(col => {
        console.log(`   - ${col}: ${sample[0][col]}`);
      });
      
      console.log('\n📊 Revenue calculation:');
      const { data: revenue } = await supabase
        .from('transactions')
        .select('total_amount');
      
      if (revenue) {
        const totalRevenue = revenue.reduce((sum, t) => sum + t.total_amount, 0);
        console.log(`   Total Revenue: ₱${totalRevenue.toLocaleString()}`);
        console.log(`   Avg Transaction: ₱${(totalRevenue / revenue.length).toFixed(2)}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
  }
}

checkSchema();