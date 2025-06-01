import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchemaAndTrim() {
  console.log('🔍 CHECKING SCHEMA AND TRIMMING TO 18,000 TRANSACTIONS...\n');
  
  try {
    // Step 1: Check table schemas
    console.log('📊 Step 1: Checking table structures...');
    
    // Check brands table structure
    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select('*')
      .limit(1);
    
    if (brandsError) {
      console.log('❌ Brands table error:', brandsError.message);
    } else {
      console.log('✅ Brands table exists');
      if (brands && brands.length > 0) {
        console.log('   Columns:', Object.keys(brands[0]));
      }
    }
    
    // Check current transaction count
    const { count: currentTransactions } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\nCurrent transactions: ${currentTransactions}`);
    
    if (currentTransactions === 18000) {
      console.log('✅ Already have exactly 18,000 transactions!');
      
      // Check data quality
      const { count: itemsCount } = await supabase
        .from('transaction_items')
        .select('*', { count: 'exact', head: true });
      
      const { count: brandsCount } = await supabase
        .from('brands')
        .select('*', { count: 'exact', head: true });
      
      console.log(`Transaction items: ${itemsCount}`);
      console.log(`Brands: ${brandsCount}`);
      console.log(`Avg items per transaction: ${itemsCount && currentTransactions ? (itemsCount / currentTransactions).toFixed(2) : 'N/A'}`);
      
      if (brandsCount === 0) {
        console.log('\n⚠️  No brands found - creating basic brand data...');
        await createBasicBrandData();
      }
      
      if (itemsCount < 10000) {
        console.log('\n⚠️  Very few transaction items - this might affect filtering...');
      }
      
      return;
    }
    
    // Step 2: Trim to exactly 18,000 if needed
    if (currentTransactions > 18000) {
      console.log('\n✂️  Step 2: Trimming excess transactions...');
      
      // Get the IDs of transactions to keep (first 18,000 by creation date)
      const { data: transactionsToKeep } = await supabase
        .from('transactions')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(18000);
      
      if (transactionsToKeep && transactionsToKeep.length > 0) {
        const keepIds = transactionsToKeep.map(t => t.id);
        
        // Delete transaction_items for transactions we're removing
        await supabase
          .from('transaction_items')
          .delete()
          .not('transaction_id', 'in', `(${keepIds.join(',')})`);
        
        // Delete excess transactions
        await supabase
          .from('transactions')
          .delete()
          .not('id', 'in', `(${keepIds.join(',')})`);
        
        console.log('✅ Trimmed to exactly 18,000 transactions');
      }
    } else if (currentTransactions < 18000) {
      console.log(`\n📈 Step 2: Need to generate ${18000 - currentTransactions} more transactions...`);
      await generateAdditionalTransactions(18000 - currentTransactions);
    }
    
    // Step 3: Final verification
    const { count: finalTransactions } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    const { count: finalItems } = await supabase
      .from('transaction_items')
      .select('*', { count: 'exact', head: true });
    
    console.log('\n🎉 FINAL RESULT:');
    console.log('=' .repeat(40));
    console.log(`📊 Transactions: ${finalTransactions}`);
    console.log(`📦 Transaction Items: ${finalItems}`);
    console.log(`📈 Avg Items per Transaction: ${finalItems && finalTransactions ? (finalItems / finalTransactions).toFixed(2) : 'N/A'}`);
    
    if (finalTransactions === 18000) {
      console.log('\n✅ SUCCESS: Dataset contains exactly 18,000 transactions!');
    } else {
      console.log(`\n⚠️  WARNING: Expected 18,000 transactions, got ${finalTransactions}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

async function createBasicBrandData() {
  try {
    // Create basic brands without TBWA client column (since it doesn't exist)
    const basicBrands = [
      { name: 'Marlboro', category: 'Cigarettes' },
      { name: 'Philip Morris', category: 'Cigarettes' },
      { name: 'Lucky Strike', category: 'Cigarettes' },
      { name: 'Coca-Cola', category: 'Beverages' },
      { name: 'Pepsi', category: 'Beverages' },
      { name: 'Sprite', category: 'Beverages' },
      { name: 'Lay\'s', category: 'Snacks' },
      { name: 'Pringles', category: 'Snacks' },
      { name: 'Oreo', category: 'Snacks' },
      { name: 'Pantene', category: 'Personal Care' },
    ];
    
    const { data: insertedBrands, error } = await supabase
      .from('brands')
      .insert(basicBrands)
      .select('*');
    
    if (error) {
      console.error('Error creating brands:', error);
    } else {
      console.log(`✅ Created ${insertedBrands?.length || 0} basic brands`);
    }
    
  } catch (error) {
    console.error('Error in createBasicBrandData:', error);
  }
}

async function generateAdditionalTransactions(count) {
  try {
    console.log(`Generating ${count} additional transactions...`);
    
    // Get existing stores and customers
    const { data: stores } = await supabase.from('stores').select('*');
    const { data: customers } = await supabase.from('customers').select('*');
    
    if (!stores || stores.length === 0 || !customers || customers.length === 0) {
      console.log('⚠️  Missing stores or customers - creating basic data first...');
      await createBasicReferenceData();
      return;
    }
    
    // Generate transactions in batches
    const batchSize = 1000;
    const batches = Math.ceil(count / batchSize);
    
    for (let batch = 0; batch < batches; batch++) {
      const currentBatchSize = Math.min(batchSize, count - (batch * batchSize));
      const transactions = [];
      
      for (let i = 0; i < currentBatchSize; i++) {
        const randomDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
        const store = stores[Math.floor(Math.random() * stores.length)];
        const customer = customers[Math.floor(Math.random() * customers.length)];
        
        transactions.push({
          customer_id: customer.id,
          store_id: store.id,
          total_amount: Math.floor(Math.random() * 1000) + 50,
          created_at: randomDate.toISOString(),
        });
      }
      
      await supabase.from('transactions').insert(transactions);
      console.log(`✅ Generated batch ${batch + 1}/${batches}`);
    }
    
  } catch (error) {
    console.error('Error generating additional transactions:', error);
  }
}

async function createBasicReferenceData() {
  console.log('Creating basic reference data...');
  
  // Create basic stores if none exist
  const { count: storeCount } = await supabase
    .from('stores')
    .select('*', { count: 'exact', head: true });
  
  if (storeCount === 0) {
    const basicStores = [
      { name: 'SM Manila', location: 'Manila', city: 'Manila', region: 'NCR' },
      { name: 'SM Cebu', location: 'Cebu', city: 'Cebu City', region: 'Central Visayas' },
      { name: 'SM Davao', location: 'Davao', city: 'Davao City', region: 'Davao' },
    ];
    
    await supabase.from('stores').insert(basicStores);
    console.log('✅ Created basic stores');
  }
  
  // Create basic customers if none exist
  const { count: customerCount } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true });
  
  if (customerCount === 0) {
    const basicCustomers = [];
    for (let i = 1; i <= 100; i++) {
      basicCustomers.push({
        name: `Customer ${i}`,
        age: Math.floor(Math.random() * 50) + 20,
        gender: Math.random() > 0.5 ? 'Male' : 'Female',
        location: ['Manila', 'Cebu', 'Davao'][Math.floor(Math.random() * 3)],
      });
    }
    
    await supabase.from('customers').insert(basicCustomers);
    console.log('✅ Created basic customers');
  }
}

// Run the script
checkSchemaAndTrim().catch(console.error);