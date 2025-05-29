import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY required for data generation');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function generateCompleteData() {
  console.log('🚀 FINAL DATA GENERATION - SERVICE ROLE ACCESS');
  console.log('='.repeat(60));
  
  // Check current status
  const { count: current } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true });
    
  console.log(`📊 Current transactions: ${current}`);
  console.log(`🎯 Target: 18,000`);
  
  const needed = 18000 - current;
  console.log(`➕ Need to add: ${needed}\n`);
  
  if (needed <= 0) {
    console.log('✅ Already at target!');
    return;
  }
  
  // Get stores (don't assume IDs)
  const { data: stores } = await supabase.from('stores').select('id');
  const storeIds = stores?.map(s => s.id) || [];
  
  if (storeIds.length === 0) {
    console.log('📦 Creating basic stores...');
    const newStores = [
      { name: 'Manila Central Store', location: 'Manila Central', store_type: 'sari_sari' },
      { name: 'Quezon City Store', location: 'Quezon City', store_type: 'sari_sari' },
      { name: 'Makati Store', location: 'Makati', store_type: 'mini_mart' },
      { name: 'Cebu Store', location: 'Cebu City Center', store_type: 'sari_sari' }
    ];
    
    for (const store of newStores) {
      await supabase.from('stores').insert(store);
    }
    
    // Refresh store list
    const { data: refreshedStores } = await supabase.from('stores').select('id');
    storeIds.push(...(refreshedStores?.map(s => s.id) || []));
  }
  
  console.log(`🏪 Using ${storeIds.length} stores: ${storeIds.join(', ')}`);
  
  // Generate transactions in batches
  const batchSize = 500;
  const batches = Math.ceil(needed / batchSize);
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
    'Las Piñas',
    'Iloilo City',
    'Bacolod City'
  ];
  
  for (let batch = 0; batch < batches; batch++) {
    const batchCount = Math.min(batchSize, needed - totalAdded);
    const transactions = [];
    
    for (let i = 0; i < batchCount; i++) {
      // Generate date between June 2024 - May 2025
      const startDate = new Date('2024-06-01');
      const endDate = new Date('2025-05-31');
      const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
      const date = new Date(randomTime);
      
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      transactions.push({
        created_at: date.toISOString(),
        total_amount: 50 + Math.floor(Math.random() * 500),
        customer_age: 18 + Math.floor(Math.random() * 50),
        customer_gender: Math.random() < 0.52 ? 'Female' : 'Male',
        store_location: locations[Math.floor(Math.random() * locations.length)],
        store_id: storeIds[Math.floor(Math.random() * storeIds.length)],
        checkout_seconds: 30 + Math.floor(Math.random() * 270),
        is_weekend: isWeekend
      });
    }
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert(transactions);
        
      if (error) {
        console.error(`❌ Batch ${batch + 1} error:`, error.message);
        break;
      }
      
      totalAdded += batchCount;
      
      // Progress update
      const progress = Math.round((totalAdded / needed) * 100);
      console.log(`✅ Batch ${batch + 1}/${batches}: +${batchCount} transactions (${totalAdded}/${needed} - ${progress}%)`);
      
    } catch (err) {
      console.error(`❌ Batch ${batch + 1} failed:`, err.message);
      break;
    }
  }
  
  console.log(`\n🎉 Successfully added ${totalAdded} transactions!\n`);
  
  // Update TBWA brands
  console.log('🏷️ UPDATING TBWA BRAND STATUS');
  console.log('='.repeat(40));
  
  const tbwaBrands = [
    'Alaska', 'Alpine', 'Cow Bell', 'Krem-Top',
    'Oishi', 'Smart C+', 'Gourmet Picks', 'Crispy Patata',
    'Champion', 'Calla', 'Hana', 'Pride',
    'Del Monte', 'S&W', 'Today\'s', 'Fit \'n Right',
    'Winston', 'Camel', 'Mevius', 'LD', 'Mighty'
  ];
  
  let updatedBrands = 0;
  for (const brand of tbwaBrands) {
    const { error } = await supabase
      .from('brands')
      .update({ is_tbwa_client: true })
      .ilike('name', `%${brand}%`);
    
    if (!error) updatedBrands++;
  }
  
  console.log(`✅ Updated ${updatedBrands} TBWA brands`);
  
  // Final verification
  console.log('\n📊 FINAL VERIFICATION');
  console.log('='.repeat(50));
  
  const { count: finalCount } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true });
  
  const { count: itemCount } = await supabase
    .from('transaction_items')
    .select('*', { count: 'exact', head: true });
  
  const { count: brandCount } = await supabase
    .from('brands')
    .select('*', { count: 'exact', head: true });
  
  const { count: tbwaCount } = await supabase
    .from('brands')
    .select('*', { count: 'exact', head: true })
    .eq('is_tbwa_client', true);
  
  // Get date range
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
  
  console.log(`📊 Total Transactions: ${finalCount?.toLocaleString()}`);
  console.log(`📦 Transaction Items: ${itemCount?.toLocaleString()}`);
  console.log(`🏷️ Total Brands: ${brandCount}`);
  console.log(`✨ TBWA Brands: ${tbwaCount}`);
  
  if (dateRange?.[0] && latestDate?.[0]) {
    const startDate = dateRange[0].created_at.substring(0, 10);
    const endDate = latestDate[0].created_at.substring(0, 10);
    console.log(`📅 Date Range: ${startDate} to ${endDate}`);
  }
  
  if (finalCount >= 18000) {
    console.log('\n🎉 SUCCESS! Target of 18,000+ transactions achieved!');
    console.log('✅ Your retail insights dashboard is now ready with comprehensive data!');
    console.log('📈 Data includes all TBWA client brands and competitors');
    console.log('🗓️ Covers full year from June 2024 to May 2025');
  } else {
    console.log(`\n⚠️ Partial success: ${finalCount}/18,000 transactions`);
  }
}

generateCompleteData();