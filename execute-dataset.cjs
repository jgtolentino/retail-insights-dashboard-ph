const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function executeSQLScript() {
  console.log('🚀 Executing comprehensive brand dataset...');
  
  try {
    // Clear existing data first
    console.log('🗑️ Clearing existing data...');
    await supabase.from('brands').delete().neq('id', 0);
    await supabase.from('stores').delete().neq('id', 0);
    console.log('✅ Data cleared');
    
    // Read and execute SQL file
    const sqlContent = fs.readFileSync('quick-fix.sql', 'utf8');
    
    // Extract just the INSERT statements
    const brandInserts = sqlContent.match(/INSERT INTO brands.*?;/gs);
    const storeInserts = sqlContent.match(/INSERT INTO stores.*?;/gs);
    
    if (brandInserts) {
      for (const insert of brandInserts) {
        const { error } = await supabase.rpc('exec_sql', { query: insert });
        if (error) {
          console.error('Error inserting brands:', error);
        } else {
          console.log('✅ Brands inserted');
        }
      }
    }
    
    if (storeInserts) {
      for (const insert of storeInserts) {
        const { error } = await supabase.rpc('exec_sql', { query: insert });
        if (error) {
          console.error('Error inserting stores:', error);
        } else {
          console.log('✅ Stores inserted');
        }
      }
    }
    
    // Verify results
    const { data: brands } = await supabase.from('brands').select('id, name, category, is_tbwa');
    const { data: stores } = await supabase.from('stores').select('id, name');
    
    console.log('\n📊 DATASET LOADED:');
    console.log(`✅ Total brands: ${brands?.length || 0}`);
    console.log(`✅ TBWA client brands: ${brands?.filter(b => b.is_tbwa).length || 0}`);
    console.log(`✅ Competitor brands: ${brands?.filter(b => !b.is_tbwa).length || 0}`);
    console.log(`✅ Total stores: ${stores?.length || 0}`);
    
    if (brands && brands.length > 0) {
      console.log('\n🏷️ Sample TBWA brands:', brands.filter(b => b.is_tbwa).slice(0, 5).map(b => b.name));
      console.log('🏷️ Sample competitors:', brands.filter(b => !b.is_tbwa).slice(0, 5).map(b => b.name));
    }
    
  } catch (error) {
    console.error('❌ Error executing SQL script:', error);
  }
}

executeSQLScript();