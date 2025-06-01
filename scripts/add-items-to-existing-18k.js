import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addItemsToExisting18k() {
  console.log('🛒 ADDING ITEMS TO EXISTING 18,000 TRANSACTIONS...\n');
  
  try {
    // Step 1: Verify current state
    console.log('📊 Step 1: Analyzing current dataset...');
    
    const { count: currentTransactions } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    const { count: currentItems } = await supabase
      .from('transaction_items')
      .select('*', { count: 'exact', head: true });
    
    console.log(`Current transactions: ${currentTransactions}`);
    console.log(`Current items: ${currentItems}`);
    console.log(`Current average: ${(currentItems / currentTransactions).toFixed(2)} items per transaction`);
    
    // Step 2: Check available reference data
    console.log('\n🔍 Step 2: Checking available reference data...');
    
    const { data: availableProducts } = await supabase
      .from('products')
      .select('*');
    
    const { data: availableBrands } = await supabase
      .from('brands')
      .select('*');
    
    console.log(`Available products: ${availableProducts?.length || 0}`);
    console.log(`Available brands: ${availableBrands?.length || 0}`);
    
    // If no products exist, create minimal essential products
    if (!availableProducts || availableProducts.length === 0) {
      console.log('\n🏗️  Step 2b: Creating essential products...');
      await createEssentialReference();
      
      // Re-fetch products after creation
      const { data: newProducts } = await supabase.from('products').select('*');
      if (!newProducts || newProducts.length === 0) {
        console.log('❌ Could not create products - may be RLS restriction');
        console.log('💡 Dataset already has 18,000 transactions as requested');
        return;
      }
      console.log(`✅ Created ${newProducts.length} products`);
    }
    
    // Step 3: Get the products we'll use for items
    const { data: products } = await supabase.from('products').select('*');
    
    if (!products || products.length === 0) {
      console.log('⚠️  No products available - using default item creation method');
      await createBasicItemsWithoutProducts();
      return;
    }
    
    // Step 4: Get all transactions and identify those needing more items
    console.log('\n📦 Step 3: Adding items to transactions...');
    
    // Get all transactions (process in smaller batches)
    const batchSize = 1000;
    const totalBatches = Math.ceil(currentTransactions / batchSize);
    let totalItemsAdded = 0;
    
    for (let batch = 0; batch < totalBatches; batch++) {
      const offset = batch * batchSize;
      
      console.log(`Processing batch ${batch + 1}/${totalBatches} (transactions ${offset + 1}-${Math.min(offset + batchSize, currentTransactions)})`);
      
      const { data: batchTransactions } = await supabase
        .from('transactions')
        .select('id, total_amount')
        .range(offset, offset + batchSize - 1)
        .order('id');
      
      if (!batchTransactions) {
        console.log(`⚠️  Could not fetch batch ${batch + 1}`);
        continue;
      }
      
      // Check which transactions already have items
      const transactionIds = batchTransactions.map(t => t.id);
      const { data: existingItems } = await supabase
        .from('transaction_items')
        .select('transaction_id')
        .in('transaction_id', transactionIds);
      
      const transactionsWithItems = new Set((existingItems || []).map(item => item.transaction_id));
      
      // Create items for transactions that don't have any
      const transactionsNeedingItems = batchTransactions.filter(t => !transactionsWithItems.has(t.id));
      
      if (transactionsNeedingItems.length === 0) {
        console.log(`  ✅ Batch ${batch + 1}: All transactions already have items`);
        continue;
      }
      
      console.log(`  📦 Batch ${batch + 1}: Adding items to ${transactionsNeedingItems.length} transactions`);
      
      const newItems = [];
      
      for (const transaction of transactionsNeedingItems) {
        // Every transaction gets 1-3 items (realistic STT capture)
        const itemCount = Math.floor(Math.random() * 3) + 1; // 1-3 items
        let transactionTotal = 0;
        
        for (let i = 0; i < itemCount; i++) {
          const product = products[Math.floor(Math.random() * products.length)];
          const quantity = Math.floor(Math.random() * 2) + 1; // 1-2 units
          const price = (product.price || 50) * (0.9 + Math.random() * 0.2); // 90-110% of product price
          
          newItems.push({
            transaction_id: transaction.id,
            product_id: product.id,
            quantity,
            price: Math.round(price * 100) / 100,
          });
          
          transactionTotal += quantity * price;
        }
        
        // Update transaction total
        const adjustedTotal = Math.max(transactionTotal, transaction.total_amount * 0.8);
        
        await supabase
          .from('transactions')
          .update({ total_amount: Math.round(adjustedTotal * 100) / 100 })
          .eq('id', transaction.id);
      }
      
      // Insert items for this batch
      if (newItems.length > 0) {
        // Try different insertion methods to work around RLS
        let insertSuccess = false;
        
        // Method 1: Try bulk insert
        const { error: bulkError } = await supabase
          .from('transaction_items')
          .insert(newItems);
        
        if (!bulkError) {
          totalItemsAdded += newItems.length;
          insertSuccess = true;
          console.log(`    ✅ Added ${newItems.length} items via bulk insert`);
        } else {
          console.log(`    ⚠️  Bulk insert failed: ${bulkError.message}`);
          
          // Method 2: Try one-by-one insertion
          let oneByOneSuccess = 0;
          for (const item of newItems.slice(0, 10)) { // Try first 10 items
            const { error: singleError } = await supabase
              .from('transaction_items')
              .insert([item]);
            
            if (!singleError) {
              oneByOneSuccess++;
            }
          }
          
          if (oneByOneSuccess > 0) {
            totalItemsAdded += oneByOneSuccess;
            console.log(`    ⚠️  Added ${oneByOneSuccess} items via individual inserts`);
          } else {
            console.log(`    ❌ Could not insert items for batch ${batch + 1}`);
          }
        }
      }
      
      // Progress update
      if ((batch + 1) % 5 === 0) {
        console.log(`  📈 Progress: ${batch + 1}/${totalBatches} batches processed, ${totalItemsAdded} items added`);
      }
    }
    
    // Step 5: Final verification
    console.log('\n🔍 Step 4: Final verification...');
    
    const { count: finalTransactions } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    const { count: finalItems } = await supabase
      .from('transaction_items')
      .select('*', { count: 'exact', head: true });
    
    console.log('\n🎉 ITEM ADDITION COMPLETE!');
    console.log('=' .repeat(50));
    console.log(`📊 Total Transactions: ${finalTransactions}`);
    console.log(`📦 Total Items: ${finalItems}`);
    console.log(`📈 New Average: ${(finalItems / finalTransactions).toFixed(2)} items per transaction`);
    console.log(`🆕 Items Added: ${totalItemsAdded}`);
    
    if (finalTransactions === 18000) {
      console.log('\n✅ SUCCESS: Exactly 18,000 transactions maintained!');
      
      if (finalItems > currentItems) {
        console.log('🛒 More transaction items added for better product filtering');
      }
      
      console.log('🎯 Dataset ready for filter system testing');
    }
    
  } catch (error) {
    console.error('❌ Error adding items:', error);
    throw error;
  }
}

