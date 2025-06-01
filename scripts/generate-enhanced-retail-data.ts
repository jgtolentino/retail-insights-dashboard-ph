#!/usr/bin/env tsx

/**
 * Enhanced Retail Data Generator for Sprint 4
 * Generates realistic transaction data with new fields:
 * - payment_method, checkout_time, request_type
 * - transcription_text, suggestion_accepted
 * - substitution patterns, request behaviors
 */

import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lcoxtanyckjzyxxcsjzz.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDUzMjcsImV4cCI6MjA2MzkyMTMyN30.W2JgvZdXubvWpKCNZ7TfjLiKANZO1Hlb164fBEKH2dA';
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration
const BATCH_SIZE = 100;
const TOTAL_TRANSACTIONS = 2000;

// Reference data
const paymentMethods = [
  { method: 'cash', weight: 0.4 },
  { method: 'gcash', weight: 0.3 },
  { method: 'maya', weight: 0.2 },
  { method: 'credit', weight: 0.1 }
];

const requestTypes = [
  { type: 'branded', weight: 0.6 },
  { type: 'unbranded', weight: 0.3 },
  { type: 'pointing', weight: 0.1 }
];

const substitutionReasons = [
  'out_of_stock',
  'price_preference', 
  'brand_preference',
  'size_preference',
  'promotion_available'
];

// Transcription templates
const transcriptionTemplates = {
  branded: [
    "Customer: May {product} ba kayo? Store: Opo, meron po. Customer: Isa lang po.",
    "Customer: {brand} {category} po. Store: Eto po sir/mam. Customer: Salamat.",
    "Customer: Yung {product} ninyo. Store: Ito po ba? Customer: Opo, tama.",
    "Customer: Meron ba kayong {brand}? Store: Opo, dito po sa ref."
  ],
  unbranded: [
    "Customer: Yung {category} nyo. Store: Anong brand po gusto ninyo? Customer: Kahit ano na lang.",
    "Customer: May {category} ba kayo? Store: Meron po, ito yung available. Customer: Sige po.",
    "Customer: Bili ako ng {category}. Store: Ito po yung mura. Customer: Ok lang.",
    "Customer: {category} po. Store: Marami po kaming options, ito po pinakabago."
  ],
  pointing: [
    "Customer: *points* Ito po. Store: Ah, {product} po ba? Customer: Opo.",
    "Customer: *gestures* Yung diyan. Store: {product}? Customer: Yes, yan.",
    "Customer: *taps glass* Yung ito. Store: {brand} po ito. Customer: Sige.",
    "Customer: *points behind counter* Yang nasa likod. Store: {product} po ito. Customer: Oo."
  ]
};

// Weighted random selection
function weightedRandom<T>(items: Array<{weight: number} & T>): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item;
  }
  return items[items.length - 1];
}

// Generate realistic checkout times
function generateCheckoutTime(requestType: string, hasSubstitution: boolean): number {
  let baseTime = 30; // Base 30 seconds
  
  // Add time based on request type
  switch (requestType) {
    case 'branded': baseTime += 10; break;
    case 'unbranded': baseTime += 25; break;
    case 'pointing': baseTime += 15; break;
  }
  
  // Add time for substitutions
  if (hasSubstitution) baseTime += 45;
  
  // Add random variation (±20 seconds)
  const variation = (Math.random() - 0.5) * 40;
  return Math.max(15, Math.floor(baseTime + variation));
}

// Generate transcription text
function generateTranscription(requestType: string, product: any): string {
  const templates = transcriptionTemplates[requestType as keyof typeof transcriptionTemplates];
  const template = faker.helpers.arrayElement(templates);
  
  return template
    .replace('{product}', product?.name || 'product')
    .replace('{brand}', product?.brand || 'brand')
    .replace('{category}', product?.category?.toLowerCase() || 'item');
}

