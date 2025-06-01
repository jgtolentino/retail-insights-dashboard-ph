import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTransactionItemsMinimum() {
  console.log('🛒 ENSURING ALL TRANSACTIONS HAVE AT LEAST 1 ITEM (STT-REALISTIC)...\n');
  
  try {
    // Step 1: Analyze current state
    console.log('📊 Step 1: Analyzing current transaction-item state...');
    
    const { count: totalTransactions } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    const { count: totalItems } = await supabase
      .from('transaction_items')
      .select('*', { count: 'exact', head: true });
    
    console.log(`Total transactions: ${totalTransactions}`);
    console.log(`Total items: ${totalItems}`);
    console.log(`Current average: ${(totalItems / totalTransactions).toFixed(2)} items per transaction`);
    
    // Step 2: Find transactions without items (INVALID - every transaction needs ≥1 item)
    const { data: transactionsWithoutItems } = await supabase
      .from('transactions')
      .select(`
        id, 
        total_amount,
        store_id,
        created_at
      `)
      .not('id', 'in', 
        supabase
          .from('transaction_items')
          .select('transaction_id')
      );
    
    console.log(`\n❌ Transactions with 0 items (INVALID): ${transactionsWithoutItems?.length || 0}`);
    
    if (!transactionsWithoutItems || transactionsWithoutItems.length === 0) {
      console.log('✅ All transactions already have items!');
      
      // Check distribution
      await analyzeItemDistribution();
      return;
    }
    
    // Step 3: Get available products
    const { data: availableProducts } = await supabase
      .from('products')
      .select('*');
    
    if (!availableProducts || availableProducts.length === 0) {
      console.log('⚠️  No products available, creating basic products...');
      await createEssentialProducts();
      return fixTransactionItemsMinimum(); // Restart after creating products
    }
    
    console.log(`Available products: ${availableProducts.length}`);
    
    // Step 4: Add items to transactions with 0 items (with STT-realistic variations)
    console.log(`\n🛒 Step 2: Adding items to ${transactionsWithoutItems.length} transactions...`);
    
    const batchSize = 500;
    const batches = Math.ceil(transactionsWithoutItems.length / batchSize);
    let totalItemsAdded = 0;
    
    for (let batch = 0; batch < batches; batch++) {
      const startIdx = batch * batchSize;
      const endIdx = Math.min(startIdx + batchSize, transactionsWithoutItems.length);
      const batchTransactions = transactionsWithoutItems.slice(startIdx, endIdx);
      
      const newItems = [];
      
      for (const transaction of batchTransactions) {
        // STT Simulation: Determine realistic item count for this transaction
        // Every transaction MUST have at least 1 item, but STT quality affects how many we captured
        
        let itemCount;
        const sttQuality = Math.random();
        
        if (sttQuality > 0.8) {
          // Excellent STT quality (20% chance) - captured 2-5 items
          itemCount = Math.floor(Math.random() * 4) + 2; // 2-5 items
        } else if (sttQuality > 0.5) {
          // Good STT quality (30% chance) - captured 1-3 items
          itemCount = Math.floor(Math.random() * 3) + 1; // 1-3 items
        } else if (sttQuality > 0.2) {
          // Fair STT quality (30% chance) - captured 1-2 items
          itemCount = Math.floor(Math.random() * 2) + 1; // 1-2 items
        } else {
          // Poor STT quality (20% chance) - only captured 1 item clearly
          itemCount = 1; // Minimum 1 item
        }
        
        let transactionTotal = 0;
        
        for (let i = 0; i < itemCount; i++) {
          const product = availableProducts[Math.floor(Math.random() * availableProducts.length)];
          
          // STT Simulation: Quantity recognition
          let quantity;
          const quantityClarity = Math.random();
          
          if (quantityClarity > 0.7) {
            // Clear quantity mention (70% chance)
            quantity = Math.floor(Math.random() * 3) + 1; // 1-3 units
          } else if (quantityClarity > 0.4) {
            // Partial quantity mention (30% chance) - default to 2
            quantity = Math.floor(Math.random() * 2) + 1; // 1-2 units
          } else {
            // Unclear quantity (10% chance) - assume 1
            quantity = 1;
          }
          
          // STT Simulation: Price recognition
          let price;
          const priceClarity = Math.random();
          
          if (priceClarity > 0.6) {
            // Clear price mention (60% chance) - close to actual price
            const basePrice = product.price || 50;
            price = basePrice + (Math.random() * 30 - 15); // ±15 variation
          } else if (priceClarity > 0.3) {
            // Approximate price (30% chance) - rounded estimate
            const basePrice = product.price || 50;
            price = Math.round((basePrice + (Math.random() * 40 - 20)) / 10) * 10;
          } else {
            // No clear price (10% chance) - use product default with variation
            const basePrice = product.price || 50;
            price = basePrice * (0.7 + Math.random() * 0.6); // 70-130% of base price
          }
          
          // Ensure positive values
          quantity = Math.max(quantity, 1);
          price = Math.max(price, 5); // Minimum ₱5
          
          newItems.push({
            transaction_id: transaction.id,
            product_id: product.id,
            quantity,
            price: Math.round(price * 100) / 100, // Round to 2 decimal places
          });
          
          transactionTotal += quantity * price;
        }
        
        // Update transaction total with STT-realistic inaccuracy
        const totalVariation = (Math.random() * 0.4 - 0.2); // ±20% variation
        const adjustedTotal = Math.max(
          transactionTotal * (1 + totalVariation),
          transactionTotal * 0.8 // Minimum 80% of calculated total
        );
        
        await supabase
          .from('transactions')
          .update({ 
            total_amount: Math.round(adjustedTotal * 100) / 100
          })
          .eq('id', transaction.id);
      }
      
      // Insert items for this batch
      if (newItems.length > 0) {
        // Check if RLS allows inserts by trying a small batch first
        const testItem = newItems[0];
        const { error: testError } = await supabase
          .from('transaction_items')
          .insert([testItem]);
        
        if (testError) {
          console.error(`❌ RLS Error on batch ${batch + 1}:`, testError.message);
          console.log('🔒 Attempting to disable RLS temporarily...');
          
          // Try with service role or skip this batch
          console.log('⚠️  Skipping batch due to RLS restrictions');
          continue;
        }
        
        // If test succeeded, remove the test item and insert the full batch
        await supabase
          .from('transaction_items')
          .delete()
          .eq('transaction_id', testItem.transaction_id)
          .eq('product_id', testItem.product_id);
        
        const { error } = await supabase
          .from('transaction_items')
          .insert(newItems);
        
        if (error) {
          console.error(`❌ Error inserting batch ${batch + 1}:`, error.message);
        } else {
          totalItemsAdded += newItems.length;
          console.log(`✅ Batch ${batch + 1}/${batches}: Added ${newItems.length} items`);
        }
      }
    }
    
    // Step 5: Analyze final distribution
    console.log('\n📊 Step 3: Analyzing final item distribution...');
    await analyzeItemDistribution();
    
    // Step 6: Final verification
    const { count: finalTransactions } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    const { count: finalItems } = await supabase
      .from('transaction_items')
      .select('*', { count: 'exact', head: true });
    
    const { data: transactionsStillWithoutItems } = await supabase
      .from('transactions')
      .select('id')
      .not('id', 'in', 
        supabase
          .from('transaction_items')
          .select('transaction_id')
      );
    
    console.log('\n🎉 TRANSACTION ITEM VALIDATION COMPLETE!');
    console.log('=' .repeat(60));
    console.log(`📊 Total Transactions: ${finalTransactions}`);
    console.log(`📦 Total Items: ${finalItems}`);
    console.log(`📈 New Average: ${(finalItems / finalTransactions).toFixed(2)} items per transaction`);
    console.log(`🆕 Items Added: ${totalItemsAdded}`);
    console.log(`❌ Transactions Still Without Items: ${transactionsStillWithoutItems?.length || 0}`);
    
    if ((transactionsStillWithoutItems?.length || 0) === 0) {
      console.log('\n✅ SUCCESS: All transactions now have at least 1 item!');
      console.log('🎯 Dataset reflects realistic STT product capture patterns');
      console.log('🛒 Ready for comprehensive product/brand filtering!');
    } else {
      console.log(`\n⚠️  WARNING: ${transactionsStillWithoutItems?.length} transactions still have 0 items`);
      console.log('💡 This may be due to RLS policies - check database permissions');
    }
    
  } catch (error) {
    console.error('❌ Error fixing transaction items:', error);
    throw error;
  }
}

