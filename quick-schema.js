#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lcoxtanyckjzyxxcsjzz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODM0NTMyNywiZXhwIjoyMDYzOTIxMzI3fQ.42ByHcIAi1jrcpzdvfcMJyE6ibqr81d-rIjsqxL_Bbk'
);

console.log('🚀 Creating Project Scout tables...');

// Create device_master table
const { error: deviceError } = await supabase.schema('public').from('device_master').select('*').limit(1);

if (deviceError && deviceError.code === 'PGRST116') {
  console.log('📊 Creating device_master table...');
  // Table doesn't exist, we need to create it via SQL editor manually
  console.log(`
✨ Project Scout Database Setup Required

Please run this SQL in Supabase SQL Editor:
https://supabase.com/dashboard/project/lcoxtanyckjzyxxcsjzz/sql

---- COPY BELOW SQL ----

-- Device Master Table
CREATE TABLE IF NOT EXISTS device_master (
    device_id VARCHAR(50) PRIMARY KEY,
    mac_address VARCHAR(17) UNIQUE NOT NULL,
    store_id INT REFERENCES stores(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'maintenance', 'retired')),
    firmware_version VARCHAR(20),
    last_heartbeat TIMESTAMP,
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
    uptime_seconds BIGINT,
    error_count_24h INT DEFAULT 0
);

-- Device Alerts
CREATE TABLE IF NOT EXISTS device_alerts (
    alert_id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) REFERENCES device_master(device_id),
    alert_type VARCHAR(50),
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sample data
INSERT INTO device_master (device_id, mac_address, store_id, status, firmware_version) VALUES
('Pi5_Store_001_MAC123', 'AA:BB:CC:DD:EE:01', 1, 'active', 'v2.1.0'),
('Pi5_Store_002_MAC124', 'AA:BB:CC:DD:EE:02', 2, 'active', 'v2.1.0'),
('Pi5_Store_003_MAC125', 'AA:BB:CC:DD:EE:03', 3, 'maintenance', 'v2.0.8');

-- Sample health metrics
INSERT INTO device_health_metrics (device_id, cpu_usage, memory_usage, disk_usage, temperature, network_latency_ms, audio_input_level, uptime_seconds) VALUES
('Pi5_Store_001_MAC123', 45.2, 67.8, 23.1, 42.5, 15, -45.2, 86400),
('Pi5_Store_002_MAC124', 52.1, 71.3, 28.9, 44.1, 18, -43.8, 172800),
('Pi5_Store_003_MAC125', 89.7, 92.4, 78.2, 67.3, 45, -50.1, 43200);

-- Sample alerts
INSERT INTO device_alerts (device_id, alert_type, severity, message, status) VALUES
('Pi5_Store_003_MAC125', 'temperature', 'high', 'Device temperature above normal: 67.3°C', 'active'),
('Pi5_Store_003_MAC125', 'disk_full', 'medium', 'Disk usage at 78%', 'active');

---- END SQL ----

After running the SQL, the Project Scout dashboard will be fully functional!
  `);
} else {
  console.log('✅ Device tables already exist!');
  
  // Check if we have data
  const { data: devices } = await supabase.from('device_master').select('*').limit(5);
  console.log(`📊 Found ${devices?.length || 0} devices in the system`);
  
  if (devices?.length > 0) {
    console.log('🎯 Project Scout is ready! Check the dashboard at /project-scout');
  }
}