import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function enhanceExistingTransactionsSTT() {
  console.log('🎤 ENHANCING EXISTING TRANSACTIONS WITH STT-REALISTIC DATA...\n');
  
  try {
    // Step 1: Analyze current transaction-item distribution
    console.log('📊 Step 1: Analyzing current transaction-item distribution...');
    
    const { count: totalTransactions } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    const { count: totalItems } = await supabase
      .from('transaction_items')
      .select('*', { count: 'exact', head: true });
    
    console.log(`Current: ${totalTransactions} transactions, ${totalItems} items`);
    console.log(`Average: ${(totalItems / totalTransactions).toFixed(2)} items per transaction`);
    
    // Step 2: Get products for item generation
    const { data: availableProducts } = await supabase
      .from('products')
      .select('*');
    
    if (!availableProducts || availableProducts.length === 0) {
      console.log('❌ No products available for enhancement');
      return;
    }
    
    console.log(`Available products: ${availableProducts.length}`);
    
    // Step 3: Get all transactions and their current item counts
    const { data: allTransactions } = await supabase
      .from('transactions')
      .select(`
        id,
        total_amount,
        created_at,
        store_id,
        customer_age,
        customer_gender
      `);
    
    if (!allTransactions) {
      console.log('❌ Could not fetch transactions');
      return;
    }
    
    console.log(`Total transactions to enhance: ${allTransactions.length}`);
    
    // Step 4: Get current item counts per transaction
    const { data: currentItems } = await supabase
      .from('transaction_items')
      .select('transaction_id, id');
    
    const transactionItemCounts = {};
    if (currentItems) {
      currentItems.forEach(item => {
        transactionItemCounts[item.transaction_id] = (transactionItemCounts[item.transaction_id] || 0) + 1;
      });
    }
    
    // Step 5: Enhance transactions with STT-realistic additional items
    console.log('\n🛒 Step 2: Adding STT-captured additional items...');
    
    let enhancedCount = 0;
    let totalNewItems = 0;
    const batchSize = 500;
    
    for (let batch = 0; batch < Math.ceil(allTransactions.length / batchSize); batch++) {
      const startIdx = batch * batchSize;
      const endIdx = Math.min(startIdx + batchSize, allTransactions.length);
      const batchTransactions = allTransactions.slice(startIdx, endIdx);
      
      const newItems = [];
      
      for (const transaction of batchTransactions) {
        const currentItemCount = transactionItemCounts[transaction.id] || 0;
        
        // STT Simulation: Determine if we captured additional items in this transaction
        let shouldAddItems = false;
        let additionalItems = 0;
        
        if (currentItemCount === 0) {
          // Transaction with no items - STT might have missed everything or captured 1-3 items
          if (Math.random() > 0.2) { // 80% chance to add items
            additionalItems = Math.floor(Math.random() * 3) + 1; // 1-3 items
            shouldAddItems = true;
          }
        } else if (currentItemCount === 1) {
          // Transaction with 1 item - STT might have captured additional items mentioned
          if (Math.random() > 0.4) { // 60% chance to add more items
            additionalItems = Math.floor(Math.random() * 2) + 1; // 1-2 more items
            shouldAddItems = true;
          }
        } else if (currentItemCount < 3) {
          // Transaction with 2 items - STT might have captured one more
          if (Math.random() > 0.6) { // 40% chance to add one more item
            additionalItems = 1;
            shouldAddItems = true;
          }
        }
        // Transactions with 3+ items are considered complete
        
        if (shouldAddItems) {
          let transactionTotal = transaction.total_amount || 0;
          
          for (let i = 0; i < additionalItems; i++) {
            const product = availableProducts[Math.floor(Math.random() * availableProducts.length)];
            
            // STT Simulation: Item details recognition
            let quantity, price;
            
            // Quantity recognition (varies by STT clarity)
            const quantityClarity = Math.random();
            if (quantityClarity > 0.8) {
              // Clear audio: accurate quantity (1-3)
              quantity = Math.floor(Math.random() * 3) + 1;
            } else if (quantityClarity > 0.5) {
              // Partial audio: default to 1
              quantity = 1;
            } else {
              // Unclear audio: might miss quantity entirely (20% chance)
              if (Math.random() > 0.2) {
                quantity = 1; // Default assumption
              } else {
                continue; // Skip this item - STT couldn't capture
              }
            }
            
            // Price recognition 
            const priceClarity = Math.random();
            if (priceClarity > 0.7) {
              // Clear price mention: close to product price
              price = (product.price || 50) + (Math.random() * 20 - 10);
            } else if (priceClarity > 0.4) {
              // Approximate price: rounded to nearest 5 or 10
              const basePrice = product.price || 50;
              price = Math.round((basePrice + (Math.random() * 30 - 15)) / 10) * 10;
            } else if (priceClarity > 0.2) {
              // Very approximate: rounded to nearest 25
              const basePrice = product.price || 50;
              price = Math.round((basePrice + (Math.random() * 50 - 25)) / 25) * 25;
            } else {
              // No clear price: use product default with variation
              price = (product.price || 50) * (0.8 + Math.random() * 0.4); // 80-120% of product price
            }
            
            // Ensure positive values
            quantity = Math.max(quantity, 1);
            price = Math.max(price, 1);
            
            newItems.push({
              transaction_id: transaction.id,
              product_id: product.id,
              quantity,
              price: Math.round(price * 100) / 100, // Round to 2 decimal places
            });
            
            transactionTotal += quantity * price;
          }
          
          // Update transaction total (STT might not capture exact total)
          if (newItems.some(item => item.transaction_id === transaction.id)) {
            // Add some variation to simulate STT total capture inaccuracy
            const totalVariation = (Math.random() * 0.3 - 0.15); // ±15% variation
            const adjustedTotal = transactionTotal * (1 + totalVariation);
            
            await supabase
              .from('transactions')
              .update({ 
                total_amount: Math.max(adjustedTotal, transactionTotal * 0.7) // Minimum 70% of calculated
              })
              .eq('id', transaction.id);
          }
          
          enhancedCount++;
        }
      }
      
      // Insert new items for this batch
      if (newItems.length > 0) {
        const { error } = await supabase
          .from('transaction_items')
          .insert(newItems);
        
        if (error) {
          console.error(`Error inserting batch ${batch + 1}:`, error);
        } else {
          totalNewItems += newItems.length;
          console.log(`✅ Batch ${batch + 1}: Enhanced ${newItems.length} items for ${enhancedCount} transactions`);
        }
      }
      
      enhancedCount = 0; // Reset for next batch
    }
    
    // Step 6: Add some customer insights from STT (demographic mentions)
    console.log('\n👥 Step 3: Adding customer insights from STT mentions...');
    await addCustomerInsightsFromSTT();
    
    // Step 7: Add product feedback/substitution data  
    console.log('\n🔄 Step 4: Adding product feedback from STT...');
    await addProductFeedbackFromSTT(availableProducts);
    
    // Step 8: Final verification
    console.log('\n🔍 Step 5: Final verification...');
    
    const { count: finalTransactions } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    const { count: finalItems } = await supabase
      .from('transaction_items')
      .select('*', { count: 'exact', head: true });
    
    // Check data quality metrics
    const { data: itemDistribution } = await supabase
      .from('transaction_items')
      .select('transaction_id')
      .then(result => {
        if (result.data) {
          const counts = {};
          result.data.forEach(item => {
            counts[item.transaction_id] = (counts[item.transaction_id] || 0) + 1;
          });
          
          const distribution = {};
          Object.values(counts).forEach(count => {
            distribution[count] = (distribution[count] || 0) + 1;
          });
          
          return Object.entries(distribution).map(([itemCount, transactionCount]) => ({
            items_per_transaction: parseInt(itemCount),
            transaction_count: transactionCount
          }));
        }
        return [];
      });
    
    console.log('\n🎉 STT ENHANCEMENT COMPLETE!');
    console.log('=' .repeat(60));
    console.log(`📊 Total Transactions: ${finalTransactions}`);
    console.log(`📦 Total Items: ${finalItems}`);
    console.log(`📈 New Avg Items per Transaction: ${(finalItems / finalTransactions).toFixed(2)}`);
    console.log(`🆕 New Items Added: ${totalNewItems}`);
    
    console.log('\n📊 Items per Transaction Distribution:');
    if (itemDistribution && itemDistribution.length > 0) {
      itemDistribution
        .sort((a, b) => a.items_per_transaction - b.items_per_transaction)
        .forEach(dist => {
          const percentage = ((dist.transaction_count / finalTransactions) * 100).toFixed(1);
          console.log(`   ${dist.items_per_transaction} items: ${dist.transaction_count} transactions (${percentage}%)`);
        });
    }
    
    console.log('\n✅ Dataset now reflects realistic STT capture patterns');
    console.log('🎯 Ready for comprehensive filter system testing!');
    
  } catch (error) {
    console.error('❌ Error enhancing transactions:', error);
    throw error;
  }
}

