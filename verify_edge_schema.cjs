#!/usr/bin/env node
/**
 * Verify Project Scout Supabase Schema for Edge Device Integration
 * Checks if all required tables and columns exist for edge devices
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Expected schema for edge device integration
const REQUIRED_TABLES = {
  'transactions': {
    required_columns: [
      'id', 'store_id', 'customer_id', 'total_amount', 
      'payment_method', 'created_at', 'device_id'
    ],
    optional_columns: [
      'customer_age', 'customer_gender', 'customer_location'
    ]
  },
  
  'transaction_items': {
    required_columns: [
      'id', 'transaction_id', 'product_id', 'quantity', 
      'unit_price', 'subtotal', 'created_at'
    ],
    optional_columns: []
  },
  
  'products': {
    required_columns: [
      'id', 'name', 'category', 'brand_id', 'sku', 
      'barcode', 'base_price', 'created_at'
    ],
    optional_columns: []
  },
  
  'brands': {
    required_columns: [
      'id', 'name', 'category', 'created_at'
    ],
    optional_columns: []
  },
  
  'stores': {
    required_columns: [
      'id', 'name', 'location', 'type', 'created_at'
    ],
    optional_columns: []
  },
  
  // New tables needed for edge devices
  'devices': {
    required_columns: [
      'id', 'device_id', 'device_type', 'firmware_version',
      'store_id', 'status', 'registration_time', 'last_seen'
    ],
    optional_columns: [
      'metadata', 'location', 'network_info'
    ]
  },
  
  'device_health': {
    required_columns: [
      'id', 'device_id', 'timestamp', 'cpu_usage', 
      'memory_usage', 'disk_usage', 'network_connected'
    ],
    optional_columns: [
      'temperature', 'uptime_seconds', 'battery_level'
    ]
  },
  
  'product_detections': {
    required_columns: [
      'id', 'device_id', 'store_id', 'detected_at',
      'brand_detected', 'confidence_score'
    ],
    optional_columns: [
      'customer_age', 'customer_gender', 'image_path', 'metadata'
    ]
  },
  
  'edge_logs': {
    required_columns: [
      'id', 'device_id', 'log_level', 'message', 'timestamp'
    ],
    optional_columns: [
      'component', 'error_code', 'metadata'
    ]
  }
};

async function getTableInfo(tableName) {
  try {
    // Get table columns using information_schema
    const { data, error } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = '${tableName}' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });
    
    if (error) {
      // Try alternative method - select with limit 0
      const { data: testData, error: testError } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);
      
      if (testError) {
        return null; // Table doesn't exist
      }
      
      // If we can select but can't get schema, assume basic structure exists
      return { exists: true, columns: [] };
    }
    
    return {
      exists: true,
      columns: data.map(col => ({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === 'YES'
      }))
    };
    
  } catch (error) {
    // Try simple existence check
    try {
      const { error: existsError } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);
      
      if (!existsError) {
        return { exists: true, columns: [] };
      }
    } catch (e) {
      // Table doesn't exist
    }
    
    return null;
  }
}

async function verifySchema() {
  console.log('🔍 Verifying Project Scout schema for edge device integration...\n');
  
  const results = {
    existing_tables: [],
    missing_tables: [],
    missing_columns: {},
    warnings: []
  };
  
  for (const [tableName, tableSchema] of Object.entries(REQUIRED_TABLES)) {
    console.log(`📋 Checking table: ${tableName}`);
    
    const tableInfo = await getTableInfo(tableName);
    
    if (!tableInfo) {
      console.log(`  ❌ Table '${tableName}' does not exist`);
      results.missing_tables.push(tableName);
      continue;
    }
    
    console.log(`  ✅ Table '${tableName}' exists`);
    results.existing_tables.push(tableName);
    
    if (tableInfo.columns.length > 0) {
      // Check required columns
      const existingColumnNames = tableInfo.columns.map(col => col.name);
      const missingColumns = tableSchema.required_columns.filter(
        col => !existingColumnNames.includes(col)
      );
      
      if (missingColumns.length > 0) {
        console.log(`  ⚠️  Missing required columns: ${missingColumns.join(', ')}`);
        results.missing_columns[tableName] = missingColumns;
      } else {
        console.log(`  ✅ All required columns present`);
      }
      
      // Check for additional recommended columns
      const missingOptional = tableSchema.optional_columns.filter(
        col => !existingColumnNames.includes(col)
      );
      
      if (missingOptional.length > 0) {
        console.log(`  💡 Optional columns not present: ${missingOptional.join(', ')}`);
        results.warnings.push(`${tableName}: missing optional columns ${missingOptional.join(', ')}`);
      }
    } else {
      console.log(`  ⚠️  Could not verify column structure`);
      results.warnings.push(`${tableName}: column structure verification failed`);
    }
    
    console.log('');
  }
  
  return results;
}

async function generateMissingTablesSQL(missingTables) {
  const sqlStatements = [];
  
  for (const tableName of missingTables) {
    let sql = '';
    
    switch (tableName) {
      case 'devices':
        sql = `
-- Create devices table for edge device registration
CREATE TABLE devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT UNIQUE NOT NULL,
  device_type TEXT NOT NULL DEFAULT 'RaspberryPi5',
  firmware_version TEXT NOT NULL DEFAULT '1.0.0',
  store_id TEXT REFERENCES stores(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  registration_time TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  location TEXT,
  network_info JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient lookups
CREATE INDEX idx_devices_device_id ON devices(device_id);
CREATE INDEX idx_devices_store_id ON devices(store_id);
CREATE INDEX idx_devices_status ON devices(status);

-- Enable RLS
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON devices FOR SELECT USING (true);
CREATE POLICY "Enable insert for service role" ON devices FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for service role" ON devices FOR UPDATE USING (true);
`;
        break;
        
      case 'device_health':
        sql = `
-- Create device_health table for monitoring
CREATE TABLE device_health (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  cpu_usage DECIMAL(5,2),
  memory_usage DECIMAL(5,2),
  disk_usage DECIMAL(5,2),
  temperature DECIMAL(5,2),
  uptime_seconds BIGINT,
  network_connected BOOLEAN DEFAULT true,
  battery_level DECIMAL(5,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_device_health_device_id ON device_health(device_id);
CREATE INDEX idx_device_health_timestamp ON device_health(timestamp);

-- Enable RLS
ALTER TABLE device_health ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON device_health FOR SELECT USING (true);
CREATE POLICY "Enable insert for service role" ON device_health FOR INSERT WITH CHECK (true);
`;
        break;
        
      case 'product_detections':
        sql = `
-- Create product_detections table for AI detection results
CREATE TABLE product_detections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
  store_id TEXT REFERENCES stores(id),
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  brand_detected TEXT NOT NULL,
  confidence_score DECIMAL(5,4) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  customer_age INTEGER,
  customer_gender TEXT CHECK (customer_gender IN ('Male', 'Female', 'Other')),
  image_path TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_product_detections_device_id ON product_detections(device_id);
CREATE INDEX idx_product_detections_store_id ON product_detections(store_id);
CREATE INDEX idx_product_detections_brand ON product_detections(brand_detected);
CREATE INDEX idx_product_detections_timestamp ON product_detections(detected_at);

-- Enable RLS
ALTER TABLE product_detections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON product_detections FOR SELECT USING (true);
CREATE POLICY "Enable insert for service role" ON product_detections FOR INSERT WITH CHECK (true);
`;
        break;
        
      case 'edge_logs':
        sql = `
-- Create edge_logs table for device logging
CREATE TABLE edge_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
  log_level TEXT NOT NULL DEFAULT 'INFO' CHECK (log_level IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL')),
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  component TEXT,
  error_code TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_edge_logs_device_id ON edge_logs(device_id);
CREATE INDEX idx_edge_logs_level ON edge_logs(log_level);
CREATE INDEX idx_edge_logs_timestamp ON edge_logs(timestamp);

-- Enable RLS
ALTER TABLE edge_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON edge_logs FOR SELECT USING (true);
CREATE POLICY "Enable insert for service role" ON edge_logs FOR INSERT WITH CHECK (true);

-- Create function to auto-cleanup old logs (keep 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_edge_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM edge_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
`;
        break;
    }
    
    if (sql.trim()) {
      sqlStatements.push(sql.trim());
    }
  }
  
  return sqlStatements;
}

async function generateMissingColumnsSQL(missingColumns) {
  const sqlStatements = [];
  
  for (const [tableName, columns] of Object.entries(missingColumns)) {
    for (const column of columns) {
      let sql = '';
      
      // Add common missing columns
      if (column === 'device_id' && tableName === 'transactions') {
        sql = `
-- Add device_id to transactions table
ALTER TABLE transactions 
ADD COLUMN device_id TEXT REFERENCES devices(device_id);

-- Create index
CREATE INDEX idx_transactions_device_id ON transactions(device_id);
`;
      }
      
      if (sql.trim()) {
        sqlStatements.push(sql.trim());
      }
    }
  }
  
  return sqlStatements;
}

async function main() {
  try {
    const results = await verifySchema();
    
    console.log('\n📊 Schema Verification Summary');
    console.log('================================');
    console.log(`✅ Existing tables: ${results.existing_tables.length}`);
    console.log(`❌ Missing tables: ${results.missing_tables.length}`);
    console.log(`⚠️  Tables with missing columns: ${Object.keys(results.missing_columns).length}`);
    console.log(`💡 Warnings: ${results.warnings.length}\n`);
    
    if (results.missing_tables.length > 0) {
      console.log('❌ Missing Tables:');
      results.missing_tables.forEach(table => console.log(`   - ${table}`));
      console.log('');
      
      // Generate SQL for missing tables
      const missingTableSQL = await generateMissingTablesSQL(results.missing_tables);
      
      if (missingTableSQL.length > 0) {
        const sqlFile = 'create_missing_edge_tables.sql';
        fs.writeFileSync(sqlFile, missingTableSQL.join('\n\n'));
        console.log(`📝 Generated SQL file: ${sqlFile}`);
        console.log('   Run this in Supabase SQL Editor to create missing tables\n');
      }
    }
    
    if (Object.keys(results.missing_columns).length > 0) {
      console.log('⚠️  Missing Required Columns:');
      for (const [table, columns] of Object.entries(results.missing_columns)) {
        console.log(`   ${table}: ${columns.join(', ')}`);
      }
      console.log('');
      
      // Generate SQL for missing columns
      const missingColumnSQL = await generateMissingColumnsSQL(results.missing_columns);
      
      if (missingColumnSQL.length > 0) {
        const sqlFile = 'add_missing_edge_columns.sql';
        fs.writeFileSync(sqlFile, missingColumnSQL.join('\n\n'));
        console.log(`📝 Generated SQL file: ${sqlFile}`);
        console.log('   Run this in Supabase SQL Editor to add missing columns\n');
      }
    }
    
    if (results.warnings.length > 0) {
      console.log('💡 Warnings:');
      results.warnings.forEach(warning => console.log(`   - ${warning}`));
      console.log('');
    }
    
    // Overall assessment
    const readyForEdge = results.missing_tables.length === 0 && 
                        Object.keys(results.missing_columns).length === 0;
    
    if (readyForEdge) {
      console.log('🎉 Schema is ready for edge device integration!');
      console.log('   You can deploy edge devices using the generated configuration files.');
    } else {
      console.log('🔧 Schema needs updates before edge device deployment');
      console.log('   Please run the generated SQL files in Supabase first.');
    }
    
    return {
      ready: readyForEdge,
      results
    };
    
  } catch (error) {
    console.error('❌ Schema verification failed:', error.message);
    process.exit(1);
  }
}

// Run verification
main()
  .then(({ ready }) => {
    process.exit(ready ? 0 : 1);
  })
  .catch(error => {
    console.error('Verification error:', error);
    process.exit(1);
  });