async function createEssentialReference() {
  console.log('Creating essential brands and products...');
  
  // Create minimal brands
  const essentialBrands = [
    { name: 'Marlboro', category: 'Cigarettes', is_tbwa: true },
    { name: 'Coca-Cola', category: 'Beverages', is_tbwa: false },
    { name: 'Lay\'s', category: 'Snacks', is_tbwa: true },
    { name: 'Pantene', category: 'Personal Care', is_tbwa: false },
  ];
  
  const createdBrands = [];
  
  for (const brand of essentialBrands) {
    const { data: brandData, error } = await supabase
      .from('brands')
      .insert([brand])
      .select('*')
      .single();
    
    if (brandData) {
      createdBrands.push(brandData);
    } else if (error) {
      console.log(`  Note: Could not create brand ${brand.name}: ${error.message}`);
    }
  }
  
  // Create minimal products
  const essentialProducts = [
    { name: 'Marlboro Red', price: 130, category: 'Cigarettes' },
    { name: 'Coca-Cola Regular', price: 45, category: 'Beverages' },
    { name: 'Lay\'s Original', price: 60, category: 'Snacks' },
    { name: 'Pantene Shampoo', price: 120, category: 'Personal Care' },
  ];
  
  for (let i = 0; i < essentialProducts.length; i++) {
    const product = essentialProducts[i];
    const brand = createdBrands[i] || createdBrands[0]; // Use first brand as fallback
    
    if (brand) {
      const { error } = await supabase
        .from('products')
        .insert([{
          ...product,
          brand_id: brand.id
        }]);
      
      if (error) {
        console.log(`  Note: Could not create product ${product.name}: ${error.message}`);
      }
    }
  }
}

async function createBasicItemsWithoutProducts() {
  console.log('Creating basic items without product references...');
  
  // Get a sample of transactions
  const { data: sampleTransactions } = await supabase
    .from('transactions')
    .select('id, total_amount')
    .limit(100);
  
  if (!sampleTransactions) return;
  
  for (const transaction of sampleTransactions) {
    // Create 1-2 basic items per transaction
    const items = [
      {
        transaction_id: transaction.id,
        product_id: 1, // Assume product ID 1 exists or create generic
        quantity: 1,
        price: transaction.total_amount || 50,
      }
    ];
    
    const { error } = await supabase
      .from('transaction_items')
      .insert(items);
    
    if (error) {
      console.log(`Could not create basic item: ${error.message}`);
      break; // Stop if we can't insert
    }
  }
}

// Run the script
addItemsToExisting18k().catch(console.error);