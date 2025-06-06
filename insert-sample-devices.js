#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lcoxtanyckjzyxxcsjzz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODM0NTMyNywiZXhwIjoyMDYzOTIxMzI3fQ.42ByHcIAi1jrcpzdvfcMJyE6ibqr81d-rIjsqxL_Bbk'
);

console.log('🚀 Inserting Project Scout sample data...');

// Insert sample devices
const { data: deviceData, error: deviceError } = await supabase
  .from('device_master')
  .upsert([
    {
      device_id: 'Pi5_Store_001_MAC123',
      mac_address: 'AA:BB:CC:DD:EE:01',
      store_id: 1,
      status: 'active',
      firmware_version: 'v2.1.0',
      last_heartbeat: new Date().toISOString(),
      total_transactions_recorded: 1250
    },
    {
      device_id: 'Pi5_Store_002_MAC124', 
      mac_address: 'AA:BB:CC:DD:EE:02',
      store_id: 2,
      status: 'active',
      firmware_version: 'v2.1.0',
      last_heartbeat: new Date(Date.now() - 60000).toISOString(),
      total_transactions_recorded: 890
    },
    {
      device_id: 'Pi5_Store_003_MAC125',
      mac_address: 'AA:BB:CC:DD:EE:03', 
      store_id: 3,
      status: 'maintenance',
      firmware_version: 'v2.0.8',
      last_heartbeat: new Date(Date.now() - 3600000).toISOString(),
      total_transactions_recorded: 456
    }
  ], {
    onConflict: 'device_id'
  });

if (deviceError) {
  console.error('❌ Device insertion error:', deviceError);
} else {
  console.log('✅ Sample devices inserted');
}

// Insert sample health metrics
const { data: healthData, error: healthError } = await supabase
  .from('device_health_metrics')
  .insert([
    {
      device_id: 'Pi5_Store_001_MAC123',
      cpu_usage: 45.2,
      memory_usage: 67.8,
      disk_usage: 23.1,
      temperature: 42.5,
      network_latency_ms: 15,
      audio_input_level: -45.2,
      uptime_seconds: 86400,
      error_count_24h: 0
    },
    {
      device_id: 'Pi5_Store_002_MAC124',
      cpu_usage: 52.1,
      memory_usage: 71.3,
      disk_usage: 28.9,
      temperature: 44.1,
      network_latency_ms: 18,
      audio_input_level: -43.8,
      uptime_seconds: 172800,
      error_count_24h: 1
    },
    {
      device_id: 'Pi5_Store_003_MAC125',
      cpu_usage: 89.7,
      memory_usage: 92.4,
      disk_usage: 78.2,
      temperature: 67.3,
      network_latency_ms: 45,
      audio_input_level: -50.1,
      uptime_seconds: 43200,
      error_count_24h: 5
    }
  ]);

if (healthError) {
  console.error('❌ Health metrics insertion error:', healthError);
} else {
  console.log('✅ Sample health metrics inserted');
}

// Insert sample alerts
const { data: alertData, error: alertError } = await supabase
  .from('device_alerts')
  .insert([
    {
      device_id: 'Pi5_Store_003_MAC125',
      alert_type: 'temperature',
      severity: 'high',
      message: 'Device temperature above normal: 67.3°C',
      status: 'active'
    },
    {
      device_id: 'Pi5_Store_003_MAC125',
      alert_type: 'disk_full',
      severity: 'medium', 
      message: 'Disk usage at 78%',
      status: 'active'
    },
    {
      device_id: 'Pi5_Store_002_MAC124',
      alert_type: 'cpu_high',
      severity: 'low',
      message: 'CPU usage elevated: 52%',
      status: 'active'
    }
  ]);

if (alertError) {
  console.error('❌ Alerts insertion error:', alertError);
} else {
  console.log('✅ Sample alerts inserted');
}

console.log(`
🎯 Project Scout Setup Complete!

Dashboard Features Now Active:
- 3 IoT devices registered and monitoring
- Real-time health metrics tracking  
- Alert system with 3 active alerts
- Device performance analytics

Access your dashboard at:
https://retail-insights-dashboard-ph.vercel.app/project-scout

Key Metrics:
- Device 001: Healthy (42.5°C, CPU 45%)
- Device 002: Good (44.1°C, CPU 52%) 
- Device 003: Needs Attention (67.3°C, CPU 90%)
`);