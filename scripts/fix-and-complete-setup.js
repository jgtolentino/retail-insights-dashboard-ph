import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
  console.log('🔍 Checking table structure...');
  
  // Get a sample transaction to see the actual columns
  const { data: sample, error } = await supabase
    .from('transactions')
    .select('*')
    .limit(1);
  
  if (sample && sample.length > 0) {
    console.log('Transaction columns:', Object.keys(sample[0]));
    return Object.keys(sample[0]);
  }
  
  return [];
}

async function generateTransactionsWithCorrectSchema() {
  console.log('\n📝 GENERATING TRANSACTIONS WITH CORRECT SCHEMA');
  console.log('='.repeat(60));
  
  // First check the schema
  const columns = await checkTableStructure();
  const hasAmount = columns.includes('amount');
  const hasTotalAmount = columns.includes('total_amount');
  
  console.log(`Schema check: amount=${hasAmount}, total_amount=${hasTotalAmount}`);
  
  // Get current count
  const { count: currentCount } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true });
  
  const needed = 18000 - currentCount;
  console.log(`Current: ${currentCount}, Need: ${needed}`);
  
  if (needed <= 0) {
    console.log('✅ Already at target!');
    return;
  }
  
  // Get stores
  const { data: stores } = await supabase.from('stores').select('id');
  if (!stores || stores.length === 0) {
    console.log('Creating stores...');
    
    const newStores = [
      { id: 'STR001', name: 'Manila Central Store', location: 'Manila Central', type: 'Urban Sari-sari' },
      { id: 'STR002', name: 'Quezon City Store', location: 'Quezon City', type: 'Urban Sari-sari' },
      { id: 'STR003', name: 'Makati Store', location: 'Makati', type: 'Mini Mart' },
      { id: 'STR004', name: 'Cebu City Store', location: 'Cebu City Center', type: 'Urban Sari-sari' },
      { id: 'STR005', name: 'Davao Store', location: 'Davao Downtown', type: 'Urban Sari-sari' },
      { id: 'STR006', name: 'Cavite Store', location: 'Region IV-A, Cavite, Tagaytay, Kaybagal', type: 'Rural Sari-sari' }
    ];
    
    for (const store of newStores) {
      await supabase.from('stores').upsert(store);
    }
  }
  
  // Get products
  const { data: products } = await supabase.from('products').select('id, price');
  
  // Generate transactions
  const batchSize = 100;
  const batches = Math.ceil(needed / batchSize);
  
  for (let batch = 0; batch < batches; batch++) {
    const transactions = [];
    const count = Math.min(batchSize, needed - (batch * batchSize));
    
    for (let i = 0; i < count; i++) {
      const date = new Date('2024-06-01');
      date.setDate(date.getDate() + Math.floor(Math.random() * 365));
      
      const transaction = {
        store_id: stores ? stores[Math.floor(Math.random() * stores.length)].id : 'STR001',
        customer_age: 18 + Math.floor(Math.random() * 50),
        customer_gender: Math.random() < 0.52 ? 'Female' : 'Male',
        created_at: date.toISOString(),
        payment_method: Math.random() < 0.8 ? 'cash' : 'gcash'
      };
      
      // Add the correct amount field
      if (hasTotalAmount) {
        transaction.total_amount = 50 + Math.floor(Math.random() * 500);
      } else if (hasAmount) {
        transaction.amount = 50 + Math.floor(Math.random() * 500);
      }
      
      transactions.push(transaction);
    }
    
    try {
      const { error } = await supabase.from('transactions').insert(transactions);
      if (error) throw error;
      console.log(`✅ Batch ${batch + 1}/${batches} added (${count} transactions)`);
    } catch (err) {
      console.error(`❌ Batch ${batch + 1} error:`, err.message);
    }
  }
}

async function addTransactionItems() {
  console.log('\n📦 ADDING TRANSACTION ITEMS');
  console.log('='.repeat(60));
  
  // Get transactions without items
  const { data: transactions } = await supabase
    .from('transactions')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1000);
  
  if (!transactions) return;
  
  // Get products
  const { data: products } = await supabase
    .from('products')
    .select('id, price')
    .limit(50);
  
  if (!products || products.length === 0) {
    console.log('No products found');
    return;
  }
  
  console.log(`Adding items to ${transactions.length} transactions...`);
  
  // Add items to transactions
  for (const trans of transactions) {
    // Check if already has items
    const { count } = await supabase
      .from('transaction_items')
      .select('*', { count: 'exact', head: true })
      .eq('transaction_id', trans.id);
    
    if (count > 0) continue;
    
    // Add 1-5 items
    const itemCount = 1 + Math.floor(Math.random() * 4);
    const items = [];
    
    for (let i = 0; i < itemCount; i++) {
      const product = products[Math.floor(Math.random() * products.length)];
      items.push({
        transaction_id: trans.id,
        product_id: product.id,
        quantity: 1 + Math.floor(Math.random() * 3),
        price: product.price
      });
    }
    
    await supabase.from('transaction_items').insert(items);
  }
  
  console.log('✅ Transaction items added');
}

async function createProductHierarchy() {
  console.log('\n🏷️ CREATING PRODUCT HIERARCHY');
  console.log('='.repeat(60));
  
  // Create categories if needed
  const categories = [
    { name: 'Dairy', description: 'Milk and dairy products' },
    { name: 'Snacks', description: 'Chips, crackers, and snacks' },
    { name: 'Beverages', description: 'Drinks and beverages' },
    { name: 'Personal Care', description: 'Hygiene and personal care' },
    { name: 'Household', description: 'Cleaning and household items' },
    { name: 'Food', description: 'Canned goods and food items' },
    { name: 'Tobacco', description: 'Cigarettes and tobacco' }
  ];
  
  // Update brands with TBWA client status
  const tbwaBrands = ['Alaska', 'Oishi', 'Champion', 'Del Monte', 'Winston'];
  
  for (const brandName of tbwaBrands) {
    await supabase
      .from('brands')
      .update({ is_tbwa_client: true })
      .ilike('name', `%${brandName}%`);
  }
  
  console.log('✅ Product hierarchy updated');
}

async function finalVerification() {
  console.log('\n✅ FINAL VERIFICATION');
  console.log('='.repeat(60));
  
  const { count: transCount } = await supabase
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
  
  console.log(`📊 Transactions: ${transCount}`);
  console.log(`📦 Transaction Items: ${itemCount}`);
  console.log(`🏷️ Total Brands: ${brandCount}`);
  console.log(`✨ TBWA Brands: ${tbwaCount}`);
  
  if (transCount >= 18000) {
    console.log('\n🎉 SUCCESS! Database has 18,000+ transactions!');
  } else {
    console.log(`\n⚠️ Still need ${18000 - transCount} more transactions`);
  }
}

async function runCompleteSetup() {
  console.log('🚀 RUNNING COMPLETE DATABASE SETUP\n');
  
  try {
    // Check and generate transactions
    await generateTransactionsWithCorrectSchema();
    
    // Add transaction items
    await addTransactionItems();
    
    // Create product hierarchy
    await createProductHierarchy();
    
    // Final verification
    await finalVerification();
    
  } catch (error) {
    console.error('❌ Setup error:', error);
  }
}

// Run everything
runCompleteSetup();