// Generate enhanced transaction data
async function generateEnhancedTransactions() {
  console.log('🚀 Starting enhanced transaction generation...');
  
  // Fetch existing products for realistic associations
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*');
    
  if (productsError) {
    console.error('❌ Error fetching products:', productsError);
    return;
  }
  
  const transactions = [];
  const substitutions = [];
  const requestBehaviors = [];
  
  for (let i = 0; i < TOTAL_TRANSACTIONS; i++) {
    const transactionDate = faker.date.recent({ days: 90 });
    const paymentMethod = weightedRandom(paymentMethods).method;
    const requestType = weightedRandom(requestTypes).type;
    const hasSubstitution = Math.random() < 0.15; // 15% have substitutions
    const checkoutSeconds = generateCheckoutTime(requestType, hasSubstitution);
    const checkoutTime = new Date(transactionDate.getTime() + checkoutSeconds * 1000);
    
    // Select random product for transcription
    const product = faker.helpers.arrayElement(products);
    const transcriptionText = generateTranscription(requestType, product);
    
    const transaction = {
      customer_id: faker.number.int({ min: 1, max: 500 }),
      store_id: faker.number.int({ min: 1, max: 10 }),
      transaction_date: transactionDate.toISOString(),
      total_amount: faker.number.float({ min: 50, max: 2000, fractionDigits: 2 }),
      payment_method: paymentMethod,
      checkout_time: checkoutTime.toISOString(),
      request_type: requestType,
      transcription_text: transcriptionText,
      suggestion_accepted: Math.random() < 0.7, // 70% acceptance rate
      checkout_seconds: checkoutSeconds
    };
    
    transactions.push(transaction);
    
    // Generate request behavior
    const behavior = {
      transaction_id: i + 1, // Will be updated after insertion
      behavior_type: faker.helpers.arrayElement(['initial_request', 'clarification', 'substitution']),
      product_mentioned: product.name,
      brand_mentioned: product.brand,
      gesture_used: requestType === 'pointing' || Math.random() < 0.2,
      clarification_count: Math.floor(Math.random() * 3),
      timestamp: transactionDate.toISOString()
    };
    
    requestBehaviors.push(behavior);
    
    // Generate substitution if applicable
    if (hasSubstitution) {
      const originalProduct = faker.helpers.arrayElement(products);
      const substituteProduct = faker.helpers.arrayElement(
        products.filter(p => p.category === originalProduct.category && p.id !== originalProduct.id)
      );
      
      if (substituteProduct) {
        const substitution = {
          transaction_id: i + 1, // Will be updated after insertion
          original_product_id: originalProduct.id,
          substituted_product_id: substituteProduct.id,
          reason: faker.helpers.arrayElement(substitutionReasons),
          acceptance_rate: faker.number.float({ min: 0.5, max: 0.9, fractionDigits: 2 }),
          created_at: transactionDate.toISOString()
        };
        
        substitutions.push(substitution);
      }
    }
  }
  
  // Insert transactions in batches
  console.log('📝 Inserting enhanced transactions...');
  
  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    const batch = transactions.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('transactions')
      .insert(batch);
      
    if (error) {
      console.error('❌ Error inserting transactions batch:', error);
      continue;
    }
    
    console.log(`✅ Inserted transactions ${i + 1}-${Math.min(i + BATCH_SIZE, transactions.length)}`);
  }
  
  // Get transaction IDs for foreign key relationships
  const { data: insertedTransactions, error: fetchError } = await supabase
    .from('transactions')
    .select('id')
    .order('id', { ascending: false })
    .limit(TOTAL_TRANSACTIONS);
    
  if (fetchError) {
    console.error('❌ Error fetching transaction IDs:', fetchError);
    return;
  }
  
  // Update foreign keys in behaviors and substitutions
  const transactionIds = insertedTransactions.map(t => t.id).reverse();
  
  requestBehaviors.forEach((behavior, index) => {
    behavior.transaction_id = transactionIds[index];
  });
  
  substitutions.forEach((sub, index) => {
    // Find corresponding transaction ID for substitutions
    const transactionIndex = substitutions.indexOf(sub);
    const matchingTransactionIndex = Math.floor(transactionIndex * TOTAL_TRANSACTIONS / substitutions.length);
    sub.transaction_id = transactionIds[matchingTransactionIndex];
  });
  
  // Insert request behaviors
  console.log('🧠 Inserting request behaviors...');
  
  for (let i = 0; i < requestBehaviors.length; i += BATCH_SIZE) {
    const batch = requestBehaviors.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('request_behaviors')
      .insert(batch);
      
    if (error) {
      console.error('❌ Error inserting request behaviors batch:', error);
      continue;
    }
    
    console.log(`✅ Inserted request behaviors ${i + 1}-${Math.min(i + BATCH_SIZE, requestBehaviors.length)}`);
  }
  
  // Insert substitutions
  console.log('🔄 Inserting substitutions...');
  
  for (let i = 0; i < substitutions.length; i += BATCH_SIZE) {
    const batch = substitutions.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('substitutions')
      .insert(batch);
      
    if (error) {
      console.error('❌ Error inserting substitutions batch:', error);
      continue;
    }
    
    console.log(`✅ Inserted substitutions ${i + 1}-${Math.min(i + BATCH_SIZE, substitutions.length)}`);
  }
  
  console.log('🎉 Enhanced data generation completed!');
  console.log(`📊 Generated ${transactions.length} transactions`);
  console.log(`🧠 Generated ${requestBehaviors.length} request behaviors`);
  console.log(`🔄 Generated ${substitutions.length} substitutions`);
}

