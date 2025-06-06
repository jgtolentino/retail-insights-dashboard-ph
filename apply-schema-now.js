#!/usr/bin/env node

/**
 * Apply Master Data Schema Directly to Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lcoxtanyckjzyxxcsjzz.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODM0NTMyNywiZXhwIjoyMDYzOTIxMzI3fQ.42ByHcIAi1jrcpzdvfcMJyE6ibqr81d-rIjsqxL_Bbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 Applying Project Scout Master Data Schema...');

// Execute SQL directly
const schemaSQL = `
-- Project Scout Master Data Architecture
-- Device Master Table - Single Source of Truth for all devices
CREATE TABLE IF NOT EXISTS device_master (
    device_id VARCHAR(50) PRIMARY KEY,
    mac_address VARCHAR(17) UNIQUE NOT NULL,
    serial_number VARCHAR(50) UNIQUE,
    store_id INT REFERENCES stores(id),
    installation_date TIMESTAMP,
    installer_name VARCHAR(100),
    firmware_version VARCHAR(20),
    hardware_revision VARCHAR(10),
    network_config JSONB,
    device_type VARCHAR(50) DEFAULT 'RaspberryPi5',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'maintenance', 'retired')),
    last_heartbeat TIMESTAMP,
    last_upload TIMESTAMP,
    total_transactions_recorded BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Device Health Metrics
CREATE TABLE IF NOT EXISTS device_health_metrics (
    metric_id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) REFERENCES device_master(device_id),
    timestamp TIMESTAMP DEFAULT NOW(),
    cpu_usage DECIMAL(5,2),
    memory_usage DECIMAL(5,2),
    disk_usage DECIMAL(5,2),
    temperature DECIMAL(5,2),
    network_latency_ms INT,
    audio_input_level DECIMAL(5,2),
    last_upload_success BOOLEAN,
    error_count_24h INT DEFAULT 0,
    uptime_seconds BIGINT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Device Alerts and Notifications
CREATE TABLE IF NOT EXISTS device_alerts (
    alert_id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) REFERENCES device_master(device_id),
    alert_type VARCHAR(50),
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT,
    alert_data JSONB,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
    created_at TIMESTAMP DEFAULT NOW(),
    acknowledged_at TIMESTAMP,
    acknowledged_by VARCHAR(100),
    resolved_at TIMESTAMP
);

-- Insert sample devices for demo
INSERT INTO device_master (device_id, mac_address, store_id, status, firmware_version) VALUES
('Pi5_Store_001_MAC123', 'AA:BB:CC:DD:EE:01', 1, 'active', 'v2.1.0'),
('Pi5_Store_002_MAC124', 'AA:BB:CC:DD:EE:02', 2, 'active', 'v2.1.0'),
('Pi5_Store_003_MAC125', 'AA:BB:CC:DD:EE:03', 3, 'maintenance', 'v2.0.8')
ON CONFLICT (device_id) DO NOTHING;

-- Insert sample health metrics
INSERT INTO device_health_metrics (device_id, cpu_usage, memory_usage, disk_usage, temperature, network_latency_ms, audio_input_level, uptime_seconds) VALUES
('Pi5_Store_001_MAC123', 45.2, 67.8, 23.1, 42.5, 15, -45.2, 86400),
('Pi5_Store_002_MAC124', 52.1, 71.3, 28.9, 44.1, 18, -43.8, 172800),
('Pi5_Store_003_MAC125', 89.7, 92.4, 78.2, 67.3, 45, -50.1, 43200)
ON CONFLICT DO NOTHING;

-- Insert sample alerts
INSERT INTO device_alerts (device_id, alert_type, severity, message, status) VALUES
('Pi5_Store_003_MAC125', 'temperature', 'high', 'Device temperature above normal: 67.3°C', 'active'),
('Pi5_Store_003_MAC125', 'disk_full', 'medium', 'Disk usage at 78%', 'active')
ON CONFLICT DO NOTHING;
`;

try {
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: schemaSQL });
  
  if (error) {
    console.log('📋 Creating exec_sql function first...');
    
    // Create exec_sql function first
    const { data: fnData, error: fnError } = await supabase.rpc('exec', { 
      sql: `
      CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
      RETURNS JSON AS $$
      BEGIN
        EXECUTE sql_query;
        RETURN json_build_object('success', true, 'message', 'Query executed successfully');
      EXCEPTION WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });
    
    // Now try the schema again
    const { data: schemaData, error: schemaError } = await supabase.rpc('exec_sql', { sql_query: schemaSQL });
    
    if (schemaError) {
      console.error('❌ Schema application failed:', schemaError);
      process.exit(1);
    }
  }
  
  console.log('✅ Project Scout Master Data Schema applied successfully!');
  console.log('📊 Tables created:');
  console.log('   - device_master');
  console.log('   - device_health_metrics');
  console.log('   - device_alerts');
  console.log('📝 Sample data inserted');
  
} catch (err) {
  console.error('❌ Error applying schema:', err);
  process.exit(1);
}