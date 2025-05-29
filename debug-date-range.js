import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDateRange() {
  console.log('🔍 DEBUGGING DATE RANGE LOGIC...\n');
  
  try {
    // 1. Get min date
    const { data: minDateData, error: minError } = await supabase
      .from('transactions')
      .select('created_at')
      .order('created_at', { ascending: true })
      .limit(1);
    
    console.log('Min date query result:', minDateData, minError);
    
    // 2. Get max date  
    const { data: maxDateData, error: maxError } = await supabase
      .from('transactions')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1);
    
    console.log('Max date query result:', maxDateData, maxError);
    
    if (!minError && !maxError && minDateData && maxDateData) {
      const startDate = new Date(minDateData[0].created_at);
      const endDate = new Date(maxDateData[0].created_at);
      
      console.log('📅 Calculated Date Range:');
      console.log('  Start:', startDate.toISOString());
      console.log('  End:', endDate.toISOString());
      
      // 3. Test the actual query with this date range
      const { data: testData, error: testError } = await supabase
        .from('transactions')
        .select('total_amount, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      
      console.log('📊 Query Results:');
      console.log('  Total Transactions:', testData?.length || 0);
      console.log('  Error:', testError);
      console.log('  Sample dates:', testData?.slice(0, 3).map(t => t.created_at));
    }
    
    // 4. Test without any date filters
    const { count: totalCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    console.log('📈 Total without filters:', totalCount);
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugDateRange();