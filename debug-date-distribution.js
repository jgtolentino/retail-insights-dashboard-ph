import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDateDistribution() {
  console.log('🔍 DEBUGGING DATE DISTRIBUTION...\n');
  
  try {
    // Get sample of dates to see the distribution
    const { data: sampleDates, error } = await supabase
      .from('transactions')
      .select('created_at')
      .order('created_at', { ascending: true })
      .limit(100);
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log('📅 First 10 transaction dates:');
    sampleDates.slice(0, 10).forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.created_at}`);
    });
    
    console.log('\n📅 Last 10 transaction dates:');
    sampleDates.slice(-10).forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.created_at}`);
    });
    
    // Check transactions with null created_at
    const { count: nullCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .is('created_at', null);
    
    console.log('\n📊 Transactions with null created_at:', nullCount);
    
    // Check transactions before 2024-06-01
    const { count: beforeCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', '2024-06-01T00:00:00Z');
    
    console.log('📊 Transactions before 2024-06-01:', beforeCount);
    
    // Check transactions after 2025-05-30
    const { count: afterCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .gt('created_at', '2025-05-30T23:59:59Z');
    
    console.log('📊 Transactions after 2025-05-30:', afterCount);
    
    // Check transactions in the filtered range
    const { count: inRangeCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', '2024-06-01T01:40:18.621Z')
      .lte('created_at', '2025-05-30T23:54:44.133Z');
    
    console.log('📊 Transactions in calculated range:', inRangeCount);
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugDateDistribution();