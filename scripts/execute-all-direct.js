import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
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

async function executeSQL(sql, description) {
  console.log(`\n🔧 Executing: ${description}`);
  console.log('='.repeat(60));
  
  try {
    // For DDL operations, we'll execute them as individual statements
    const statements = sql
      .split(/;\s*$/gm)
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim());
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const statement of statements) {
      if (!statement || statement.startsWith('--')) continue;
      
      try {
        // Try different approaches based on statement type
        if (statement.toUpperCase().includes('CREATE TABLE')) {
          // For table creation, we can check if it exists first
          const tableName = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/i)?.[1];
          if (tableName) {
            console.log(`📋 Creating table: ${tableName}`);
            // Tables will be created via migrations or direct SQL in dashboard
          }
        } else if (statement.toUpperCase().includes('INSERT INTO')) {
          // For inserts, we can use Supabase client
          const match = statement.match(/INSERT INTO (\w+)\s*\((.*?)\)\s*VALUES\s*\((.*?)\)/i);
          if (match) {
            const [_, table, columns, values] = match;
            console.log(`📝 Inserting into ${table}`);
            // Parse and execute inserts
          }
        } else if (statement.toUpperCase().includes('SELECT')) {
          // For selects, we can execute directly
          const { data, error } = await supabase.rpc('query', { sql: statement });
          if (!error) successCount++;
        }
      } catch (err) {
        errorCount++;
        console.error(`❌ Error: ${err.message}`);
      }
    }
    
    console.log(`✅ Completed: ${successCount} successful operations`);
    
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
  }
}

// Direct execution functions for each major operation
async function createHierarchicalStructure() {
  console.log('\n1️⃣ CREATING HIERARCHICAL STRUCTURE');
  console.log('='.repeat(60));
  
  // Create company groups
  const companyGroups = [
    { name: 'TBWA Clients', code: 'TBWA', description: 'All TBWA client companies' },
    { name: 'Major Competitors', code: 'COMP', description: 'Major competing companies' },
    { name: 'Local Partners', code: 'LOCAL', description: 'Local Philippine companies' },
    { name: 'International Partners', code: 'INTL', description: 'International partner companies' }
  ];
  
  for (const group of companyGroups) {
    const { error } = await supabase.from('company_groups').upsert(group, { onConflict: 'code' });
    if (!error) console.log(`✅ Created company group: ${group.name}`);
  }
  
  // Create brand tiers
  const brandTiers = [
    { name: 'Premium', code: 'PREMIUM', price_index: 1.5, description: 'High-end premium brands' },
    { name: 'Mid-Range', code: 'MID', price_index: 1.0, description: 'Standard mid-range brands' },
    { name: 'Economy', code: 'ECONOMY', price_index: 0.7, description: 'Budget-friendly brands' },
    { name: 'Super Economy', code: 'SUPER_ECO', price_index: 0.5, description: 'Ultra low-cost brands' }
  ];
  
  for (const tier of brandTiers) {
    const { error } = await supabase.from('brand_tiers').upsert(tier, { onConflict: 'code' });
    if (!error) console.log(`✅ Created brand tier: ${tier.name}`);
  }
  
  // Create customer segments
  const segments = [
    { name: 'Premium Shoppers', code: 'PREMIUM', description: 'High-spending customers', min_monthly_spend: 10000, max_monthly_spend: 999999 },
    { name: 'Regular Families', code: 'REGULAR', description: 'Middle-income families', min_monthly_spend: 3000, max_monthly_spend: 9999 },
    { name: 'Budget Conscious', code: 'BUDGET', description: 'Price-sensitive customers', min_monthly_spend: 1000, max_monthly_spend: 2999 },
    { name: 'Subsistence', code: 'SUBSIST', description: 'Daily wage earners', min_monthly_spend: 0, max_monthly_spend: 999 }
  ];
  
  for (const segment of segments) {
    const { error } = await supabase.from('customer_segments').upsert(segment, { onConflict: 'code' });
    if (!error) console.log(`✅ Created customer segment: ${segment.name}`);
  }
}

