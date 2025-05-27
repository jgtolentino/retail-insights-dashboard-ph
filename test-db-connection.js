import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lcoxtanyckjzyxxcsjzz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDA0NzUsImV4cCI6MjA2Mzg3NjQ3NX0.O6beSaKNUanbvASudEeOVCo-i6BVNcX5X-qtb7zANpM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('Checking Supabase database...\n');

  try {
    // Check for brands table
    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select('*')
      .limit(5);

    if (brandsError) {
      console.log('❌ Brands table not found or error:', brandsError.message);
    } else {
      console.log(`✅ Brands table exists with ${brands?.length || 0} records`);
      if (brands && brands.length > 0) {
        console.log('   Sample brands:', brands.map(b => b.name).join(', '));
      }
    }

    // Check for transactions table
    const { data: transactions, error: transError } = await supabase
      .from('transactions')
      .select('*')
      .limit(5);

    if (transError) {
      console.log('❌ Transactions table not found or error:', transError.message);
    } else {
      console.log(`✅ Transactions table exists with ${transactions?.length || 0} records`);
    }

    // Check for products table
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(5);

    if (productsError) {
      console.log('❌ Products table not found or error:', productsError.message);
    } else {
      console.log(`✅ Products table exists with ${products?.length || 0} records`);
    }

    // Check for stores table
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('*')
      .limit(5);

    if (storesError) {
      console.log('❌ Stores table not found or error:', storesError.message);
    } else {
      console.log(`✅ Stores table exists with ${stores?.length || 0} records`);
    }

    console.log('\n📝 Next steps:');
    console.log('1. Go to Supabase SQL Editor: https://app.supabase.com/project/lcoxtanyckjzyxxcsjzz/sql');
    console.log('2. Copy and paste the contents of: supabase/setup_scoutdb.sql');
    console.log('3. Click "Run" to execute the SQL');
    console.log('4. Refresh your dashboard to see the data!');

  } catch (error) {
    console.error('Error checking database:', error);
  }
}

checkDatabase();