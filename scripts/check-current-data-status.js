import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCurrentDataStatus() {
  console.log('🔍 CHECKING CURRENT DATABASE STATUS...\n');
  
  try {
    // 1. Check total transactions
    const { count: transactionCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Total Transactions: ${transactionCount || 0}`);
    
    // 2. Check transaction items
    const { count: itemCount } = await supabase
      .from('transaction_items')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📦 Total Transaction Items: ${itemCount || 0}`);
    console.log(`📈 Avg Items per Transaction: ${itemCount && transactionCount ? (itemCount / transactionCount).toFixed(2) : 'N/A'}`);
    
    // 3. Check regional coverage
    const { data: regionalData } = await supabase
      .from('stores')
      .select('location')
      .order('location');
    
    const uniqueRegions = [...new Set(regionalData?.map(s => s.location) || [])];
    console.log(`\n🗺️  Unique Regions in Database: ${uniqueRegions.length}`);
    uniqueRegions.forEach(region => console.log(`  - ${region}`));
    
    // 4. Check date range of transactions
    const { data: dateRange } = await supabase
      .from('transactions')
      .select('created_at')
      .order('created_at', { ascending: true })
      .limit(1);
    
    const { data: latestDate } = await supabase
      .from('transactions')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1);
    
    console.log(`\n📅 Transaction Date Range:`);
    console.log(`  - Earliest: ${dateRange?.[0]?.created_at || 'N/A'}`);
    console.log(`  - Latest: ${latestDate?.[0]?.created_at || 'N/A'}`);
    
    // 5. Check basket sizes distribution
    const { data: basketSizes } = await supabase.rpc('get_basket_size_distribution');
    
    if (basketSizes) {
      console.log(`\n🛒 Basket Size Distribution:`);
      basketSizes.forEach(size => {
        console.log(`  - ${size.basket_size} items: ${size.transaction_count} transactions`);
      });
    }
    
    // 6. Check brand distribution
    const { data: brands } = await supabase
      .from('brands')
      .select('name, is_tbwa_client')
      .order('name');
    
    const tbwaBrands = brands?.filter(b => b.is_tbwa_client) || [];
    console.log(`\n🏷️  Total Brands: ${brands?.length || 0}`);
    console.log(`✨ TBWA Brands: ${tbwaBrands.length}`);
    
    // 7. Check store distribution
    const { data: stores } = await supabase
      .from('stores')
      .select('type')
      .order('type');
    
    const storeTypes = stores?.reduce((acc, store) => {
      acc[store.type] = (acc[store.type] || 0) + 1;
      return acc;
    }, {});
    
    console.log(`\n🏪 Store Types Distribution:`);
    Object.entries(storeTypes || {}).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}`);
    });
    
    // Summary recommendation
    console.log('\n' + '='.repeat(60));
    console.log('📋 RECOMMENDATION:');
    
    if (transactionCount >= 15000) {
      console.log('✅ You already have 15,000+ transactions!');
      console.log('⚠️  Running the new script might create duplicates.');
      console.log('💡 Consider backing up or clearing existing data first.');
    } else if (transactionCount > 0) {
      console.log(`⚠️  You have ${transactionCount} existing transactions.`);
      console.log('💡 The new script will ADD 15,000 more transactions.');
      console.log(`📊 Total after import: ${transactionCount + 15000} transactions`);
    } else {
      console.log('✅ Database is empty - safe to import 15,000 transactions!');
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  }
}

// Add basket size distribution function if it doesn't exist
const createBasketSizeFunction = `
CREATE OR REPLACE FUNCTION get_basket_size_distribution()
RETURNS TABLE (
  basket_size INT,
  transaction_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    item_count::INT as basket_size,
    COUNT(*)::BIGINT as transaction_count
  FROM (
    SELECT 
      transaction_id,
      COUNT(*) as item_count
    FROM transaction_items
    GROUP BY transaction_id
  ) basket_sizes
  GROUP BY item_count
  ORDER BY item_count;
END;
$$ LANGUAGE plpgsql;
`;

checkCurrentDataStatus();