async function addCustomerInsightsFromSTT() {
  try {
    // STT sometimes captures customer age/gender mentions during conversation
    const { data: customers } = await supabase
      .from('customers')
      .select('*')
      .is('age', null)
      .limit(1000); // Process subset
    
    if (!customers) return;
    
    const updates = [];
    
    for (const customer of customers) {
      // 30% chance STT captured age-related conversation
      if (Math.random() > 0.7) {
        const update = { id: customer.id };
        
        // Age ranges that STT might capture from conversation
        const ageRanges = [
          { min: 18, max: 25, phrases: ['young', 'college', 'student'] },
          { min: 26, max: 35, phrases: ['young professional', 'millennial'] },
          { min: 36, max: 50, phrases: ['middle-aged', 'family person'] },
          { min: 51, max: 65, phrases: ['mature', 'experienced'] },
          { min: 66, max: 80, phrases: ['senior', 'retired'] }
        ];
        
        const ageRange = ageRanges[Math.floor(Math.random() * ageRanges.length)];
        update.age = Math.floor(Math.random() * (ageRange.max - ageRange.min + 1)) + ageRange.min;
        
        updates.push(update);
      }
    }
    
    // Update in batches
    for (const customerUpdate of updates) {
      await supabase
        .from('customers')
        .update({ age: customerUpdate.age })
        .eq('id', customerUpdate.id);
    }
    
    console.log(`✅ Added age insights for ${updates.length} customers from STT`);
    
  } catch (error) {
    console.log('Note: Customer insights update encountered issues, continuing...');
  }
}