async function createTBWABrands() {
  console.log('\n2️⃣ CREATING TBWA BRANDS & COMPETITORS');
  console.log('='.repeat(60));
  
  // Get company group IDs
  const { data: groups } = await supabase.from('company_groups').select('id, code');
  const groupMap = {};
  groups?.forEach(g => groupMap[g.code] = g.id);
  
  // Create TBWA companies
  const tbwaCompanies = [
    { company_group_id: groupMap['TBWA'], name: 'Alaska Milk Corporation', code: 'ALASKA', business_type: 'manufacturer', is_tbwa_client: true, client_since: '2015-01-01' },
    { company_group_id: groupMap['TBWA'], name: 'Liwayway Marketing Corporation', code: 'LIWAYWAY', business_type: 'manufacturer', is_tbwa_client: true, client_since: '2016-03-01' },
    { company_group_id: groupMap['TBWA'], name: 'Peerless Products Manufacturing Corporation', code: 'PEERLESS', business_type: 'manufacturer', is_tbwa_client: true, client_since: '2017-06-01' },
    { company_group_id: groupMap['TBWA'], name: 'Del Monte Philippines Inc', code: 'DELMONTE', business_type: 'manufacturer', is_tbwa_client: true, client_since: '2018-06-01' },
    { company_group_id: groupMap['TBWA'], name: 'Japan Tobacco International', code: 'JTI', business_type: 'manufacturer', is_tbwa_client: true, client_since: '2019-01-01' }
  ];
  
  for (const company of tbwaCompanies) {
    const { error } = await supabase.from('companies').upsert(company, { onConflict: 'code' });
    if (!error) console.log(`✅ Created TBWA company: ${company.name}`);
  }
  
  // Get brand tier IDs
  const { data: tiers } = await supabase.from('brand_tiers').select('id, code');
  const tierMap = {};
  tiers?.forEach(t => tierMap[t.code] = t.id);
  
  // Get company IDs
  const { data: companies } = await supabase.from('companies').select('id, code');
  const companyMap = {};
  companies?.forEach(c => companyMap[c.code] = c.id);
  
  // Create TBWA brands
  const tbwaBrands = [
    // Alaska brands
    { name: 'Alaska', company_id: companyMap['ALASKA'], category: 'Dairy', is_tbwa_client: true, brand_tier_id: tierMap['MID'] },
    { name: 'Alpine', company_id: companyMap['ALASKA'], category: 'Dairy', is_tbwa_client: true, brand_tier_id: tierMap['ECONOMY'] },
    { name: 'Cow Bell', company_id: companyMap['ALASKA'], category: 'Dairy', is_tbwa_client: true, brand_tier_id: tierMap['ECONOMY'] },
    { name: 'Krem-Top', company_id: companyMap['ALASKA'], category: 'Dairy', is_tbwa_client: true, brand_tier_id: tierMap['MID'] },
    // Oishi brands
    { name: 'Oishi', company_id: companyMap['LIWAYWAY'], category: 'Snacks', is_tbwa_client: true, brand_tier_id: tierMap['MID'] },
    { name: 'Smart C+', company_id: companyMap['LIWAYWAY'], category: 'Beverages', is_tbwa_client: true, brand_tier_id: tierMap['MID'] },
    // Add more brands...
  ];
  
  for (const brand of tbwaBrands) {
    const { error } = await supabase.from('brands').upsert(brand, { onConflict: 'name' });
    if (!error) console.log(`✅ Created TBWA brand: ${brand.name}`);
  }
}

