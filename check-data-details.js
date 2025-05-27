import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lcoxtanyckjzyxxcsjzz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDA0NzUsImV4cCI6MjA2Mzg3NjQ3NX0.O6beSaKNUanbvASudEeOVCo-i6BVNcX5X-qtb7zANpM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('🔍 Checking database details...\n');

  // Check brands
  const { data: brands, error: brandsError } = await supabase
    .from('brands')
    .select('*');
  
  console.log('BRANDS:');
  if (brandsError) {
    console.log('Error:', brandsError.message);
  } else {
    console.log(`Total: ${brands.length}`);
    brands.forEach(b => console.log(`- ${b.name} (${b.category}) - TBWA: ${b.is_tbwa_client}`));
  }

  // Check products
  const { data: products } = await supabase
    .from('products')
    .select('*');
  
  console.log('\nPRODUCTS:');
  console.log(`Total: ${products?.length || 0}`);
  products?.slice(0, 5).forEach(p => console.log(`- ${p.name} - ₱${p.price}`));

  // Check stores
  const { data: stores } = await supabase
    .from('stores')
    .select('*');
  
  console.log('\nSTORES:');
  console.log(`Total: ${stores?.length || 0}`);
  stores?.forEach(s => console.log(`- ${s.name} (${s.region})`));

  // Check transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .order('transaction_date', { ascending: false })
    .limit(10);
  
  console.log('\nTRANSACTIONS (Latest 10):');
  console.log(`Sample size: ${transactions?.length || 0}`);
  transactions?.forEach(t => 
    console.log(`- ${t.transaction_date}: ₱${t.total_amount} (${t.items_count} items)`)
  );

  // Check transaction items
  const { data: items } = await supabase
    .from('transaction_items')
    .select('*')
    .limit(5);
  
  console.log('\nTRANSACTION ITEMS:');
  console.log(`Sample: ${items?.length || 0} items shown`);

  // Test the dashboard query
  console.log('\n📊 Testing Dashboard Query:');
  const { data: brandSales, error: queryError } = await supabase
    .from('transaction_items')
    .select(`
      subtotal,
      products!inner (
        brand_id,
        brands!inner (
          name,
          is_tbwa_client
        )
      )
    `)
    .limit(10);

  if (queryError) {
    console.log('Dashboard query error:', queryError);
  } else {
    console.log('Dashboard query works! Sample results:', brandSales?.length);
  }
}

checkData();