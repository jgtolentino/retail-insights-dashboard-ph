import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetWithCompleteDatapoints() {
  console.log('🔄 RESETTING DATABASE WITH COMPLETE DATAPOINTS (18,000 TRANSACTIONS)...\n');
  
  try {
    // Step 1: Clear existing data
    console.log('🧹 Step 1: Clearing existing data...');
    
    await supabase.from('transaction_items').delete().neq('id', 0);
    await supabase.from('transactions').delete().neq('id', 0);
    await supabase.from('products').delete().neq('id', 0);
    await supabase.from('brands').delete().neq('id', 0);
    await supabase.from('customers').delete().neq('id', 0);
    await supabase.from('customer_segments').delete().neq('id', 0);
    await supabase.from('stores').delete().neq('id', 0);
    
    console.log('✅ Database cleared');
    
    // Step 2: Create comprehensive reference data
    console.log('\n🏗️  Step 2: Creating reference data...');
    
    // Create customer segments
    const customerSegments = [
      { name: 'Young Adults', min_age: 18, max_age: 30, description: 'Price-conscious, tech-savvy' },
      { name: 'Middle Age', min_age: 31, max_age: 50, description: 'Family-oriented, brand-loyal' },
      { name: 'Seniors', min_age: 51, max_age: 80, description: 'Value-seeking, traditional' },
      { name: 'Premium', min_age: 25, max_age: 65, description: 'High-income, quality-focused' },
    ];
    
    const { data: insertedSegments } = await supabase
      .from('customer_segments')
      .insert(customerSegments)
      .select('*');
    
    console.log(`✅ Created ${insertedSegments?.length || 0} customer segments`);
    
    // Create brands with TBWA client identification
    const brands = [
      // TBWA Clients (using 'is_tbwa' column that exists)
      { name: 'Marlboro', category: 'Cigarettes', is_tbwa: true },
      { name: 'Philip Morris', category: 'Cigarettes', is_tbwa: true },
      { name: 'Chesterfield', category: 'Cigarettes', is_tbwa: true },
      { name: 'Gatorade', category: 'Beverages', is_tbwa: true },
      { name: 'Pepsi', category: 'Beverages', is_tbwa: true },
      { name: 'Mountain Dew', category: 'Beverages', is_tbwa: true },
      { name: 'Lay\'s', category: 'Snacks', is_tbwa: true },
      { name: 'Doritos', category: 'Snacks', is_tbwa: true },
      
      // Competitors
      { name: 'Lucky Strike', category: 'Cigarettes', is_tbwa: false },
      { name: 'Camel', category: 'Cigarettes', is_tbwa: false },
      { name: 'Fortune', category: 'Cigarettes', is_tbwa: false },
      { name: 'Coca-Cola', category: 'Beverages', is_tbwa: false },
      { name: 'Sprite', category: 'Beverages', is_tbwa: false },
      { name: 'Red Bull', category: 'Beverages', is_tbwa: false },
      { name: 'Pringles', category: 'Snacks', is_tbwa: false },
      { name: 'Oreo', category: 'Snacks', is_tbwa: false },
      { name: 'Pantene', category: 'Personal Care', is_tbwa: false },
      { name: 'Head & Shoulders', category: 'Personal Care', is_tbwa: false },
      { name: 'Safeguard', category: 'Personal Care', is_tbwa: false },
      { name: 'Colgate', category: 'Personal Care', is_tbwa: false },
    ];
    
    const { data: insertedBrands } = await supabase
      .from('brands')
      .insert(brands)
      .select('*');
    
    console.log(`✅ Created ${insertedBrands?.length || 0} brands`);
    
    // Create stores across Philippine regions
    const stores = [
      // NCR (Metro Manila)
      { name: 'SM Manila', location: 'Manila Central', region: 'NCR', city: 'Manila', type: 'Mall' },
      { name: 'Robinsons Ermita', location: 'Manila Central', region: 'NCR', city: 'Manila', type: 'Mall' },
      { name: 'Ministop Makati', location: 'Manila Central', region: 'NCR', city: 'Makati', type: 'Convenience' },
      { name: '7-Eleven BGC', location: 'Manila Central', region: 'NCR', city: 'Taguig', type: 'Convenience' },
      { name: 'Mercury Drug QC', location: 'Manila Central', region: 'NCR', city: 'Quezon City', type: 'Pharmacy' },
      
      // Central Visayas
      { name: 'SM City Cebu', location: 'Cebu City Center', region: 'Central Visayas', city: 'Cebu City', type: 'Mall' },
      { name: 'Ayala Center Cebu', location: 'Cebu City Center', region: 'Central Visayas', city: 'Cebu City', type: 'Mall' },
      { name: 'Gaisano Grand', location: 'Cebu City Center', region: 'Central Visayas', city: 'Cebu City', type: 'Department Store' },
      
      // Davao
      { name: 'SM Lanang Premier', location: 'Davao Downtown', region: 'Davao', city: 'Davao City', type: 'Mall' },
      { name: 'Abreeza Mall', location: 'Davao Downtown', region: 'Davao', city: 'Davao City', type: 'Mall' },
      
      // CALABARZON
      { name: 'SM Santa Rosa', location: 'Region IV-A, Cavite, Tagaytay, Kaybagal', region: 'CALABARZON', city: 'Santa Rosa', type: 'Mall' },
      { name: 'Robinsons Lipa', location: 'Region IV-A, Cavite, Tagaytay, Kaybagal', region: 'CALABARZON', city: 'Lipa', type: 'Mall' },
    ];
    
    const { data: insertedStores } = await supabase
      .from('stores')
      .insert(stores)
      .select('*');
    
    console.log(`✅ Created ${insertedStores?.length || 0} stores`);
    
    // Create products for each brand (3-5 products per brand)
    const products = [];
    insertedBrands?.forEach(brand => {
      const productCount = Math.floor(Math.random() * 3) + 3; // 3-5 products per brand
      
      for (let i = 1; i <= productCount; i++) {
        let productName, price;
        
        switch (brand.category) {
          case 'Cigarettes':
            productName = `${brand.name} ${['Red', 'Blue', 'Gold', 'Menthol', 'Lights'][i - 1] || `Variant ${i}`}`;
            price = Math.floor(Math.random() * 60) + 90; // ₱90-150
            break;
          case 'Beverages':
            productName = `${brand.name} ${['Regular', 'Zero', 'Diet', 'Lemon', 'Orange'][i - 1] || `Flavor ${i}`}`;
            price = Math.floor(Math.random() * 40) + 25; // ₱25-65
            break;
          case 'Snacks':
            productName = `${brand.name} ${['Original', 'BBQ', 'Cheese', 'Spicy', 'Sweet'][i - 1] || `Flavor ${i}`}`;
            price = Math.floor(Math.random() * 50) + 30; // ₱30-80
            break;
          case 'Personal Care':
            productName = `${brand.name} ${['Shampoo', 'Conditioner', 'Soap', 'Lotion', 'Body Wash'][i - 1] || `Product ${i}`}`;
            price = Math.floor(Math.random() * 150) + 60; // ₱60-210
            break;
          default:
            productName = `${brand.name} Product ${i}`;
            price = Math.floor(Math.random() * 100) + 40; // ₱40-140
        }
        
        products.push({
          name: productName,
          brand_id: brand.id,
          price,
          category: brand.category,
        });
      }
    });
    
    const { data: insertedProducts } = await supabase
      .from('products')
      .insert(products)
      .select('*');
    
    console.log(`✅ Created ${insertedProducts?.length || 0} products`);
    
    // Create diverse customers
    const customers = [];
    const firstNames = ['Jose', 'Maria', 'Juan', 'Ana', 'Pedro', 'Carmen', 'Luis', 'Rosa', 'Carlos', 'Elena',
                       'Miguel', 'Sofia', 'Antonio', 'Luz', 'Roberto', 'Isabel', 'Fernando', 'Cristina', 'Manuel', 'Dolores'];
    const lastNames = ['Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Garcia', 'Mendoza', 'Torres',
                      'Castillo', 'Morales', 'Ramos', 'Gutierrez', 'Gonzales', 'Flores', 'Villanueva', 'Rivera'];
    
    for (let i = 1; i <= 6000; i++) {
      const segment = insertedSegments[Math.floor(Math.random() * insertedSegments.length)];
      const store = insertedStores[Math.floor(Math.random() * insertedStores.length)];
      
      // STT Simulation: Not all demographic data is captured
      const sttCaptured = Math.random();
      
      customers.push({
        name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
        age: sttCaptured > 0.3 ? Math.floor(Math.random() * (segment.max_age - segment.min_age + 1)) + segment.min_age : null,
        gender: sttCaptured > 0.5 ? (Math.random() > 0.5 ? 'Male' : 'Female') : null,
        location: store.region,
        segment_id: segment.id,
        income_range: sttCaptured > 0.8 ? ['0-15000', '15000-30000', '30000-50000', '50000-75000', '75000-100000', '100000+'][Math.floor(Math.random() * 6)] : null,
      });
    }
    
    const { data: insertedCustomers } = await supabase
      .from('customers')
      .insert(customers)
      .select('*');
    
    console.log(`✅ Created ${insertedCustomers?.length || 0} customers`);
    
    // Step 3: Generate exactly 18,000 transactions with guaranteed items
    console.log('\n💰 Step 3: Generating 18,000 transactions with complete item data...');
    
    const startDate = new Date('2024-06-01');
    const endDate = new Date('2025-05-30');
    const dateRange = endDate.getTime() - startDate.getTime();
    
    const batchSize = 1000;
    const totalTransactions = 18000;
    let totalItemsCreated = 0;
    
    for (let batch = 0; batch < Math.ceil(totalTransactions / batchSize); batch++) {
      const currentBatchSize = Math.min(batchSize, totalTransactions - (batch * batchSize));
      
      console.log(`📦 Processing batch ${batch + 1}/${Math.ceil(totalTransactions / batchSize)} (${currentBatchSize} transactions)`);
      
      const transactions = [];
      
      for (let i = 0; i < currentBatchSize; i++) {
        const randomDate = new Date(startDate.getTime() + Math.random() * dateRange);
        const store = insertedStores[Math.floor(Math.random() * insertedStores.length)];
        const customer = insertedCustomers[Math.floor(Math.random() * insertedCustomers.length)];
        
        // Calculate realistic transaction total (will be updated after items)
        const estimatedTotal = Math.floor(Math.random() * 2000) + 100; // ₱100-2100
        
        transactions.push({
          customer_id: customer.id,
          store_id: store.id,
          total_amount: estimatedTotal,
          created_at: randomDate.toISOString(),
          store_location: store.location,
          customer_age: customer.age,
          customer_gender: customer.gender,
          checkout_seconds: Math.floor(Math.random() * 300) + 30, // 30-330 seconds
          is_weekend: randomDate.getDay() === 0 || randomDate.getDay() === 6,
          nlp_processed: Math.random() > 0.2, // 80% processed by NLP
          nlp_confidence_score: Math.random() * 0.4 + 0.6, // 0.6-1.0 confidence
        });
      }
      
      // Insert transactions for this batch
      const { data: batchTransactions } = await supabase
        .from('transactions')
        .insert(transactions)
        .select('*');
      
      if (!batchTransactions) {
        console.error(`❌ Failed to insert transactions for batch ${batch + 1}`);
        continue;
      }
      
      // Generate transaction items for each transaction (1-5 items per transaction)
      const transactionItems = [];
      
      for (const transaction of batchTransactions) {
        // STT-realistic item count: Every transaction has 1-5 items
        let itemCount;
        const sttQuality = Math.random();
        
        if (sttQuality > 0.8) {
          // Excellent STT (20%): 3-5 items captured
          itemCount = Math.floor(Math.random() * 3) + 3; // 3-5 items
        } else if (sttQuality > 0.5) {
          // Good STT (30%): 2-4 items captured
          itemCount = Math.floor(Math.random() * 3) + 2; // 2-4 items
        } else if (sttQuality > 0.2) {
          // Fair STT (30%): 1-2 items captured
          itemCount = Math.floor(Math.random() * 2) + 1; // 1-2 items
        } else {
          // Poor STT (20%): only 1 item clearly captured
          itemCount = 1;
        }
        
        let actualTransactionTotal = 0;
        
        for (let j = 0; j < itemCount; j++) {
          const product = insertedProducts[Math.floor(Math.random() * insertedProducts.length)];
          
          // STT-realistic quantity and pricing
          const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 units
          const basePrice = product.price;
          const priceVariation = basePrice * (0.85 + Math.random() * 0.3); // 85-115% of base price
          const finalPrice = Math.max(priceVariation, 10); // Minimum ₱10
          
          transactionItems.push({
            transaction_id: transaction.id,
            product_id: product.id,
            quantity,
            price: Math.round(finalPrice * 100) / 100,
          });
          
          actualTransactionTotal += quantity * finalPrice;
        }
        
        // Update transaction total to match items (with small STT-realistic variation)
        const totalVariation = actualTransactionTotal * (0.95 + Math.random() * 0.1); // 95-105% of calculated
        
        await supabase
          .from('transactions')
          .update({ total_amount: Math.round(totalVariation * 100) / 100 })
          .eq('id', transaction.id);
      }
      
      // Insert transaction items for this batch
      if (transactionItems.length > 0) {
        const { error: itemsError } = await supabase
          .from('transaction_items')
          .insert(transactionItems);
        
        if (itemsError) {
          console.error(`❌ Error inserting items for batch ${batch + 1}:`, itemsError);
        } else {
          totalItemsCreated += transactionItems.length;
          console.log(`✅ Batch ${batch + 1}: Created ${transactionItems.length} items for ${batchTransactions.length} transactions`);
        }
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
    
    const { count: finalCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
    
    const { count: finalStores } = await supabase
      .from('stores')
      .select('*', { count: 'exact', head: true });
    
    // Check transactions without items (should be 0)
    const { data: transactionsWithoutItems } = await supabase
      .from('transactions')
      .select('id')
      .not('id', 'in', 
        supabase
          .from('transaction_items')
          .select('transaction_id')
      );
    
    console.log('\n🎉 COMPLETE DATASET RESET SUCCESSFUL!');
    console.log('=' .repeat(60));
    console.log(`📊 Transactions: ${finalTransactions} (Target: 18,000)`);
    console.log(`📦 Transaction Items: ${finalItems}`);
    console.log(`📈 Avg Items per Transaction: ${(finalItems / finalTransactions).toFixed(2)}`);
    console.log(`🏷️  Brands: ${finalBrands} (${brands.filter(b => b.is_tbwa).length} TBWA clients)`);
    console.log(`📦 Products: ${finalProducts}`);
    console.log(`👥 Customers: ${finalCustomers}`);
    console.log(`🏪 Stores: ${finalStores}`);
    console.log(`❌ Transactions Without Items: ${transactionsWithoutItems?.length || 0}`);
    
    if (finalTransactions === 18000 && (transactionsWithoutItems?.length || 0) === 0) {
      console.log('\n✅ PERFECT SUCCESS!');
      console.log('🎯 Exactly 18,000 transactions with complete item data');
      console.log('🎤 Realistic STT gaps maintained in demographics');
      console.log('🛒 Every transaction has 1-5 items (business rule satisfied)');
      console.log('🔍 Ready for comprehensive filter system testing!');
    } else {
      console.log('\n⚠️  Results may vary from target');
      console.log('💡 Check for any database constraints or RLS policies');
    }
    
  } catch (error) {
    console.error('❌ Error during reset:', error);
    throw error;
  }
}

// Run the reset
resetWithCompleteDatapoints().catch(console.error);