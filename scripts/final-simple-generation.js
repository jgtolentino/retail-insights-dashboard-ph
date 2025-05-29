import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateSimpleTransactions() {
  console.log('🚀 FINAL ATTEMPT - GENERATING 15,000 TRANSACTIONS\n');
  
  // Get existing stores
  const { data: stores } = await supabase.from('stores').select('id');
  const storeIds = stores?.map(s => s.id) || [1, 2, 3, 4];
  console.log('Store IDs:', storeIds);
  
  // Get current count
  const { count: current } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true });
  
  const needed = 18000 - current;
  console.log(`Current: ${current}, Need: ${needed}\n`);
  
  if (needed <= 0) return;
  
  // Generate in smaller batches
  const batchSize = 100;
  let totalAdded = 0;
  
  const locations = [
    'Manila Central',
    'Quezon City', 
    'Makati',
    'Cebu City Center',
    'Davao Downtown',
    'Pasig City',
    'Taguig BGC',
    'Antipolo',
    'Caloocan',
    'Las Piñas'
  ];
  
  for (let i = 0; i < needed; i += batchSize) {
    const batchCount = Math.min(batchSize, needed - i);
    const transactions = [];
    
    for (let j = 0; j < batchCount; j++) {
      const date = new Date('2024-06-01');
      date.setDate(date.getDate() + Math.floor(Math.random() * 365));
      
      const dayOfWeek = date.getDay();
      
      transactions.push({
        created_at: date.toISOString(),
        total_amount: 50 + Math.floor(Math.random() * 500),
        customer_age: 18 + Math.floor(Math.random() * 50),
        customer_gender: Math.random() < 0.52 ? 'Female' : 'Male',
        store_location: locations[Math.floor(Math.random() * locations.length)],
        store_id: storeIds[Math.floor(Math.random() * storeIds.length)],
        checkout_seconds: 30 + Math.floor(Math.random() * 270),
        is_weekend: dayOfWeek === 0 || dayOfWeek === 6
      });
    }
    
    try {
      const { data, error } = await supabase.from('transactions').insert(transactions);
      if (error) throw error;
      
      totalAdded += batchCount;
      
      // Progress update every 10 batches
      if ((i / batchSize + 1) % 10 === 0) {
        console.log(`Progress: ${totalAdded}/${needed} (${Math.round(totalAdded/needed*100)}%)`);
      }
    } catch (err) {
      console.error(`Error at batch ${Math.floor(i/batchSize) + 1}:`, err.message);
      break;
    }
  }
  
  console.log(`\n✅ Successfully added ${totalAdded} transactions!`);
}

async function updateBrands() {
  console.log('\n🏷️ UPDATING TBWA BRANDS');
  
  // Simple update for key TBWA brands
  const updates = [
    { name_pattern: '%Alaska%', is_tbwa: true },
    { name_pattern: '%Oishi%', is_tbwa: true },
    { name_pattern: '%Champion%', is_tbwa: true },
    { name_pattern: '%Del Monte%', is_tbwa: true },
    { name_pattern: '%Winston%', is_tbwa: true }
  ];
  
  for (const update of updates) {
    const { error } = await supabase
      .from('brands')
      .update({ is_tbwa_client: update.is_tbwa })
      .ilike('name', update.name_pattern);
    
    if (!error) {
      console.log(`✅ Updated ${update.name_pattern} brands`);
    }
  }
}

async function verify() {
  console.log('\n📊 FINAL STATUS');
  console.log('='.repeat(50));
  
  const { count: trans } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true });
  
  const { count: items } = await supabase
    .from('transaction_items')
    .select('*', { count: 'exact', head: true });
  
  const { count: brands } = await supabase
    .from('brands')
    .select('*', { count: 'exact', head: true });
  
  const { count: tbwa } = await supabase
    .from('brands')
    .select('*', { count: 'exact', head: true })
    .eq('is_tbwa_client', true);
  
  console.log(`📊 Transactions: ${trans?.toLocaleString()}`);
  console.log(`📦 Transaction Items: ${items?.toLocaleString()}`);
  console.log(`🏷️ Total Brands: ${brands}`);
  console.log(`✨ TBWA Brands: ${tbwa}`);
  
  if (trans >= 18000) {
    console.log('\n🎉 SUCCESS! Target of 18,000 transactions achieved!');
    console.log('✅ Your dashboard now has comprehensive data for analytics!');
  }
}

// Run everything
(async () => {
  try {
    await generateSimpleTransactions();
    await updateBrands();
    await verify();
  } catch (error) {
    console.error('Fatal error:', error);
  }
})();