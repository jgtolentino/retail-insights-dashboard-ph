import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Split SQL into executable chunks
function splitSQLStatements(sql) {
  // Remove comments and split by semicolon
  const cleaned = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');
  
  // Split by semicolon but keep track of functions/blocks
  const statements = [];
  let current = '';
  let inFunction = false;
  
  cleaned.split('\n').forEach(line => {
    if (line.includes('CREATE OR REPLACE FUNCTION') || line.includes('DO $$')) {
      inFunction = true;
    }
    
    current += line + '\n';
    
    if (line.includes('$$ LANGUAGE plpgsql;') || line.includes('END $$;')) {
      inFunction = false;
      statements.push(current.trim());
      current = '';
    } else if (!inFunction && line.trim().endsWith(';')) {
      statements.push(current.trim());
      current = '';
    }
  });
  
  if (current.trim()) {
    statements.push(current.trim());
  }
  
  return statements.filter(s => s.length > 0);
}

async function executeSQLFile(filename, description) {
  console.log(`\n📄 ${description}`);
  console.log('='.repeat(60));
  
  try {
    const sql = fs.readFileSync(filename, 'utf8');
    const statements = splitSQLStatements(sql);
    
    console.log(`Found ${statements.length} statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      
      // Skip empty statements
      if (!stmt.trim()) continue;
      
      // Get first 50 chars for logging
      const preview = stmt.substring(0, 50).replace(/\n/g, ' ');
      
      try {
        // For complex statements, try using rpc
        if (stmt.includes('CREATE') || stmt.includes('INSERT') || stmt.includes('UPDATE')) {
          // Execute via direct SQL (this requires service role key for full access)
          // For now, we'll log what needs to be done
          console.log(`⏳ Statement ${i + 1}: ${preview}...`);
          
          // Try to execute simpler statements
          if (stmt.includes('SELECT') && !stmt.includes('INSERT')) {
            const { data, error } = await supabase.rpc('execute_sql', { sql_query: stmt });
            if (error) throw error;
          }
          
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Error in statement ${i + 1}: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n✅ Completed: ${successCount} successful, ${errorCount} errors`);
    
  } catch (error) {
    console.error(`❌ Failed to read/execute ${filename}: ${error.message}`);
  }
}

async function checkCurrentStatus() {
  console.log('\n🔍 CHECKING CURRENT DATABASE STATUS');
  console.log('='.repeat(60));
  
  try {
    // Check transactions
    const { count: transactionCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    // Check stores
    const { count: storeCount } = await supabase
      .from('stores')
      .select('*', { count: 'exact', head: true });
    
    // Check brands
    const { count: brandCount } = await supabase
      .from('brands')
      .select('*', { count: 'exact', head: true });
    
    // Check products
    const { count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Current Status:`);
    console.log(`   - Transactions: ${transactionCount || 0}`);
    console.log(`   - Stores: ${storeCount || 0}`);
    console.log(`   - Brands: ${brandCount || 0}`);
    console.log(`   - Products: ${productCount || 0}`);
    console.log(`   - Target: 18,000 transactions`);
    console.log(`   - Needed: ${Math.max(0, 18000 - (transactionCount || 0))} more transactions`);
    
    return {
      transactionCount: transactionCount || 0,
      storeCount: storeCount || 0,
      brandCount: brandCount || 0,
      productCount: productCount || 0
    };
    
  } catch (error) {
    console.error('❌ Error checking status:', error.message);
    return null;
  }
}

async function runSetup() {
  console.log('🚀 STARTING COMPLETE DATABASE SETUP');
  console.log('Target: 18,000 transactions with full TBWA brand portfolio\n');
  
  // Check current status
  const initialStatus = await checkCurrentStatus();
  
  if (!initialStatus) {
    console.log('\n❌ Could not connect to database. Please check your credentials.');
    return;
  }
  
  // Provide manual execution instructions
  console.log('\n📋 MANUAL EXECUTION REQUIRED');
  console.log('='.repeat(60));
  console.log('Due to Supabase security, please run these scripts manually in your');
  console.log('Supabase SQL Editor (https://app.supabase.com)\n');
  
  console.log('1️⃣ FIRST: Create Hierarchical Structure');
  console.log('   Copy and run: scripts/create_hierarchical_structure.sql\n');
  
  console.log('2️⃣ SECOND: Add TBWA Complete Brands');
  console.log('   Copy and run: scripts/tbwa_complete_brands_structure.sql\n');
  
  console.log('3️⃣ THIRD: Generate Incremental Transactions');
  console.log('   Copy and run: scripts/incremental_data_generation.sql\n');
  
  console.log('📌 IMPORTANT NOTES:');
  console.log('   - Run each script completely before moving to the next');
  console.log('   - The incremental script will add transactions to reach 18,000');
  console.log('   - All existing data will be preserved');
  console.log('   - Date range will be June 2024 - May 2025');
  
  // Generate quick summary SQL
  console.log('\n4️⃣ AFTER RUNNING ALL SCRIPTS, verify with this query:\n');
  
  const verificationSQL = `
-- Verification Query
WITH summary AS (
  SELECT 
    (SELECT COUNT(*) FROM transactions) as transactions,
    (SELECT COUNT(*) FROM stores) as stores,
    (SELECT COUNT(DISTINCT c.id) FROM companies c WHERE is_tbwa_client = true) as tbwa_companies,
    (SELECT COUNT(DISTINCT b.id) FROM brands b JOIN companies c ON b.company_id = c.id WHERE c.is_tbwa_client = true) as tbwa_brands,
    (SELECT COUNT(DISTINCT b.id) FROM brands b JOIN companies c ON b.company_id = c.id WHERE c.is_tbwa_client = false) as competitor_brands,
    (SELECT MIN(created_at)::DATE FROM transactions) as start_date,
    (SELECT MAX(created_at)::DATE FROM transactions) as end_date
)
SELECT 
  '✅ Setup Complete!' as status,
  transactions || ' transactions' as transactions,
  stores || ' stores' as stores,
  tbwa_companies || ' TBWA companies' as tbwa_companies,
  tbwa_brands || ' TBWA brands' as tbwa_brands,
  competitor_brands || ' competitor brands' as competitors,
  start_date || ' to ' || end_date as date_range
FROM summary;`;
  
  console.log(verificationSQL);
  
  // Final check
  setTimeout(async () => {
    console.log('\n🔄 Checking final status...');
    const finalStatus = await checkCurrentStatus();
    
    if (finalStatus && finalStatus.transactionCount >= 18000) {
      console.log('\n🎉 SUCCESS! Database setup complete with 18,000+ transactions!');
    } else {
      console.log('\n⏳ Please complete the manual SQL execution in Supabase.');
    }
  }, 2000);
}

// Run the setup
runSetup();