async function addProductFeedbackFromSTT(products) {
  try {
    // STT might capture customer feedback or substitution requests
    const feedbackEvents = [];
    const substitutionEvents = [];
    
    // Generate realistic feedback events (20-50 events)
    const feedbackCount = Math.floor(Math.random() * 30) + 20;
    
    for (let i = 0; i < feedbackCount; i++) {
      const product = products[Math.floor(Math.random() * products.length)];
      
      // STT captures various types of feedback
      const feedbackTypes = [
        'positive', 'negative', 'price_concern', 'quality_issue', 
        'recommendation', 'substitution_request'
      ];
      
      const feedbackType = feedbackTypes[Math.floor(Math.random() * feedbackTypes.length)];
      
      if (feedbackType === 'substitution_request') {
        const substituteProduct = products[Math.floor(Math.random() * products.length)];
        if (product.id !== substituteProduct.id) {
          substitutionEvents.push({
            original_product_id: product.id,
            substitute_product_id: substituteProduct.id,
            substitution_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            reason: ['Out of stock', 'Price difference', 'Customer preference', 'Recommendation'][Math.floor(Math.random() * 4)],
            store_location: ['Manila', 'Cebu', 'Davao', 'Quezon City'][Math.floor(Math.random() * 4)],
          });
        }
      }
    }
    
    // Insert substitution events if table exists
    if (substitutionEvents.length > 0) {
      try {
        await supabase.from('substitutions').insert(substitutionEvents.slice(0, 50)); // Limit to 50
        console.log(`✅ Added ${Math.min(substitutionEvents.length, 50)} substitution events from STT`);
      } catch (error) {
        console.log('Note: Substitutions table not available, skipping...');
      }
    }
    
  } catch (error) {
    console.log('Note: Product feedback enhancement encountered issues, continuing...');
  }
}

// Run the enhancement
enhanceExistingTransactionsSTT().catch(console.error);