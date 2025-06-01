import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function trimAndOptimizeDataset() {
  console.log('🎯 TRIMMING DATASET TO EXACTLY 18,000 OPTIMIZED TRANSACTIONS...\n');
  
  try {
    // Step 1: Check current state
    console.log('📊 Step 1: Checking current database state...');
    
    const { count: currentTransactions } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    const { count: currentItems } = await supabase
      .from('transaction_items')
      .select('*', { count: 'exact', head: true });
    
    console.log(`Current transactions: ${currentTransactions}`);
    console.log(`Current transaction items: ${currentItems}`);
    console.log(`Avg items per transaction: ${currentItems && currentTransactions ? (currentItems / currentTransactions).toFixed(2) : 'N/A'}`);
    
    // Step 2: Clear existing data for fresh start
    console.log('\n🧹 Step 2: Clearing existing data for optimization...');
    
    // Delete in correct order due to foreign key constraints
    await supabase.from('transaction_items').delete().neq('id', 0);
    await supabase.from('transactions').delete().neq('id', 0);
    await supabase.from('customer_segments').delete().neq('id', 0);
    await supabase.from('customers').delete().neq('id', 0);
    await supabase.from('products').delete().neq('id', 0);
    await supabase.from('brands').delete().neq('id', 0);
    await supabase.from('stores').delete().neq('id', 0);
    
    console.log('✅ Existing data cleared');
    
    // Step 3: Create optimized reference data
    console.log('\n🏗️  Step 3: Creating optimized reference data...');
    
    // Create brands (mix of TBWA clients and competitors)
    const brands = [
      // TBWA Clients
      { name: 'Marlboro', category: 'Cigarettes', is_tbwa_client: true },
      { name: 'Philip Morris', category: 'Cigarettes', is_tbwa_client: true },
      { name: 'Chesterfield', category: 'Cigarettes', is_tbwa_client: true },
      { name: 'Gatorade', category: 'Beverages', is_tbwa_client: true },
      { name: 'Pepsi', category: 'Beverages', is_tbwa_client: true },
      { name: 'Lay\'s', category: 'Snacks', is_tbwa_client: true },
      
      // Competitors
      { name: 'Lucky Strike', category: 'Cigarettes', is_tbwa_client: false },
      { name: 'Camel', category: 'Cigarettes', is_tbwa_client: false },
      { name: 'Fortune', category: 'Cigarettes', is_tbwa_client: false },
      { name: 'Coca-Cola', category: 'Beverages', is_tbwa_client: false },
      { name: 'Sprite', category: 'Beverages', is_tbwa_client: false },
      { name: 'Red Bull', category: 'Beverages', is_tbwa_client: false },
      { name: 'Pringles', category: 'Snacks', is_tbwa_client: false },
      { name: 'Doritos', category: 'Snacks', is_tbwa_client: false },
      { name: 'Oreo', category: 'Snacks', is_tbwa_client: false },
      { name: 'Pantene', category: 'Personal Care', is_tbwa_client: false },
      { name: 'Head & Shoulders', category: 'Personal Care', is_tbwa_client: false },
      { name: 'Safeguard', category: 'Personal Care', is_tbwa_client: false },
    ];
    
    const { data: insertedBrands, error: brandsError } = await supabase
      .from('brands')
      .insert(brands)
      .select('*');
    
    if (brandsError) {
      console.error('Error inserting brands:', brandsError);
      throw brandsError;
    }
    
    console.log(`✅ Created ${insertedBrands?.length || 0} brands`);
    
    // Create stores across Philippine regions
    const stores = [
      // NCR (Metro Manila)
      { name: 'SM Manila', location: 'Metro Manila', region: 'NCR', city: 'Manila', type: 'Mall' },
      { name: 'Robinsons Ermita', location: 'Metro Manila', region: 'NCR', city: 'Manila', type: 'Mall' },
      { name: 'Ministop Makati', location: 'Metro Manila', region: 'NCR', city: 'Makati', type: 'Convenience' },
      { name: '7-Eleven BGC', location: 'Metro Manila', region: 'NCR', city: 'Taguig', type: 'Convenience' },
      { name: 'Mercury Drug Quezon City', location: 'Metro Manila', region: 'NCR', city: 'Quezon City', type: 'Pharmacy' },
      
      // Region III (Central Luzon)
      { name: 'SM Clark', location: 'Region III', region: 'Central Luzon', city: 'Angeles', type: 'Mall' },
      { name: 'Puregold Cabanatuan', location: 'Region III', region: 'Central Luzon', city: 'Cabanatuan', type: 'Supermarket' },
      { name: 'Jollibee Olongapo', location: 'Region III', region: 'Central Luzon', city: 'Olongapo', type: 'Restaurant' },
      
      // Region IV-A (CALABARZON)
      { name: 'Ayala Malls Solenad', location: 'Region IV-A', region: 'CALABARZON', city: 'Santa Rosa', type: 'Mall' },
      { name: 'SM Lipa', location: 'Region IV-A', region: 'CALABARZON', city: 'Lipa', type: 'Mall' },
      { name: 'Puregold Antipolo', location: 'Region IV-A', region: 'CALABARZON', city: 'Antipolo', type: 'Supermarket' },
      
      // Region VII (Central Visayas)
      { name: 'SM City Cebu', location: 'Region VII', region: 'Central Visayas', city: 'Cebu City', type: 'Mall' },
      { name: 'Ayala Center Cebu', location: 'Region VII', region: 'Central Visayas', city: 'Cebu City', type: 'Mall' },
      { name: 'Gaisano Grand Mall', location: 'Region VII', region: 'Central Visayas', city: 'Cebu City', type: 'Mall' },
      
      // Region XI (Davao)
      { name: 'SM Lanang Premier', location: 'Region XI', region: 'Davao', city: 'Davao City', type: 'Mall' },
      { name: 'Abreeza Mall', location: 'Region XI', region: 'Davao', city: 'Davao City', type: 'Mall' },
      { name: 'NCCC Mall', location: 'Region XI', region: 'Davao', city: 'Davao City', type: 'Mall' },
    ];
    
    const { data: insertedStores, error: storesError } = await supabase
      .from('stores')
      .insert(stores)
      .select('*');
    
    if (storesError) {
      console.error('Error inserting stores:', storesError);
      throw storesError;
    }
    
    console.log(`✅ Created ${insertedStores?.length || 0} stores`);
    
    // Create products for each brand
    console.log('\n📦 Step 4: Creating products...');
    const products = [];
    
    if (!insertedBrands || insertedBrands.length === 0) {
      throw new Error('No brands were inserted successfully');
    }
    
    insertedBrands.forEach(brand => {
      // Create 2-4 products per brand
      const productCount = Math.floor(Math.random() * 3) + 2;
      for (let i = 1; i <= productCount; i++) {
        let productName;
        switch (brand.category) {
          case 'Cigarettes':
            productName = `${brand.name} ${['Red', 'Blue', 'Gold', 'Menthol', 'Lights'][i - 1] || 'Regular'}`;
            break;
          case 'Beverages':
            productName = `${brand.name} ${['Regular', 'Zero', 'Diet', 'Lemon'][i - 1] || 'Original'}`;
            break;
          case 'Snacks':
            productName = `${brand.name} ${['Original', 'BBQ', 'Cheese', 'Spicy'][i - 1] || 'Classic'}`;
            break;
          case 'Personal Care':
            productName = `${brand.name} ${['Shampoo', 'Conditioner', 'Soap', 'Lotion'][i - 1] || 'Regular'}`;
            break;
          default:
            productName = `${brand.name} Product ${i}`;
        }
        
        products.push({
          name: productName,
          brand_id: brand.id,
          price: Math.floor(Math.random() * 500) + 10, // ₱10-510
          category: brand.category,
        });
      }
    });
    
    const { data: insertedProducts, error: productsError } = await supabase
      .from('products')
      .insert(products)
      .select('*');
    
    if (productsError) {
      console.error('Error inserting products:', productsError);
      throw productsError;
    }
    
    if (!insertedProducts || insertedProducts.length === 0) {
      throw new Error('No products were inserted successfully');
    }
    
    console.log(`✅ Created ${insertedProducts?.length || 0} products`);
    
    // Create customer segments
    const customerSegments = [
      { name: 'Young Adults', min_age: 18, max_age: 30, description: 'Tech-savvy, price-conscious consumers' },
      { name: 'Middle Age', min_age: 31, max_age: 50, description: 'Family-oriented, brand-loyal consumers' },
      { name: 'Seniors', min_age: 51, max_age: 80, description: 'Value-seeking, traditional consumers' },
      { name: 'Premium', min_age: 25, max_age: 65, description: 'High-income, quality-focused consumers' },
    ];
    
    const { data: insertedSegments, error: segmentsError } = await supabase
      .from('customer_segments')
      .insert(customerSegments)
      .select('*');
    
    if (segmentsError) {
      console.error('Error inserting customer segments:', segmentsError);
      throw segmentsError;
    }
    
    if (!insertedSegments || insertedSegments.length === 0) {
      throw new Error('No customer segments were inserted successfully');
    }
    
    console.log(`✅ Created ${insertedSegments?.length || 0} customer segments`);
    
    // Create diverse customers
    const customers = [];
    const firstNames = ['Jose', 'Maria', 'Juan', 'Ana', 'Pedro', 'Carmen', 'Luis', 'Rosa', 'Carlos', 'Elena', 
                       'Miguel', 'Sofia', 'Antonio', 'Luz', 'Roberto', 'Isabel', 'Fernando', 'Cristina'];
    const lastNames = ['Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Garcia', 'Mendoza', 'Torres', 
                      'Castillo', 'Morales', 'Ramos', 'Gutierrez', 'Gonzales', 'Flores'];
    
    for (let i = 1; i <= 5000; i++) {
      const segment = insertedSegments[Math.floor(Math.random() * insertedSegments.length)];
      const age = Math.floor(Math.random() * (segment.max_age - segment.min_age + 1)) + segment.min_age;
      
      customers.push({
        name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
        age,
        gender: Math.random() > 0.5 ? 'Male' : 'Female',
        location: insertedStores[Math.floor(Math.random() * insertedStores.length)].region,
        segment_id: segment.id,
        income_range: ['0-15000', '15000-30000', '30000-50000', '50000-75000', '75000-100000', '100000+'][Math.floor(Math.random() * 6)],
      });
    }
    
    const { data: insertedCustomers, error: customersError } = await supabase
      .from('customers')
      .insert(customers)
      .select('*');
    
    if (customersError) {
      console.error('Error inserting customers:', customersError);
      throw customersError;
    }
    
    if (!insertedCustomers || insertedCustomers.length === 0) {
      throw new Error('No customers were inserted successfully');
    }
    
    console.log(`✅ Created ${insertedCustomers?.length || 0} customers`);
    
    // Step 5: Generate exactly 18,000 optimized transactions
    console.log('\n💰 Step 5: Generating exactly 18,000 optimized transactions...');
    
    const startDate = new Date('2024-06-01');
    const endDate = new Date('2025-05-30');
    const dateRange = endDate.getTime() - startDate.getTime();
    
    // Generate transactions in batches
    const batchSize = 1000;
    const totalTransactions = 18000;
    
    for (let batch = 0; batch < Math.ceil(totalTransactions / batchSize); batch++) {
      const currentBatchSize = Math.min(batchSize, totalTransactions - (batch * batchSize));
      const transactions = [];
      
      for (let i = 0; i < currentBatchSize; i++) {
        const randomDate = new Date(startDate.getTime() + Math.random() * dateRange);
        const store = insertedStores[Math.floor(Math.random() * insertedStores.length)];
        const customer = insertedCustomers[Math.floor(Math.random() * insertedCustomers.length)];
        
        // Calculate transaction total (will be updated after items are added)
        const baseAmount = Math.floor(Math.random() * 2000) + 50; // ₱50-2050
        
        transactions.push({
          customer_id: customer.id,
          store_id: store.id,
          total_amount: baseAmount,
          created_at: randomDate.toISOString(),
        });
      }
      
      const { data: batchTransactions } = await supabase
        .from('transactions')
        .insert(transactions)
        .select('*');
      
      console.log(`✅ Batch ${batch + 1}: Created ${batchTransactions?.length} transactions`);
      
      // Generate transaction items for this batch
      const transactionItems = [];
      
      for (const transaction of batchTransactions) {
        // Each transaction has 1-5 items (realistic basket size)
        const itemCount = Math.floor(Math.random() * 5) + 1;
        let transactionTotal = 0;
        
        for (let j = 0; j < itemCount; j++) {
          const product = insertedProducts[Math.floor(Math.random() * insertedProducts.length)];
          const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 quantity
          const price = product.price + (Math.random() * 20 - 10); // ±10 price variation
          
          transactionItems.push({
            transaction_id: transaction.id,
            product_id: product.id,
            quantity,
            price: Math.max(price, 1), // Ensure positive price
          });
          
          transactionTotal += quantity * Math.max(price, 1);
        }
        
        // Update transaction total
        await supabase
          .from('transactions')
          .update({ total_amount: Math.round(transactionTotal * 100) / 100 })
          .eq('id', transaction.id);
      }
      
      if (transactionItems.length > 0) {
        await supabase
          .from('transaction_items')
          .insert(transactionItems);
        
        console.log(`✅ Batch ${batch + 1}: Created ${transactionItems.length} transaction items`);
      }
    }
    
    // Step 6: Final verification
    console.log('\n🔍 Step 6: Final verification...');
    
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
    
    console.log('\n🎉 DATASET OPTIMIZATION COMPLETE!');
    console.log('=' .repeat(50));
    console.log(`📊 Transactions: ${finalTransactions}`);
    console.log(`📦 Transaction Items: ${finalItems}`);
    console.log(`📈 Avg Items per Transaction: ${finalItems && finalTransactions ? (finalItems / finalTransactions).toFixed(2) : 'N/A'}`);
    console.log(`🏷️  Brands: ${finalBrands}`);
    console.log(`📦 Products: ${finalProducts}`);
    console.log(`👥 Customers: ${finalCustomers}`);
    console.log(`🏪 Stores: ${insertedStores?.length}`);
    
    if (finalTransactions === 18000) {
      console.log('\n✅ SUCCESS: Dataset contains exactly 18,000 transactions!');
      console.log('🎯 Ready for filter system testing with optimal data distribution');
    } else {
      console.log(`\n⚠️  WARNING: Expected 18,000 transactions, got ${finalTransactions}`);
    }
    
  } catch (error) {
    console.error('❌ Error optimizing dataset:', error);
    throw error;
  }
}

// Run the optimization
trimAndOptimizeDataset().catch(console.error);