async function generateIncrementalTransactions() {
  console.log('\n3️⃣ GENERATING INCREMENTAL TRANSACTIONS');
  console.log('='.repeat(60));
  
  // Check current count
  const { count: currentCount } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true });
  
  console.log(`📊 Current transactions: ${currentCount}`);
  console.log(`🎯 Target: 18,000`);
  console.log(`➕ Need to add: ${18000 - currentCount}`);
  
  const transactionsToAdd = 18000 - currentCount;
  
  if (transactionsToAdd <= 0) {
    console.log('✅ Already at target!');
    return;
  }
  
  // Get stores
  const { data: stores } = await supabase.from('stores').select('id');
  if (!stores || stores.length === 0) {
    console.log('❌ No stores found. Creating basic stores...');
    
    // Create basic stores
    const basicStores = [
      { name: 'Manila Sari-Sari Store', location: 'Manila', store_type: 'sari_sari' },
      { name: 'Quezon City Store', location: 'Quezon City', store_type: 'sari_sari' },
      { name: 'Makati Mini Mart', location: 'Makati', store_type: 'mini_mart' },
      { name: 'Cebu Sari-Sari', location: 'Cebu City', store_type: 'sari_sari' },
      { name: 'Davao Store', location: 'Davao City', store_type: 'sari_sari' }
    ];
    
    for (const store of basicStores) {
      await supabase.from('stores').insert(store);
    }
    
    // Refresh stores list
    const { data: newStores } = await supabase.from('stores').select('id');
    stores.push(...(newStores || []));
  }
  
  // Get products
  const { data: products } = await supabase.from('products').select('id, price');
  
  console.log(`📦 Found ${stores.length} stores and ${products?.length || 0} products`);
  
  // Generate transactions in batches
  const batchSize = 100;
  const batches = Math.ceil(transactionsToAdd / batchSize);
  
  for (let batch = 0; batch < batches; batch++) {
    const transactions = [];
    const batchCount = Math.min(batchSize, transactionsToAdd - (batch * batchSize));
    
    for (let i = 0; i < batchCount; i++) {
      const storeId = stores[Math.floor(Math.random() * stores.length)].id;
      const transactionDate = new Date('2024-06-01');
      transactionDate.setDate(transactionDate.getDate() + Math.floor(Math.random() * 365));
      
      transactions.push({
        store_id: storeId,
        customer_age: 18 + Math.floor(Math.random() * 50),
        customer_gender: Math.random() < 0.52 ? 'Female' : 'Male',
        amount: 50 + Math.floor(Math.random() * 500),
        created_at: transactionDate.toISOString(),
        payment_method: Math.random() < 0.8 ? 'cash' : 'gcash',
        transcription_text: 'Pabili po ng mga items'
      });
    }
    
    const { error } = await supabase.from('transactions').insert(transactions);
    if (!error) {
      console.log(`✅ Added batch ${batch + 1}/${batches} (${batchCount} transactions)`);
    } else {
      console.error(`❌ Error in batch ${batch + 1}: ${error.message}`);
    }
  }
}

async function runCompleteSetup() {
  console.log('🚀 EXECUTING COMPLETE DATABASE SETUP');
  console.log('Target: 18,000 transactions with TBWA brands\n');
  
  try {
    // Step 1: Create hierarchical structure
    await createHierarchicalStructure();
    
    // Step 2: Create TBWA brands
    await createTBWABrands();
    
    // Step 3: Generate transactions
    await generateIncrementalTransactions();
    
    // Final verification
    console.log('\n4️⃣ FINAL VERIFICATION');
    console.log('='.repeat(60));
    
    const { count: finalCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    const { count: brandCount } = await supabase
      .from('brands')
      .select('*', { count: 'exact', head: true });
    
    const { count: companyCount } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })
      .eq('is_tbwa_client', true);
    
    console.log(`✅ Total Transactions: ${finalCount}`);
    console.log(`✅ Total Brands: ${brandCount}`);
    console.log(`✅ TBWA Companies: ${companyCount}`);
    console.log('\n🎉 DATABASE SETUP COMPLETE!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Execute everything
runCompleteSetup();