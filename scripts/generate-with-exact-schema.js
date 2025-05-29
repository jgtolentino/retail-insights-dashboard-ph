import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateTransactionsSimple() {
  console.log('🚀 GENERATING 15,000 MORE TRANSACTIONS\n');
  
  // Get current count
  const { count: current } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true });
  
  const needed = 18000 - current;
  console.log(`Current: ${current}, Need: ${needed}`);
  
  if (needed <= 0) {
    console.log('✅ Already at target!');
    return;
  }
  
  // Generate transactions with exact schema
  const batchSize = 500;
  const batches = Math.ceil(needed / batchSize);
  let successCount = 0;
  
  // Store locations from your existing data
  const locations = [
    'Manila Central',
    'Quezon City',
    'Makati',
    'Cebu City Center',
    'Davao Downtown',
    'Region IV-A, Cavite, Tagaytay, Kaybagal',
    'Pasig City',
    'Caloocan',
    'Taguig BGC',
    'Antipolo',
    'Marikina',
    'Las Piñas',
    'Parañaque',
    'Valenzuela',
    'Muntinlupa',
    'Iloilo City',
    'Bacolod City',
    'Cagayan de Oro'
  ];
  
  // Store IDs from your existing data
  const storeIds = ['STR001', 'STR002', 'STR003', 'STR004'];
  
  for (let batch = 0; batch < batches; batch++) {
    const transactions = [];
    const count = Math.min(batchSize, needed - (batch * batchSize));
    
    for (let i = 0; i < count; i++) {
      // Generate date between June 2024 and May 2025
      const date = new Date('2024-06-01');
      date.setDate(date.getDate() + Math.floor(Math.random() * 365));
      
      // Generate checkout time (30-300 seconds)
      const checkoutSeconds = 30 + Math.floor(Math.random() * 270);
      
      // Weekend check
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      transactions.push({
        created_at: date.toISOString(),
        total_amount: 50 + Math.floor(Math.random() * 500),
        customer_age: 18 + Math.floor(Math.random() * 50),
        customer_gender: Math.random() < 0.52 ? 'Female' : 'Male',
        store_location: locations[Math.floor(Math.random() * locations.length)],
        store_id: storeIds[Math.floor(Math.random() * storeIds.length)],
        checkout_seconds: checkoutSeconds,
        is_weekend: isWeekend
      });
    }
    
    try {
      const { error } = await supabase.from('transactions').insert(transactions);
      if (error) throw error;
      successCount += count;
      console.log(`✅ Batch ${batch + 1}/${batches} completed (${successCount}/${needed} total)`);
    } catch (err) {
      console.error(`❌ Batch ${batch + 1} error:`, err.message);
    }
  }
  
  console.log(`\n✅ Added ${successCount} transactions!`);
}

async function updateBrandStatus() {
  console.log('\n🏷️ UPDATING BRAND STATUS');
  
  // Mark TBWA brands
  const tbwaBrands = [
    'Alaska', 'Alpine', 'Cow Bell', 'Krem-Top',
    'Oishi', 'Smart C+', 'Gourmet Picks', 'Crispy Patata',
    'Champion', 'Calla', 'Hana', 'Pride',
    'Del Monte', 'S&W', 'Today\'s', 'Fit \'n Right',
    'Winston', 'Camel', 'Mevius', 'LD', 'Mighty'
  ];
  
  let updatedCount = 0;
  for (const brand of tbwaBrands) {
    const { error } = await supabase
      .from('brands')
      .update({ is_tbwa_client: true })
      .ilike('name', `%${brand}%`);
    
    if (!error) updatedCount++;
  }
  
  console.log(`✅ Updated ${updatedCount} TBWA brands`);
}

async function addMoreStores() {
  console.log('\n🏪 ADDING MORE STORES');
  
  const newStores = [
    { id: 'STR005', name: 'Pasig Store', location: 'Pasig City', type: 'Urban Sari-sari' },
    { id: 'STR006', name: 'BGC Mini Mart', location: 'Taguig BGC', type: 'Mini Mart' },
    { id: 'STR007', name: 'Antipolo Store', location: 'Antipolo', type: 'Rural Sari-sari' },
    { id: 'STR008', name: 'Marikina Store', location: 'Marikina', type: 'Urban Sari-sari' },
    { id: 'STR009', name: 'Las Piñas Store', location: 'Las Piñas', type: 'Urban Sari-sari' },
    { id: 'STR010', name: 'Iloilo Store', location: 'Iloilo City', type: 'Urban Sari-sari' },
    { id: 'STR011', name: 'Bacolod Store', location: 'Bacolod City', type: 'Urban Sari-sari' },
    { id: 'STR012', name: 'CDO Store', location: 'Cagayan de Oro', type: 'Urban Sari-sari' }
  ];
  
  let addedCount = 0;
  for (const store of newStores) {
    const { error } = await supabase.from('stores').upsert(store);
    if (!error) addedCount++;
  }
  
  console.log(`✅ Added ${addedCount} new stores`);
}

async function finalCheck() {
  console.log('\n📊 FINAL VERIFICATION');
  console.log('='.repeat(60));
  
  const { count: transCount } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true });
  
  const { count: storeCount } = await supabase
    .from('stores')
    .select('*', { count: 'exact', head: true });
  
  const { count: brandCount } = await supabase
    .from('brands')
    .select('*', { count: 'exact', head: true });
  
  const { count: tbwaCount } = await supabase
    .from('brands')
    .select('*', { count: 'exact', head: true })
    .eq('is_tbwa_client', true);
  
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
  
  console.log(`📊 Total Transactions: ${transCount}`);
  console.log(`🏪 Total Stores: ${storeCount}`);
  console.log(`🏷️ Total Brands: ${brandCount}`);
  console.log(`✨ TBWA Brands: ${tbwaCount}`);
  console.log(`📅 Date Range: ${dateRange?.[0]?.created_at?.substring(0,10)} to ${latestDate?.[0]?.created_at?.substring(0,10)}`);
  
  if (transCount >= 18000) {
    console.log('\n🎉 SUCCESS! Database now has 18,000+ transactions!');
    console.log('✅ Ready for dashboard analytics!');
  }
}

async function run() {
  try {
    await generateTransactionsSimple();
    await addMoreStores();
    await updateBrandStatus();
    await finalCheck();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

run();