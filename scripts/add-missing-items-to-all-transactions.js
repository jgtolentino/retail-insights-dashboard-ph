import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addMissingItemsToAllTransactions() {
  console.log('🛒 ADDING ITEMS TO ALL TRANSACTIONS WITHOUT ITEMS...\n');
  
  try {
    // Step 1: Get exact count of transactions with and without items
    console.log('📊 Step 1: Getting precise transaction-item counts...');
    
    const { data: transactionsWithItems } = await supabase
      .from('transaction_items')
      .select('transaction_id')
      .then(result => {
        if (result.data) {
          return [...new Set(result.data.map(item => item.transaction_id))];
        }
        return [];
      });
    
    const transactionIdsWithItems = new Set(transactionsWithItems);
    
    console.log(`Transactions WITH items: ${transactionIdsWithItems.size}`);
    console.log(`Transactions WITHOUT items: ${18000 - transactionIdsWithItems.size}`);
    
    if (transactionIdsWithItems.size === 18000) {
      console.log('✅ All transactions already have items!');
      return;
    }
    
    // Step 2: Get all transactions and filter out those that already have items
    const { data: allTransactions } = await supabase
      .from('transactions')
      .select('id, total_amount, store_id, created_at')
      .order('id');
    
    if (!allTransactions) {
      console.log('❌ Could not fetch transactions');
      return;
    }
    
    const transactionsNeedingItems = allTransactions.filter(
      transaction => !transactionIdsWithItems.has(transaction.id)
    );
    
    console.log(`Transactions needing items: ${transactionsNeedingItems.length}`);
    
    // Step 3: Get available products
    const { data: products } = await supabase
      .from('products')
      .select('id, name, price, category, brand_id');
    
    if (!products || products.length === 0) {
      console.log('❌ No products available - cannot create transaction items');
      return;
    }
    
    console.log(`Available products: ${products.length}`);
    
    // Step 4: Process transactions in smaller batches to avoid RLS issues
    console.log('\n🛒 Step 2: Adding items to transactions (in small batches)...');
    
    const batchSize = 100; // Smaller batches to avoid RLS issues
    const totalBatches = Math.ceil(transactionsNeedingItems.length / batchSize);
    let totalItemsAdded = 0;
    let successfulTransactions = 0;
    
    for (let batch = 0; batch < totalBatches; batch++) {
      const startIdx = batch * batchSize;
      const endIdx = Math.min(startIdx + batchSize, transactionsNeedingItems.length);
      const batchTransactions = transactionsNeedingItems.slice(startIdx, endIdx);
      
      const batchItems = [];
      
      for (const transaction of batchTransactions) {
        // STT-realistic item count: Every transaction has 1-4 items
        let itemCount;
        const sttAccuracy = Math.random();
        
        if (sttAccuracy > 0.7) {
          // Good STT capture (30%): 2-4 items
          itemCount = Math.floor(Math.random() * 3) + 2; // 2-4 items
        } else if (sttAccuracy > 0.3) {
          // Average STT capture (40%): 1-2 items
          itemCount = Math.floor(Math.random() * 2) + 1; // 1-2 items
        } else {
          // Poor STT capture (30%): 1 item only
          itemCount = 1;
        }
        
        let transactionTotal = 0;
        
        // Generate items for this transaction
        for (let i = 0; i < itemCount; i++) {
          const product = products[Math.floor(Math.random() * products.length)];
          
          // STT-realistic quantity and price
          const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 units
          const basePrice = product.price || 50;
          const priceVariation = basePrice * (0.8 + Math.random() * 0.4); // 80-120% of base price
          const price = Math.max(priceVariation, 5); // Minimum ₱5
          
          batchItems.push({
            transaction_id: transaction.id,
            product_id: product.id,
            quantity,
            price: Math.round(price * 100) / 100,
          });
          
          transactionTotal += quantity * price;
        }
        
        // Update transaction total
        const adjustedTotal = Math.max(transactionTotal * (0.9 + Math.random() * 0.2), transactionTotal * 0.8);
        
        await supabase
          .from('transactions')
          .update({ total_amount: Math.round(adjustedTotal * 100) / 100 })
          .eq('id', transaction.id);
      }
      
      // Try to insert items for this batch
      if (batchItems.length > 0) {
        // First, try inserting just one item to test RLS
        const testItems = batchItems.slice(0, 1);
        const { error: testError } = await supabase
          .from('transaction_items')
          .insert(testItems);
        
        if (testError) {
          console.log(`⚠️  Batch ${batch + 1}: RLS prevents insert - ${testError.message}`);
          
          // Try to temporarily disable RLS for this table
          console.log('🔓 Attempting to bypass RLS...');
          
          // Alternative: Try with upsert or different approach
          let insertSuccess = false;
          
          // Try inserting items one by one (sometimes works better with RLS)
          for (let i = 0; i < batchItems.length; i += 10) { // Sub-batches of 10
            const subBatch = batchItems.slice(i, i + 10);
            const { error: subError } = await supabase
              .from('transaction_items')
              .insert(subBatch);
            
            if (!subError) {
              totalItemsAdded += subBatch.length;
              insertSuccess = true;
            } else {
              console.log(`  Sub-batch ${i}-${i+10}: ${subError.message}`);
            }
          }
          
          if (insertSuccess) {
            successfulTransactions += batchTransactions.length;
            console.log(`✅ Batch ${batch + 1}/${totalBatches}: Added items with sub-batching`);
          } else {
            console.log(`❌ Batch ${batch + 1}/${totalBatches}: All inserts failed`);
          }
        } else {
          // Test succeeded, now insert the rest
          const remainingItems = batchItems.slice(1);
          if (remainingItems.length > 0) {
            const { error: fullError } = await supabase
              .from('transaction_items')
              .insert(remainingItems);
            
            if (fullError) {
              console.log(`⚠️  Batch ${batch + 1}: Partial success - ${fullError.message}`);
              totalItemsAdded += 1; // Just the test item
            } else {
              totalItemsAdded += batchItems.length;
              console.log(`✅ Batch ${batch + 1}/${totalBatches}: Added ${batchItems.length} items`);
            }
          } else {
            totalItemsAdded += 1;
            console.log(`✅ Batch ${batch + 1}/${totalBatches}: Added ${batchItems.length} items`);
          }
          
          successfulTransactions += batchTransactions.length;
        }
      }
      
      // Progress update every 10 batches
      if ((batch + 1) % 10 === 0) {
        console.log(`📈 Progress: ${batch + 1}/${totalBatches} batches processed`);
      }
    }
    
    // Step 5: Final verification
    console.log('\n🔍 Step 3: Final verification...');
    
    const { count: finalTransactions } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    const { count: finalItems } = await supabase
      .from('transaction_items')
      .select('*', { count: 'exact', head: true });
    
    // Check how many transactions still don't have items
    const { data: finalTransactionsWithItems } = await supabase
      .from('transaction_items')
      .select('transaction_id')
      .then(result => {
        if (result.data) {
          return [...new Set(result.data.map(item => item.transaction_id))];
        }
        return [];
      });
    
    const finalTransactionsWithItemsCount = finalTransactionsWithItems.length;
    const transactionsStillWithoutItems = finalTransactions - finalTransactionsWithItemsCount;
    
    console.log('\n🎉 TRANSACTION ITEMS ADDITION COMPLETE!');
    console.log('=' .repeat(60));
    console.log(`📊 Total Transactions: ${finalTransactions}`);
    console.log(`📦 Total Items: ${finalItems}`);
    console.log(`📈 Average Items per Transaction: ${(finalItems / finalTransactions).toFixed(2)}`);
    console.log(`🆕 Items Added: ${totalItemsAdded}`);
    console.log(`✅ Transactions WITH Items: ${finalTransactionsWithItemsCount} (${((finalTransactionsWithItemsCount/finalTransactions)*100).toFixed(1)}%)`);
    console.log(`❌ Transactions WITHOUT Items: ${transactionsStillWithoutItems} (${((transactionsStillWithoutItems/finalTransactions)*100).toFixed(1)}%)`);
    
    if (transactionsStillWithoutItems === 0) {
      console.log('\n🎯 PERFECT! All 18,000 transactions now have at least 1 item');
      console.log('✅ Dataset ready for comprehensive filter testing');
    } else if (transactionsStillWithoutItems < 1000) {
      console.log('\n🎯 EXCELLENT! Over 94% of transactions have items');
      console.log('✅ Sufficient data quality for filter testing');
    } else {
      console.log('\n⚠️  Some transactions still missing items (likely due to RLS policies)');
      console.log('💡 Consider running with service role key or adjusting RLS policies');
    }
    
  } catch (error) {
    console.error('❌ Error adding missing items:', error);
    throw error;
  }
}

// Run the script
addMissingItemsToAllTransactions().catch(console.error);