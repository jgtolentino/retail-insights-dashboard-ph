import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runChecks() {
  // 1. Count brands
  const { data: brands, error: brandsError } = await supabase.from('brands').select('id');
  console.log('Brand count:', brands?.length, brandsError);

  // 2. Count products with brands
  const { data: products, error: productsError } = await supabase.from('products').select('id').not('brand_id', 'is', null);
  console.log('Products with brands:', products?.length, productsError);

  // 3. Sample join: transactions → items → products → brands
  const { data: sample, error: sampleError } = await supabase
    .from('transactions')
    .select('id, store_location, transaction_items(product_id, products(name, brand_id, brands(name)))')
    .limit(10);
  console.log('Sample join:', JSON.stringify(sample, null, 2), sampleError);

  // 4. Aggregate top brands by revenue
  const { data: items, error: itemsError } = await supabase
    .from('transaction_items')
    .select('quantity, price, products!inner(name, brand_id, brands!inner(id, name))')
    .limit(10000);
  const brandRevenue = {};
  items?.forEach(item => {
    const brandName = item.products?.brands?.name || 'Unknown Brand';
    const revenue = (item.quantity || 0) * (item.price || 0);
    brandRevenue[brandName] = (brandRevenue[brandName] || 0) + revenue;
  });
  const topBrands = Object.entries(brandRevenue)
    .map(([brand, revenue]) => ({ brand, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
  console.log('Top brands by revenue:', topBrands, itemsError);
}

runChecks(); 