async function createEssentialProducts() {
  console.log('Creating essential products for transactions...');
  
  // First ensure we have brands
  const { data: existingBrands } = await supabase.from('brands').select('*');
  
  let brands = existingBrands || [];
  
  if (brands.length === 0) {
    console.log('Creating essential brands...');
    const essentialBrands = [
      { name: 'Marlboro', category: 'Cigarettes' },
      { name: 'Coca-Cola', category: 'Beverages' },
      { name: 'Pepsi', category: 'Beverages' },
      { name: 'Lay\'s', category: 'Snacks' },
      { name: 'Pringles', category: 'Snacks' },
      { name: 'Pantene', category: 'Personal Care' },
      { name: 'Lucky Strike', category: 'Cigarettes' },
      { name: 'Sprite', category: 'Beverages' },
    ];
    
    const { data: insertedBrands, error: brandsError } = await supabase
      .from('brands')
      .insert(essentialBrands)
      .select('*');
    
    if (brandsError) {
      console.error('Error creating brands:', brandsError);
      return;
    }
    
    brands = insertedBrands || [];
    console.log(`✅ Created ${brands.length} essential brands`);
  }
  
  // Create products for each brand
  const products = [];
  brands.forEach(brand => {
    // Create 3-5 products per brand for variety
    const productCount = Math.floor(Math.random() * 3) + 3; // 3-5 products
    
    for (let i = 1; i <= productCount; i++) {
      let productName;
      let price;
      
      switch (brand.category) {
        case 'Cigarettes':
          productName = `${brand.name} ${['Red', 'Blue', 'Gold', 'Menthol', 'Lights'][i - 1] || `Variant ${i}`}`;
          price = Math.floor(Math.random() * 50) + 80; // ₱80-130
          break;
        case 'Beverages':
          productName = `${brand.name} ${['Regular', 'Zero', 'Diet', 'Lemon', 'Orange'][i - 1] || `Flavor ${i}`}`;
          price = Math.floor(Math.random() * 30) + 20; // ₱20-50
          break;
        case 'Snacks':
          productName = `${brand.name} ${['Original', 'BBQ', 'Cheese', 'Spicy', 'Sour Cream'][i - 1] || `Flavor ${i}`}`;
          price = Math.floor(Math.random() * 40) + 25; // ₱25-65
          break;
        case 'Personal Care':
          productName = `${brand.name} ${['Shampoo', 'Conditioner', 'Soap', 'Lotion', 'Body Wash'][i - 1] || `Product ${i}`}`;
          price = Math.floor(Math.random() * 100) + 50; // ₱50-150
          break;
        default:
          productName = `${brand.name} Product ${i}`;
          price = Math.floor(Math.random() * 80) + 30; // ₱30-110
      }
      
      products.push({
        name: productName,
        brand_id: brand.id,
        price,
        category: brand.category,
      });
    }
  });
  
  const { error: productsError } = await supabase
    .from('products')
    .insert(products);
  
  if (productsError) {
    console.error('Error creating products:', productsError);
  } else {
    console.log(`✅ Created ${products.length} essential products`);
  }
}

async function analyzeItemDistribution() {
  try {
    // Get transaction-item count distribution
    const { data: transactionItems } = await supabase
      .from('transaction_items')
      .select('transaction_id');
    
    if (!transactionItems) return;
    
    const itemCounts = {};
    transactionItems.forEach(item => {
      itemCounts[item.transaction_id] = (itemCounts[item.transaction_id] || 0) + 1;
    });
    
    const distribution = {};
    Object.values(itemCounts).forEach(count => {
      distribution[count] = (distribution[count] || 0) + 1;
    });
    
    console.log('\n📊 Items per Transaction Distribution:');
    Object.entries(distribution)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .forEach(([itemCount, transactionCount]) => {
        const totalTransactions = Object.keys(itemCounts).length;
        const percentage = ((transactionCount / totalTransactions) * 100).toFixed(1);
        console.log(`   ${itemCount} items: ${transactionCount} transactions (${percentage}%)`);
      });
    
  } catch (error) {
    console.log('Note: Could not analyze distribution, continuing...');
  }
}

// Run the fix
fixTransactionItemsMinimum().catch(console.error);