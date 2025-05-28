#!/usr/bin/env node

import pkg from 'pg';
const { Client } = pkg;

// Read connection string from environment variables
const connectionString = process.env.SUPABASE_DB_URL || (() => {
  console.error('❌ SUPABASE_DB_URL environment variable not set');
  process.exit(1);
})();

async function checkSprint2Status() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔍 Checking Sprint 2 Status...\n');

    // Check substitutions table
    const substCount = await client.query('SELECT COUNT(*) FROM substitutions');
    console.log(`📊 Substitutions records: ${substCount.rows[0].count}`);

    // Check if we have any substitution data
    if (parseInt(substCount.rows[0].count) > 0) {
      const sample = await client.query('SELECT * FROM substitutions LIMIT 3');
      console.log('📝 Sample substitutions:');
      sample.rows.forEach((row, i) => {
        console.log(`   ${i+1}. Product ${row.original_product_id} → ${row.substitute_product_id} (${row.reason})`);
      });
    }

    // Check for RPC functions
    const functions = await client.query(`
      SELECT proname 
      FROM pg_proc 
      WHERE proname IN ('get_frequently_bought_together', 'get_product_substitutions')
    `);
    console.log(`\n🔧 Sprint 2 Functions: ${functions.rows.length}/2 created`);
    functions.rows.forEach(f => console.log(`   ✅ ${f.proname}`));

    // Check brands with categories
    const categories = await client.query(`
      SELECT DISTINCT category 
      FROM brands 
      WHERE category IS NOT NULL 
      ORDER BY category
    `);
    console.log(`\n🏷️ Product Categories: ${categories.rows.length}`);
    categories.rows.forEach(c => console.log(`   • ${c.category}`));

    console.log('\n🎯 Sprint 2 Readiness:');
    const substitutionCount = parseInt(substCount.rows[0].count);
    const functionCount = functions.rows.length;
    
    if (substitutionCount >= 100 && functionCount === 2) {
      console.log('✅ SPRINT 2 IS READY! All features should work.');
    } else if (substitutionCount > 0) {
      console.log('⚠️  Sprint 2 partially ready - some data missing');
    } else {
      console.log('❌ Sprint 2 not ready - need to run setup script');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkSprint2Status();