import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQLScript() {
  console.log('🚀 Starting Philippine retail data generation...\n');
  
  try {
    // Read the SQL script
    const sqlScript = fs.readFileSync('scripts/generate_philippine_data.sql', 'utf8');
    
    // Split into individual statements (simple split by semicolon)
    const statements = sqlScript
      .split(/;\s*$/gm)
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim() + ';');
    
    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);
    
    // Execute key statements one by one
    let executedCount = 0;
    
    // 1. Create location hierarchy table
    console.log('📍 Creating location hierarchy...');
    const createTableStmt = statements.find(s => s.includes('CREATE TABLE IF NOT EXISTS location_hierarchy'));
    if (createTableStmt) {
      const { error } = await supabase.rpc('execute_sql', { query: createTableStmt });
      if (error) console.error('Error creating table:', error);
      else console.log('✅ Location hierarchy table ready');
    }
    
    // 2. Insert location data
    console.log('\n🏘️ Inserting Philippine barangays...');
    const insertLocationsStmt = statements.find(s => s.includes('INSERT INTO location_hierarchy') && s.includes('Ermita'));
    if (insertLocationsStmt) {
      const { error } = await supabase.rpc('execute_sql', { query: insertLocationsStmt });
      if (error) console.error('Error inserting locations:', error);
      else console.log('✅ Barangay data inserted');
    }
    
    // 3. Create and execute store generation function
    console.log('\n🏪 Generating stores...');
    const createStoreFuncStmt = statements.find(s => s.includes('CREATE OR REPLACE FUNCTION generate_hierarchical_stores'));
    if (createStoreFuncStmt) {
      const { error } = await supabase.rpc('execute_sql', { query: createStoreFuncStmt });
      if (error) console.error('Error creating store function:', error);
      else {
        console.log('✅ Store generation function created');
        
        // Execute store generation
        const { error: genError } = await supabase.rpc('generate_hierarchical_stores');
        if (genError) console.error('Error generating stores:', genError);
        else console.log('✅ Stores generated across all barangays');
      }
    }
    
    // 4. Create transaction generation function
    console.log('\n💳 Setting up transaction generation...');
    const createTransFuncStmt = statements.find(s => s.includes('CREATE OR REPLACE FUNCTION generate_philippine_transactions'));
    if (createTransFuncStmt) {
      const { error } = await supabase.rpc('execute_sql', { query: createTransFuncStmt });
      if (error) console.error('Error creating transaction function:', error);
      else console.log('✅ Transaction generation function created');
    }
    
    // 5. Create helper functions
    console.log('\n🛠️ Creating helper functions...');
    const helperFunctions = [
      'generate_filipino_transcription',
      'select_product_by_context',
      'add_substitution_pattern'
    ];
    
    for (const funcName of helperFunctions) {
      const stmt = statements.find(s => s.includes(`CREATE OR REPLACE FUNCTION ${funcName}`));
      if (stmt) {
        const { error } = await supabase.rpc('execute_sql', { query: stmt });
        if (error) console.error(`Error creating ${funcName}:`, error);
        else console.log(`✅ ${funcName} function created`);
      }
    }
    
    // 6. Execute transaction generation
    console.log('\n🎯 Generating 50,000 transactions (this may take a few minutes)...');
    const { data: genResult, error: genError } = await supabase.rpc('generate_philippine_transactions', {
      p_start_date: '2024-06-01',
      p_end_date: '2025-05-31',
      p_transaction_count: 50000
    });
    
    if (genError) {
      console.error('Error generating transactions:', genError);
    } else {
      console.log('✅ Transaction generation complete!');
      console.log('📊 Result:', genResult);
    }
    
    // 7. Generate analytics tables
    console.log('\n📈 Creating analytics tables...');
    const analyticsTables = ['hourly_patterns', 'regional_insights'];
    for (const table of analyticsTables) {
      const stmt = statements.find(s => s.includes(`CREATE TABLE IF NOT EXISTS ${table}`));
      if (stmt) {
        const { error } = await supabase.rpc('execute_sql', { query: stmt });
        if (error) console.error(`Error creating ${table}:`, error);
        else console.log(`✅ ${table} table created`);
      }
    }
    
    // 8. Verify results
    console.log('\n🔍 Verifying data generation...');
    
    // Check transaction count
    const { count: transCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    // Check store count
    const { count: storeCount } = await supabase
      .from('stores')
      .select('*', { count: 'exact', head: true });
    
    // Check regions
    const { data: regions } = await supabase
      .from('stores')
      .select('region')
      .order('region');
    
    const uniqueRegions = [...new Set(regions?.map(s => s.region) || [])];
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL DATA SUMMARY:');
    console.log('='.repeat(60));
    console.log(`✅ Total Transactions: ${transCount || 0}`);
    console.log(`✅ Total Stores: ${storeCount || 0}`);
    console.log(`✅ Regions Covered: ${uniqueRegions.length}`);
    console.log(`✅ Date Range: June 2024 - May 2025`);
    console.log('\n🎉 Philippine retail data generation complete!');
    
  } catch (error) {
    console.error('❌ Script execution error:', error);
  }
}

// Create execute_sql RPC function if it doesn't exist
async function createExecuteSQLFunction() {
  const createFunction = `
    CREATE OR REPLACE FUNCTION execute_sql(query text)
    RETURNS void AS $$
    BEGIN
      EXECUTE query;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  
  try {
    const { error } = await supabase.rpc('execute_sql', { query: createFunction });
    if (error && error.message.includes('does not exist')) {
      // Function doesn't exist, try direct execution
      console.log('Creating execute_sql function...');
      // This would need to be done in Supabase dashboard
      console.log('⚠️  Please create execute_sql function in Supabase dashboard first');
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
}

// Run the script
executeSQLScript();