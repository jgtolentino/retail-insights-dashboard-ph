#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

// Supabase connection details
const SUPABASE_URL = 'https://lcoxtanyckjzyxxcsjzz.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODM0NTMyNywiZXhwIjoyMDYzOTIxMzI3fQ.42ByHcIAi1jrcpzdvfcMJyE6ibqr81d-rIjsqxL_Bbk';

// Direct database password (you'll need to get this from Supabase dashboard)
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || '[YOUR-DB-PASSWORD]';

// Migration files
const MIGRATION_FILES = [
  'sprint4_schema_updates.sql',
  'sprint4_rpc_functions.sql'
];

async function runMigration() {
  console.log('🚀 Sprint 4 Migration Script\n');
  
  // Check if @supabase/supabase-js is installed
  let supabase;
  try {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    console.log('✅ Supabase client initialized\n');
  } catch (error) {
    console.log('⚠️  @supabase/supabase-js not found. Install it with:');
    console.log('   npm install @supabase/supabase-js\n');
    
    // Continue without client to show alternative methods
  }

  // Read and combine migration files
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  let combinedSql = '';
  
  for (const file of MIGRATION_FILES) {
    const filePath = path.join(migrationsDir, file);
    try {
      console.log(`📄 Reading ${file}...`);
      const content = await fs.readFile(filePath, 'utf8');
      combinedSql += `\n-- =====================================\n`;
      combinedSql += `-- Migration: ${file}\n`;
      combinedSql += `-- =====================================\n\n`;
      combinedSql += content + '\n\n';
      console.log(`   ✓ Read ${content.length} characters`);
    } catch (error) {
      console.error(`❌ Error reading ${file}:`, error.message);
      return;
    }
  }

  // Save combined SQL for manual execution
  const combinedPath = path.join(migrationsDir, 'sprint4_combined.sql');
  await fs.writeFile(combinedPath, combinedSql);
  console.log(`\n✅ Created combined migration file: ${combinedPath}`);

  // Provide execution instructions
  console.log('\n📋 To apply these migrations, use one of these methods:\n');
  
  console.log('1️⃣  Using Supabase Dashboard (Recommended):');
  console.log('   a. Go to https://app.supabase.com/project/lcoxtanyckjzyxxcsjzz/editor');
  console.log('   b. Open the SQL Editor');
  console.log('   c. Copy and paste the content from sprint4_combined.sql');
  console.log('   d. Click "Run"\n');
  
  console.log('2️⃣  Using psql command line:');
  console.log('   psql "postgresql://postgres:' + DB_PASSWORD + '@db.lcoxtanyckjzyxxcsjzz.supabase.co:5432/postgres" < migrations/sprint4_combined.sql\n');
  
  console.log('3️⃣  Using Supabase CLI:');
  console.log('   a. Install: npm install -g supabase');
  console.log('   b. Login: supabase login');
  console.log('   c. Link: supabase link --project-ref lcoxtanyckjzyxxcsjzz');
  console.log('   d. Run: supabase db push < migrations/sprint4_combined.sql\n');

  // If Supabase client is available, try to execute
  if (supabase) {
    console.log('4️⃣  Attempting direct execution via Supabase client...\n');
    
    // Note: Supabase JS client doesn't have direct SQL execution
    // We'll need to check if specific tables exist instead
    try {
      const { data: tables, error } = await supabase
        .from('pg_catalog.pg_tables')
        .select('tablename')
        .eq('schemaname', 'public');
      
      if (error) {
        console.log('❌ Cannot execute SQL directly via JS client');
        console.log('   Please use one of the methods above\n');
      } else {
        console.log('📊 Current tables in database:', tables?.map(t => t.tablename).join(', '));
        console.log('\n⚠️  Direct SQL execution not available in JS client');
        console.log('   Please use one of the methods above to apply migrations\n');
      }
    } catch (error) {
      console.log('⚠️  Could not query database:', error.message);
    }
  }

  // Create a simple SQL execution script
  const executeScript = `#!/bin/bash
# Sprint 4 Migration Execution Script

SUPABASE_DB_URL="postgresql://postgres:${DB_PASSWORD}@db.lcoxtanyckjzyxxcsjzz.supabase.co:5432/postgres"

echo "🚀 Executing Sprint 4 migrations..."

# Execute combined migration
psql "$SUPABASE_DB_URL" < migrations/sprint4_combined.sql

if [ $? -eq 0 ]; then
  echo "✅ Migrations applied successfully!"
else
  echo "❌ Migration failed. Please check the error messages above."
fi
`;

  const scriptPath = path.join(__dirname, 'execute-sprint4.sh');
  await fs.writeFile(scriptPath, executeScript);
  await fs.chmod(scriptPath, '755');
  
  console.log(`💡 Created execution script: ${scriptPath}`);
  console.log('   Update the DB_PASSWORD and run: ./scripts/execute-sprint4.sh\n');

  // Summary
  console.log('📊 Migration Summary:');
  console.log('   - Tables to create: substitutions, request_behaviors');
  console.log('   - Columns to add: payment_method, checkout_time, request_type, etc.');
  console.log('   - Functions to create: 7 analytics functions');
  console.log('   - Indexes to create: 7 performance indexes');
  console.log('   - Sample data: ~2,500 records\n');
  
  console.log('⏭️  Next steps:');
  console.log('   1. Choose one of the methods above');
  console.log('   2. Execute the migrations');
  console.log('   3. Verify in Supabase Dashboard');
  console.log('   4. Test the new functions in your app\n');
}

// Run the script
runMigration().catch(console.error);