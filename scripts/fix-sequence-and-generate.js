import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function checkAndFixSequence() {
  console.log('🔧 CHECKING TRANSACTION ID SEQUENCE');
  console.log('='.repeat(50));
  
  // Get current transaction details
  const { data: transactions } = await supabase
    .from('transactions')
    .select('id')
    .order('id', { ascending: false })
    .limit(5);
  
  if (transactions && transactions.length > 0) {
    const maxId = Math.max(...transactions.map(t => t.id));
    console.log(`📊 Current max ID: ${maxId}`);
    console.log(`📊 Transaction count: ${transactions.length}`);
    
    // Reset sequence to avoid conflicts
    console.log('🔄 Resetting sequence...');
    
    try {
      // This will reset the sequence properly
      const resetSQL = `SELECT setval(pg_get_serial_sequence('transactions', 'id'), COALESCE(MAX(id), 1)) FROM transactions;`;
      
      // We'll handle this differently since we can't execute raw SQL easily
      console.log('📋 SQL needed to reset sequence:');
      console.log(resetSQL);
      console.log('\nProceeding with manual ID handling...\n');
      
    } catch (err) {
      console.log('⚠️ Could not reset sequence, will handle manually');
    }
  }
  
  return transactions;
}

async function generateWithManualIds() {
  console.log('🚀 GENERATING WITH MANUAL ID HANDLING');
  console.log('='.repeat(50));
  
  // Get current status
  const { count: current } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true });
    
  console.log(`📊 Current: ${current}`);
  console.log(`🎯 Target: 18,000`);
  
  const needed = 18000 - current;
  if (needed <= 0) {
    console.log('✅ Already at target!');
    return;
  }
  
  console.log(`➕ Generating: ${needed}`);
  
  // Get highest ID to start from
  const { data: lastTransaction } = await supabase
    .from('transactions')
    .select('id')
    .order('id', { ascending: false })
    .limit(1);
  
  let nextId = (lastTransaction?.[0]?.id || 0) + 1;
  console.log(`📈 Starting from ID: ${nextId}`);
  
  // Get stores
  const { data: stores } = await supabase.from('stores').select('id');
  const storeIds = stores?.map(s => s.id) || [1, 2, 3, 4];
  
  console.log(`🏪 Using stores: ${storeIds.join(', ')}\n`);
  
  const locations = [
    'Manila Central', 'Quezon City', 'Makati', 'Cebu City Center',
    'Davao Downtown', 'Pasig City', 'Taguig BGC', 'Antipolo',
    'Caloocan', 'Las Piñas', 'Iloilo City', 'Bacolod City'
  ];
  
  // Generate in smaller batches to avoid conflicts
  const batchSize = 100;
  const batches = Math.ceil(needed / batchSize);
  let totalAdded = 0;
  
  for (let batch = 0; batch < batches; batch++) {
    const batchCount = Math.min(batchSize, needed - totalAdded);
    const transactions = [];
    
    for (let i = 0; i < batchCount; i++) {
      // Generate date in June 2024 - May 2025 range
      const startDate = new Date('2024-06-01');
      const endDate = new Date('2025-05-31');
      const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
      const date = new Date(randomTime);
      
      const dayOfWeek = date.getDay();
      
      transactions.push({
        id: nextId++, // Explicitly set ID to avoid conflicts
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
      const { error } = await supabase
        .from('transactions')
        .insert(transactions);
      
      if (error) {
        console.error(`❌ Batch ${batch + 1} error:`, error.message);
        
        // If still ID conflict, try without explicit IDs
        if (error.message.includes('duplicate key') || error.message.includes('transactions_pkey')) {
          console.log('🔄 Retrying without explicit IDs...');
          
          const transactionsNoId = transactions.map(t => {
            const { id, ...rest } = t;
            return rest;
          });
          
          const { error: retryError } = await supabase
            .from('transactions')
            .insert(transactionsNoId);
          
          if (!retryError) {
            totalAdded += batchCount;
            console.log(`✅ Batch ${batch + 1} completed (retry)`);
          } else {
            console.error(`❌ Retry failed:`, retryError.message);
            break;
          }
        } else {
          break;
        }
      } else {
        totalAdded += batchCount;
        console.log(`✅ Batch ${batch + 1}/${batches}: +${batchCount} (${totalAdded}/${needed})`);
      }
      
    } catch (err) {
      console.error(`❌ Batch ${batch + 1} exception:`, err.message);
      break;
    }
  }
  
  console.log(`\n🎉 Successfully added ${totalAdded} transactions!`);
  
  // Update TBWA brands
  console.log('\n🏷️ UPDATING TBWA BRANDS');
  const tbwaBrands = ['Alaska', 'Oishi', 'Champion', 'Del Monte', 'Winston'];
  
  let updated = 0;
  for (const brand of tbwaBrands) {
    const { error } = await supabase
      .from('brands')
      .update({ is_tbwa_client: true })
      .ilike('name', `%${brand}%`);
    
    if (!error) updated++;
  }
  
  console.log(`✅ Updated ${updated} TBWA brands`);
  
  // Final count
  const { count: final } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\n📊 FINAL COUNT: ${final?.toLocaleString()}`);
  
  if (final >= 18000) {
    console.log('🎉 SUCCESS! 18,000+ transactions achieved!');
    console.log('✅ Your dashboard now has comprehensive retail data!');
  } else {
    console.log(`📈 Progress: ${final}/18,000 (${Math.round(final/18000*100)}%)`);
  }
}

async function run() {
  await checkAndFixSequence();
  await generateWithManualIds();
}

run();