// Generate transaction items for the new transactions
async function generateTransactionItems() {
  console.log('🛒 Generating transaction items...');
  
  const { data: transactions, error: transError } = await supabase
    .from('transactions')
    .select('id')
    .order('id', { ascending: false })
    .limit(TOTAL_TRANSACTIONS);
    
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('*');
    
  if (transError || prodError) {
    console.error('❌ Error fetching data for transaction items');
    return;
  }
  
  const transactionItems = [];
  
  for (const transaction of transactions) {
    const itemCount = faker.number.int({ min: 1, max: 5 });
    
    for (let i = 0; i < itemCount; i++) {
      const product = faker.helpers.arrayElement(products);
      const quantity = faker.number.int({ min: 1, max: 3 });
      
      const item = {
        transaction_id: transaction.id,
        product_id: product.id,
        quantity,
        unit_price: product.price,
        total_price: quantity * product.price
      };
      
      transactionItems.push(item);
    }
  }
  
  // Insert transaction items in batches
  for (let i = 0; i < transactionItems.length; i += BATCH_SIZE) {
    const batch = transactionItems.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('transaction_items')
      .insert(batch);
      
    if (error) {
      console.error('❌ Error inserting transaction items batch:', error);
      continue;
    }
    
    console.log(`✅ Inserted transaction items ${i + 1}-${Math.min(i + BATCH_SIZE, transactionItems.length)}`);
  }
  
  console.log(`🛒 Generated ${transactionItems.length} transaction items`);
}

// Main execution
async function main() {
  try {
    console.log('🏪 Enhanced Retail Data Generator for Sprint 4');
    console.log('=' .repeat(50));
    
    await generateEnhancedTransactions();
    await generateTransactionItems();
    
    // Refresh materialized view
    console.log('📊 Refreshing analytics view...');
    const { error: refreshError } = await supabase.rpc('refresh_transaction_analytics');
    
    if (refreshError) {
      console.error('❌ Error refreshing analytics view:', refreshError);
    } else {
      console.log('✅ Analytics view refreshed successfully');
    }
    
    console.log('\n🎉 All data generation completed successfully!');
    console.log('🚀 Ready for Sprint 4 dashboard features');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

export { generateEnhancedTransactions, generateTransactionItems };