import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fillMissingDatapointsSTT() {
  console.log('🎤 FILLING MISSING DATAPOINTS WITH STT TRANSCRIPTION GAPS...\n');
  
  try {
    // Step 1: Analyze current data gaps
    console.log('📊 Step 1: Analyzing current data state...');
    
    const { count: transactionsCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    const { count: itemsCount } = await supabase
      .from('transaction_items')
      .select('*', { count: 'exact', head: true });
    
    const { data: sampleTransaction } = await supabase
      .from('transactions')
      .select('*')
      .limit(1);
    
    console.log(`Transactions: ${transactionsCount}`);
    console.log(`Transaction Items: ${itemsCount}`);
    console.log(`Items per Transaction: ${itemsCount / transactionsCount}`);
    
    if (sampleTransaction && sampleTransaction[0]) {
      console.log('Sample transaction fields:', Object.keys(sampleTransaction[0]));
    }
    
    // Step 2: Get all transactions that need items
    console.log('\n🛒 Step 2: Finding transactions needing items...');
    
    const { data: transactionsWithoutItems } = await supabase
      .from('transactions')
      .select(`
        id, 
        total_amount,
        store_id,
        customer_id,
        created_at
      `)
      .not('id', 'in', 
        supabase
          .from('transaction_items')
          .select('transaction_id')
      );
    
    const transactionsNeedingItems = transactionsWithoutItems || [];
    console.log(`Found ${transactionsNeedingItems.length} transactions without items`);
    
    // Step 3: Get available products for item generation
    const { data: availableProducts } = await supabase
      .from('products')
      .select('*');
    
    if (!availableProducts || availableProducts.length === 0) {
      console.log('⚠️  No products found, creating basic products first...');
      await createBasicProducts();
      return fillMissingDatapointsSTT(); // Restart after creating products
    }
    
    console.log(`Available products: ${availableProducts.length}`);
    
    // Step 4: Generate transaction items with STT-realistic gaps
    console.log('\n📦 Step 3: Generating transaction items with STT gaps...');
    
    const batchSize = 500;
    const batches = Math.ceil(transactionsNeedingItems.length / batchSize);
    let totalItemsCreated = 0;
    
    for (let batch = 0; batch < batches; batch++) {
      const startIdx = batch * batchSize;
      const endIdx = Math.min(startIdx + batchSize, transactionsNeedingItems.length);
      const batchTransactions = transactionsNeedingItems.slice(startIdx, endIdx);
      
      const transactionItems = [];
      
      for (const transaction of batchTransactions) {
        // STT Simulation: Some transactions might be completely missed (5% chance)
        if (Math.random() < 0.05) {
          console.log(`  Skipping transaction ${transaction.id} (STT missed completely)`);
          continue;
        }
        
        // STT Simulation: Variable item count based on speech clarity
        // Clear speech: 2-4 items, Unclear speech: 1-2 items, Partial: 1 item
        let itemCount;
        const speechQuality = Math.random();
        
        if (speechQuality > 0.7) {
          // Clear speech (70% chance) - 2-4 items
          itemCount = Math.floor(Math.random() * 3) + 2;
        } else if (speechQuality > 0.4) {
          // Partial speech (30% chance) - 1-2 items  
          itemCount = Math.floor(Math.random() * 2) + 1;
        } else {
          // Very unclear speech (10% chance) - might miss some items entirely
          itemCount = Math.random() > 0.5 ? 1 : 0;
        }
        
        if (itemCount === 0) {
          console.log(`  Transaction ${transaction.id}: STT couldn't capture any items`);
          continue;
        }
        
        let transactionTotal = 0;
        
        for (let i = 0; i < itemCount; i++) {
          const product = availableProducts[Math.floor(Math.random() * availableProducts.length)];
          
          // STT Simulation: Quantity recognition issues
          let quantity;
          const quantityRecognition = Math.random();
          
          if (quantityRecognition > 0.8) {
            // Clear quantity (80% chance) - accurate count
            quantity = Math.floor(Math.random() * 3) + 1;
          } else if (quantityRecognition > 0.6) {
            // Partial quantity (20% chance) - default to 1
            quantity = 1;
          } else {
            // Missing quantity (5% chance) - STT couldn't capture
            quantity = null;
          }
          
          // STT Simulation: Price recognition issues
          let price;
          const priceRecognition = Math.random();
          
          if (priceRecognition > 0.7) {
            // Clear price (70% chance) - close to product price
            const basePrice = product.price || 50;
            price = basePrice + (Math.random() * 20 - 10); // ±10 variation
          } else if (priceRecognition > 0.4) {
            // Approximate price (30% chance) - rounded price
            const basePrice = product.price || 50;
            price = Math.round((basePrice + (Math.random() * 40 - 20)) / 10) * 10;
          } else {
            // Missing price (10% chance) - STT couldn't capture
            price = null;
          }
          
          // Only add item if we have essential data
          if (quantity !== null && price !== null) {
            transactionItems.push({
              transaction_id: transaction.id,
              product_id: product.id,
              quantity: Math.max(quantity, 1),
              price: Math.max(price, 1),
            });
            
            transactionTotal += (quantity || 1) * (price || 0);
          } else {
            console.log(`    Skipping item for transaction ${transaction.id}: STT data incomplete`);
          }
        }
        
        // Update transaction total if we have items
        if (transactionItems.length > 0) {
          // STT Simulation: Total might not match perfectly (rounding errors, missed items)
          const totalVariation = Math.random() * 0.2 - 0.1; // ±10% variation
          const adjustedTotal = transactionTotal * (1 + totalVariation);
          
          await supabase
            .from('transactions')
            .update({ 
              total_amount: Math.max(adjustedTotal, transactionTotal * 0.8) // Minimum 80% of calculated
            })
            .eq('id', transaction.id);
        }
      }
      
      // Insert transaction items for this batch
      if (transactionItems.length > 0) {
        const { error } = await supabase
          .from('transaction_items')
          .insert(transactionItems);
        
        if (error) {
          console.error(`Error inserting batch ${batch + 1}:`, error);
        } else {
          totalItemsCreated += transactionItems.length;
          console.log(`✅ Batch ${batch + 1}/${batches}: Added ${transactionItems.length} items`);
        }
      }
    }
    
    // Step 5: Add some substitute/recommendation data (STT captures these sometimes)
    console.log('\n🔄 Step 4: Adding substitution data (from STT)...');
    await addSubstitutionData();
    
    // Step 6: Add customer demographic data with gaps
    console.log('\n👥 Step 5: Filling customer demographics with STT gaps...');
    await fillCustomerDemographics();
    
    // Step 7: Final verification
    console.log('\n🔍 Step 6: Final verification...');
    
    const { count: finalItems } = await supabase
      .from('transaction_items')
      .select('*', { count: 'exact', head: true });
    
    const { count: finalTransactions } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    // Check completion rates (simulate STT accuracy)
    const { count: itemsWithQuantity } = await supabase
      .from('transaction_items')
      .select('*', { count: 'exact', head: true })
      .not('quantity', 'is', null);
    
    const { count: itemsWithPrice } = await supabase
      .from('transaction_items')
      .select('*', { count: 'exact', head: true })
      .not('price', 'is', null);
    
    const { count: customersWithAge } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .not('age', 'is', null);
    
    console.log('\n🎉 STT DATA SIMULATION COMPLETE!');
    console.log('=' .repeat(50));
    console.log(`📊 Total Transactions: ${finalTransactions}`);
    console.log(`📦 Total Items: ${finalItems}`);
    console.log(`📈 Avg Items per Transaction: ${(finalItems / finalTransactions).toFixed(2)}`);
    console.log(`\n🎤 STT Accuracy Simulation:`);
    console.log(`   Quantity Capture Rate: ${((itemsWithQuantity / finalItems) * 100).toFixed(1)}%`);
    console.log(`   Price Capture Rate: ${((itemsWithPrice / finalItems) * 100).toFixed(1)}%`);
    console.log(`   Customer Age Capture: ${((customersWithAge / finalTransactions) * 100).toFixed(1)}%`);
    console.log(`\n✅ Realistic STT gaps maintained for authentic data simulation`);
    
  } catch (error) {
    console.error('❌ Error filling missing datapoints:', error);
    throw error;
  }
}

async function createBasicProducts() {
  console.log('Creating basic products...');
  
  const { data: brands } = await supabase.from('brands').select('*');
  
  if (!brands || brands.length === 0) {
    console.log('No brands found, creating basic brands first...');
    const basicBrands = [
      { name: 'Marlboro', category: 'Cigarettes' },
      { name: 'Coca-Cola', category: 'Beverages' },
      { name: 'Lay\'s', category: 'Snacks' },
      { name: 'Pantene', category: 'Personal Care' },
    ];
    
    const { data: insertedBrands } = await supabase
      .from('brands')
      .insert(basicBrands)
      .select('*');
    
    brands.push(...(insertedBrands || []));
  }
  
  const products = [];
  brands.forEach(brand => {
    // Create 2-3 products per brand
    for (let i = 1; i <= 3; i++) {
      products.push({
        name: `${brand.name} Product ${i}`,
        brand_id: brand.id,
        price: Math.floor(Math.random() * 200) + 20,
        category: brand.category,
      });
    }
  });
  
  const { error } = await supabase.from('products').insert(products);
  if (error) {
    console.error('Error creating products:', error);
  } else {
    console.log(`✅ Created ${products.length} basic products`);
  }
}

async function addSubstitutionData() {
  try {
    // STT sometimes captures when customers ask for substitutes
    const { data: products } = await supabase.from('products').select('*');
    
    if (!products || products.length < 2) return;
    
    const substitutions = [];
    const substitutionCount = Math.floor(Math.random() * 100) + 50; // 50-150 substitutions
    
    for (let i = 0; i < substitutionCount; i++) {
      // STT Simulation: Sometimes captures substitution requests
      if (Math.random() > 0.3) { // 70% chance STT captures substitution request
        const originalProduct = products[Math.floor(Math.random() * products.length)];
        const substituteProduct = products[Math.floor(Math.random() * products.length)];
        
        if (originalProduct.id !== substituteProduct.id) {
          substitutions.push({
            original_product_id: originalProduct.id,
            substitute_product_id: substituteProduct.id,
            substitution_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            reason: Math.random() > 0.5 ? 'Out of stock' : 'Customer preference',
            store_location: ['Manila', 'Cebu', 'Davao'][Math.floor(Math.random() * 3)],
          });
        }
      }
    }
    
    if (substitutions.length > 0) {
      const { error } = await supabase.from('substitutions').insert(substitutions);
      if (!error) {
        console.log(`✅ Added ${substitutions.length} substitution records`);
      }
    }
  } catch (error) {
    console.log('Note: Substitutions table may not exist, skipping...');
  }
}

async function fillCustomerDemographics() {
  try {
    const { data: customers } = await supabase.from('customers').select('*');
    
    if (!customers) return;
    
    const updates = [];
    
    for (const customer of customers) {
      // STT Simulation: Demographic data capture is inconsistent
      const update = { id: customer.id };
      let hasUpdate = false;
      
      // Age: 60% chance STT captures age mention
      if (!customer.age && Math.random() > 0.4) {
        update.age = Math.floor(Math.random() * 60) + 18;
        hasUpdate = true;
      }
      
      // Gender: 50% chance STT captures gender-specific language
      if (!customer.gender && Math.random() > 0.5) {
        update.gender = Math.random() > 0.5 ? 'Male' : 'Female';
        hasUpdate = true;
      }
      
      // Income: 20% chance STT captures income-related comments
      if (!customer.income_range && Math.random() > 0.8) {
        const incomeRanges = ['0-15000', '15000-30000', '30000-50000', '50000-75000', '75000-100000', '100000+'];
        update.income_range = incomeRanges[Math.floor(Math.random() * incomeRanges.length)];
        hasUpdate = true;
      }
      
      if (hasUpdate) {
        updates.push(update);
      }
    }
    
    // Update customers in batches
    for (let i = 0; i < updates.length; i += 100) {
      const batch = updates.slice(i, i + 100);
      for (const customerUpdate of batch) {
        await supabase
          .from('customers')
          .update(customerUpdate)
          .eq('id', customerUpdate.id);
      }
    }
    
    console.log(`✅ Updated demographics for ${updates.length} customers`);
    
  } catch (error) {
    console.log('Note: Customer demographic updates may have failed, continuing...');
  }
}

// Run the script
fillMissingDatapointsSTT().catch(console.error);