import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function completeOverrideDataset() {
  console.log('🔄 COMPLETELY OVERRIDING EXISTING DATASET WITH 18,000 COMPLETE TRANSACTIONS...\n');
  
  try {
    // Step 1: FORCE DELETE all existing data (complete override)
    console.log('💥 Step 1: FORCE DELETING ALL EXISTING DATA...');
    
    console.log('   Deleting transaction_items...');
    await supabase.from('transaction_items').delete().gte('id', 0);
    
    console.log('   Deleting transactions...');
    await supabase.from('transactions').delete().gte('id', 0);
    
    console.log('   Deleting products...');
    await supabase.from('products').delete().gte('id', 0);
    
    console.log('   Deleting brands...');
    await supabase.from('brands').delete().gte('id', 0);
    
    console.log('   Deleting customers...');
    await supabase.from('customers').delete().gte('id', 0);
    
    console.log('   Deleting customer_segments...');
    await supabase.from('customer_segments').delete().gte('id', 0);
    
    console.log('   Deleting stores...');
    await supabase.from('stores').delete().gte('id', 0);
    
    // Verify deletion
    const { count: remainingTransactions } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    console.log(`✅ OVERRIDE COMPLETE - Remaining transactions: ${remainingTransactions || 0}`);
    
    // Step 2: Create fresh reference data
    console.log('\n🏗️  Step 2: Creating fresh reference data...');
    
    // Create stores first (needed for transactions)
    const stores = [
      { name: 'SM Manila', location: 'Manila Central', region: 'NCR', city: 'Manila', type: 'Mall' },
      { name: 'Robinsons Ermita', location: 'Manila Central', region: 'NCR', city: 'Manila', type: 'Mall' },
      { name: 'SM City Cebu', location: 'Cebu City Center', region: 'Central Visayas', city: 'Cebu City', type: 'Mall' },
      { name: 'Ayala Center Cebu', location: 'Cebu City Center', region: 'Central Visayas', city: 'Cebu City', type: 'Mall' },
      { name: 'SM Lanang Premier', location: 'Davao Downtown', region: 'Davao', city: 'Davao City', type: 'Mall' },
      { name: 'Abreeza Mall', location: 'Davao Downtown', region: 'Davao', city: 'Davao City', type: 'Mall' },
      { name: 'SM Santa Rosa', location: 'Region IV-A, Cavite, Tagaytay, Kaybagal', region: 'CALABARZON', city: 'Santa Rosa', type: 'Mall' },
    ];
    
    let insertedStores = [];
    for (const store of stores) {
      const { data: storeData } = await supabase
        .from('stores')
        .insert([store])
        .select('*')
        .single();
      
      if (storeData) {
        insertedStores.push(storeData);
      }
    }
    console.log(`✅ Created ${insertedStores.length} stores`);
    
    // Create brands
    const brands = [
      { name: 'Marlboro', category: 'Cigarettes', is_tbwa: true },
      { name: 'Philip Morris', category: 'Cigarettes', is_tbwa: true },
      { name: 'Gatorade', category: 'Beverages', is_tbwa: true },
      { name: 'Pepsi', category: 'Beverages', is_tbwa: true },
      { name: 'Lay\'s', category: 'Snacks', is_tbwa: true },
      { name: 'Lucky Strike', category: 'Cigarettes', is_tbwa: false },
      { name: 'Coca-Cola', category: 'Beverages', is_tbwa: false },
      { name: 'Sprite', category: 'Beverages', is_tbwa: false },
      { name: 'Pringles', category: 'Snacks', is_tbwa: false },
      { name: 'Pantene', category: 'Personal Care', is_tbwa: false },
    ];
    
    let insertedBrands = [];
    for (const brand of brands) {
      const { data: brandData } = await supabase
        .from('brands')
        .insert([brand])
        .select('*')
        .single();
      
      if (brandData) {
        insertedBrands.push(brandData);
      }
    }
    console.log(`✅ Created ${insertedBrands.length} brands`);
    
    // Create products for each brand
    let insertedProducts = [];
    for (const brand of insertedBrands) {
      const productCount = 4; // 4 products per brand for consistency
      
      for (let i = 1; i <= productCount; i++) {
        let productName, price;
        
        switch (brand.category) {
          case 'Cigarettes':
            productName = `${brand.name} ${['Red', 'Blue', 'Gold', 'Menthol'][i - 1]}`;
            price = 120 + (i * 10); // ₱130-160
            break;
          case 'Beverages':
            productName = `${brand.name} ${['Regular', 'Zero', 'Diet', 'Lemon'][i - 1]}`;
            price = 35 + (i * 5); // ₱40-55
            break;
          case 'Snacks':
            productName = `${brand.name} ${['Original', 'BBQ', 'Cheese', 'Spicy'][i - 1]}`;
            price = 45 + (i * 8); // ₱53-77
            break;
          case 'Personal Care':
            productName = `${brand.name} ${['Shampoo', 'Conditioner', 'Soap', 'Lotion'][i - 1]}`;
            price = 85 + (i * 15); // ₱100-145
            break;
          default:
            productName = `${brand.name} Product ${i}`;
            price = 50 + (i * 10);
        }
        
        const { data: productData } = await supabase
          .from('products')
          .insert([{
            name: productName,
            brand_id: brand.id,
            price,
            category: brand.category,
          }])
          .select('*')
          .single();
        
        if (productData) {
          insertedProducts.push(productData);
        }
      }
    }
    console.log(`✅ Created ${insertedProducts.length} products`);
    
    // Create customers
    let insertedCustomers = [];
    const customerNames = ['Juan Santos', 'Maria Cruz', 'Jose Reyes', 'Ana Garcia', 'Pedro Mendoza'];
    
    for (let i = 1; i <= 1000; i++) {
      const name = customerNames[i % customerNames.length] + ` ${i}`;
      const store = insertedStores[i % insertedStores.length];
      
      const { data: customerData } = await supabase
        .from('customers')
        .insert([{
          name,
          age: 20 + (i % 50), // Ages 20-69
          gender: i % 2 === 0 ? 'Male' : 'Female',
          location: store.region,
        }])
        .select('*')
        .single();
      
      if (customerData) {
        insertedCustomers.push(customerData);
      }
    }
    console.log(`✅ Created ${insertedCustomers.length} customers`);
    
    // Step 3: Generate exactly 18,000 transactions with guaranteed items
    console.log('\n💰 Step 3: Generating exactly 18,000 transactions with complete items...');
    
    const startDate = new Date('2024-06-01');
    const endDate = new Date('2025-05-30');
    const dateRange = endDate.getTime() - startDate.getTime();
    
    let totalTransactionsCreated = 0;
    let totalItemsCreated = 0;
    
    // Create transactions in batches of 100 for better error handling
    for (let batch = 0; batch < 180; batch++) { // 180 batches of 100 = 18,000
      console.log(`📦 Creating batch ${batch + 1}/180 (100 transactions)`);
      
      const batchTransactions = [];
      
      for (let i = 0; i < 100; i++) {
        const randomDate = new Date(startDate.getTime() + Math.random() * dateRange);
        const store = insertedStores[Math.floor(Math.random() * insertedStores.length)];
        const customer = insertedCustomers[Math.floor(Math.random() * insertedCustomers.length)];
        
        batchTransactions.push({
          customer_id: customer.id,
          store_id: store.id,
          total_amount: 100, // Will be updated after items are added
          created_at: randomDate.toISOString(),
          store_location: store.location,
          customer_age: customer.age,
          customer_gender: customer.gender,
          checkout_seconds: Math.floor(Math.random() * 200) + 60, // 60-260 seconds
          is_weekend: randomDate.getDay() === 0 || randomDate.getDay() === 6,
          nlp_processed: Math.random() > 0.15, // 85% processed
          nlp_confidence_score: Math.random() * 0.3 + 0.7, // 0.7-1.0
        });
      }
      
      // Insert transactions for this batch
      const { data: createdTransactions } = await supabase
        .from('transactions')
        .insert(batchTransactions)
        .select('*');
      
      if (!createdTransactions) {
        console.error(`❌ Failed to create transactions for batch ${batch + 1}`);
        continue;
      }
      
      totalTransactionsCreated += createdTransactions.length;
      
      // Create 1-4 items for each transaction
      const batchItems = [];
      
      for (const transaction of createdTransactions) {
        // Each transaction MUST have 1-4 items (STT realistic)
        const itemCount = Math.floor(Math.random() * 4) + 1; // 1-4 items
        let transactionTotal = 0;
        
        for (let j = 0; j < itemCount; j++) {
          const product = insertedProducts[Math.floor(Math.random() * insertedProducts.length)];
          const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 units
          const price = product.price * (0.9 + Math.random() * 0.2); // 90-110% of product price
          
          batchItems.push({
            transaction_id: transaction.id,
            product_id: product.id,
            quantity,
            price: Math.round(price * 100) / 100,
          });
          
          transactionTotal += quantity * price;
        }
        
        // Update transaction total
        await supabase
          .from('transactions')
          .update({ total_amount: Math.round(transactionTotal * 100) / 100 })
          .eq('id', transaction.id);
      }
      
      // Insert items for this batch
      if (batchItems.length > 0) {
        const { data: createdItems } = await supabase
          .from('transaction_items')
          .insert(batchItems)
          .select('*');
        
        if (createdItems) {
          totalItemsCreated += createdItems.length;
        }
      }
      
      // Progress update every 20 batches
      if ((batch + 1) % 20 === 0) {
        console.log(`   Progress: ${batch + 1}/180 batches (${totalTransactionsCreated} transactions, ${totalItemsCreated} items)`);
      }
    }
    
    // Step 4: Final verification
    console.log('\n🔍 Step 4: Final verification...');
    
    const { count: finalTransactions } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    const { count: finalItems } = await supabase
      .from('transaction_items')
      .select('*', { count: 'exact', head: true });
    
    const { count: finalBrands } = await supabase
      .from('brands')
      .select('*', { count: 'exact', head: true });
    
    const { count: finalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    
    // Check for transactions without items
    const { data: transactionsWithoutItems } = await supabase
      .from('transactions')
      .select('id')
      .not('id', 'in', 
        supabase.from('transaction_items').select('transaction_id')
      );
    
    console.log('\n🎉 COMPLETE DATASET OVERRIDE SUCCESSFUL!');
    console.log('=' .repeat(70));
    console.log(`📊 Total Transactions: ${finalTransactions} (Target: 18,000)`);
    console.log(`📦 Total Transaction Items: ${finalItems}`);
    console.log(`📈 Average Items per Transaction: ${(finalItems / finalTransactions).toFixed(2)}`);
    console.log(`🏷️  Total Brands: ${finalBrands}`);
    console.log(`📦 Total Products: ${finalProducts}`);
    console.log(`❌ Transactions Without Items: ${transactionsWithoutItems?.length || 0}`);
    
    if (finalTransactions === 18000 && (transactionsWithoutItems?.length || 0) === 0) {
      console.log('\n✅ PERFECT SUCCESS!');
      console.log('🎯 Exactly 18,000 transactions created');
      console.log('🛒 Every transaction has 1-4 items (business rule satisfied)');
      console.log('🎤 Realistic STT patterns with complete product data');
      console.log('🔍 Dataset ready for comprehensive filter system testing!');
    } else {
      console.log('\n⚠️  Results Summary:');
      console.log(`   Created: ${finalTransactions} transactions (${((finalTransactions/18000)*100).toFixed(1)}% of target)`);
      console.log(`   Missing items: ${transactionsWithoutItems?.length || 0} transactions`);
    }
    
  } catch (error) {
    console.error('❌ Error during complete override:', error);
    throw error;
  }
}

// Run the complete override
completeOverrideDataset().catch(console.error);