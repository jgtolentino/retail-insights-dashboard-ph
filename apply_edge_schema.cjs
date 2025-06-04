#!/usr/bin/env node
/**
 * Apply Edge Device Schema to Project Scout Supabase
 * Creates missing tables and columns for edge device integration
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQLFile(filePath) {
  console.log(`📝 Executing SQL file: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ SQL file not found: ${filePath}`);
    return false;
  }
  
  const sqlContent = fs.readFileSync(filePath, 'utf-8');
  
  // Split SQL into individual statements
  const statements = sqlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
  
  console.log(`🔧 Executing ${statements.length} SQL statements...`);
  
  let successCount = 0;
  let errors = [];
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    
    try {
      // Use the rpc function to execute raw SQL
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: statement
      });
      
      if (error) {
        console.error(`❌ Statement ${i + 1} failed:`, error.message);
        errors.push({ statement: i + 1, error: error.message });
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
        successCount++;
      }
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (err) {
      console.error(`❌ Statement ${i + 1} failed:`, err.message);
      errors.push({ statement: i + 1, error: err.message });
    }
  }
  
  console.log(`\n📊 Execution Summary:`);
  console.log(`✅ Successful: ${successCount}/${statements.length}`);
  console.log(`❌ Failed: ${errors.length}/${statements.length}`);
  
  if (errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    errors.forEach(({ statement, error }) => {
      console.log(`   Statement ${statement}: ${error}`);
    });
  }
  
  return errors.length === 0;
}

async function addMissingColumns() {
  console.log('\n🔧 Adding missing columns to existing tables...');
  
  const alterStatements = [
    // Add device_id to transactions if not exists
    `
    DO $$ 
    BEGIN 
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'device_id'
      ) THEN
        ALTER TABLE transactions ADD COLUMN device_id TEXT;
        CREATE INDEX IF NOT EXISTS idx_transactions_device_id ON transactions(device_id);
      END IF;
    END $$;
    `,
    
    // Add foreign key constraint after devices table exists
    `
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'devices') THEN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'transactions_device_id_fkey'
        ) THEN
          ALTER TABLE transactions 
          ADD CONSTRAINT transactions_device_id_fkey 
          FOREIGN KEY (device_id) REFERENCES devices(device_id);
        END IF;
      END IF;
    END $$;
    `
  ];
  
  for (const statement of alterStatements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.log(`⚠️  Column update warning: ${error.message}`);
      } else {
        console.log(`✅ Column update successful`);
      }
    } catch (err) {
      console.log(`⚠️  Column update warning: ${err.message}`);
    }
  }
}

async function verifyTablesCreated() {
  console.log('\n🔍 Verifying edge tables were created...');
  
  const requiredTables = ['devices', 'device_health', 'product_detections', 'edge_logs'];
  const existingTables = [];
  
  for (const tableName of requiredTables) {
    try {
      const { error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);
      
      if (!error) {
        console.log(`✅ Table '${tableName}' exists and accessible`);
        existingTables.push(tableName);
      } else {
        console.log(`❌ Table '${tableName}' not accessible: ${error.message}`);
      }
    } catch (err) {
      console.log(`❌ Table '${tableName}' verification failed: ${err.message}`);
    }
  }
  
  return existingTables.length === requiredTables.length;
}

async function createSampleData() {
  console.log('\n📊 Creating sample data for testing...');
  
  try {
    // Create sample store if needed
    const { data: stores } = await supabase
      .from('stores')
      .select('id')
      .limit(1);
    
    let storeId = 'store_001';
    
    if (!stores || stores.length === 0) {
      const { data: newStore, error: storeError } = await supabase
        .from('stores')
        .insert({
          id: storeId,
          name: 'Test Store 001',
          location: 'Manila, Philippines',
          type: 'retail',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (storeError) {
        console.log(`⚠️  Could not create sample store: ${storeError.message}`);
      } else {
        console.log(`✅ Created sample store: ${storeId}`);
      }
    } else {
      storeId = stores[0].id;
      console.log(`✅ Using existing store: ${storeId}`);
    }
    
    // Create sample device
    const deviceId = 'Pi5_Edge_test001';
    
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .upsert({
        device_id: deviceId,
        device_type: 'RaspberryPi5',
        firmware_version: '2.1.0',
        store_id: storeId,
        status: 'active',
        registration_time: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        metadata: {
          test_device: true,
          created_by: 'edge_schema_setup'
        }
      })
      .select()
      .single();
    
    if (deviceError) {
      console.log(`⚠️  Could not create sample device: ${deviceError.message}`);
    } else {
      console.log(`✅ Created sample device: ${deviceId}`);
    }
    
    // Create sample health data
    const { error: healthError } = await supabase
      .from('device_health')
      .insert({
        device_id: deviceId,
        cpu_usage: 45.2,
        memory_usage: 62.8,
        disk_usage: 23.1,
        temperature: 42.5,
        uptime_seconds: 86400,
        network_connected: true,
        metadata: {
          test_data: true
        }
      });
    
    if (healthError) {
      console.log(`⚠️  Could not create sample health data: ${healthError.message}`);
    } else {
      console.log(`✅ Created sample health data`);
    }
    
  } catch (err) {
    console.log(`⚠️  Sample data creation failed: ${err.message}`);
  }
}

async function main() {
  console.log('🚀 Applying Edge Device Schema to Project Scout Supabase\n');
  
  try {
    // Step 1: Execute the main SQL file
    const mainSqlFile = 'create_missing_edge_tables.sql';
    const mainSuccess = await executeSQLFile(mainSqlFile);
    
    if (!mainSuccess) {
      console.log('\n⚠️  Some tables may not have been created properly');
      console.log('   This might be due to RLS policies or permission issues');
      console.log('   You may need to run the SQL manually in Supabase SQL Editor');
    }
    
    // Step 2: Add missing columns to existing tables
    await addMissingColumns();
    
    // Step 3: Verify tables were created
    const allTablesExist = await verifyTablesCreated();
    
    if (allTablesExist) {
      console.log('\n🎉 All edge device tables created successfully!');
      
      // Step 4: Create sample data
      await createSampleData();
      
      console.log('\n✅ Schema is now ready for edge device integration!');
      console.log('\n📋 Next steps:');
      console.log('1. Deploy edge devices using: install_edge_client.sh');
      console.log('2. Update .env.edge with your Supabase service role key');
      console.log('3. Test device registration and data collection');
      console.log('4. Monitor devices in Project Scout dashboard');
      
    } else {
      console.log('\n🔧 Some tables are missing. Please check the errors above.');
      console.log('   You may need to run the SQL manually in Supabase SQL Editor:');
      console.log(`   https://app.supabase.com/project/alxbucsacdxxwaibdxcf/sql`);
    }
    
  } catch (error) {
    console.error('\n❌ Schema application failed:', error.message);
    console.log('\n🔧 Manual SQL execution may be required');
    console.log('   Please run create_missing_edge_tables.sql in Supabase SQL Editor');
    process.exit(1);
  }
}

// Check if exec_sql function exists
async function checkExecuteSQLFunction() {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: 'SELECT 1 as test;'
    });
    
    if (error) {
      console.log('⚠️  exec_sql function not available');
      console.log('   Please run the SQL file manually in Supabase SQL Editor');
      console.log(`   https://app.supabase.com/project/alxbucsacdxxwaibdxcf/sql`);
      return false;
    }
    
    return true;
  } catch (err) {
    console.log('⚠️  Cannot execute SQL programmatically');
    console.log('   Please run the SQL file manually in Supabase SQL Editor');
    return false;
  }
}

// Run the schema application
checkExecuteSQLFunction()
  .then(canExecute => {
    if (canExecute) {
      return main();
    } else {
      console.log('\n📝 Manual SQL execution required:');
      console.log('1. Open Supabase SQL Editor: https://app.supabase.com/project/alxbucsacdxxwaibdxcf/sql');
      console.log('2. Copy and paste the contents of create_missing_edge_tables.sql');
      console.log('3. Execute the SQL statements');
      console.log('4. Run this script again to verify: node apply_edge_schema.cjs');
    }
  })
  .catch(error => {
    console.error('Schema application error:', error);
    process.exit(1);
  });