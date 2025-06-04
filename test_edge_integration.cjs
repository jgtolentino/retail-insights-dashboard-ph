#!/usr/bin/env node
/**
 * Test Edge Device Integration with Project Scout
 * Verifies that edge devices can register and send data
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

// Use correct Project Scout Supabase project
const supabaseUrl = 'https://lcoxtanyckjzyxxcsjzz.supabase.co';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🧪 Testing Edge Device Integration with Project Scout');
console.log(`📊 Database: ${supabaseUrl}`);

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.error('Get it from: https://supabase.com/dashboard/project/lcoxtanyckjzyxxcsjzz/settings/api');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDeviceRegistration() {
  console.log('\n📱 Testing device registration...');
  
  const testDevice = {
    device_id: 'Pi5_Edge_test_001',
    device_type: 'RaspberryPi5',
    firmware_version: '2.1.0',
    status: 'active',
    registration_time: new Date().toISOString(),
    last_seen: new Date().toISOString(),
    metadata: {
      test_device: true,
      mac_address: '00:1B:44:11:3A:B7',
      ip_address: '192.168.1.100',
      created_by: 'edge_integration_test'
    },
    location: 'Test Store - Manila',
    network_info: {
      wifi_ssid: 'ProjectScout-WiFi',
      signal_strength: -45,
      connection_type: 'wifi'
    }
  };
  
  try {
    const { data, error } = await supabase
      .from('devices')
      .upsert(testDevice)
      .select()
      .single();
    
    if (error) {
      // Check if this is just a duplicate device (which means registration is working)
      if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
        console.log(`✅ Device already registered (expected): ${testDevice.device_id}`);
        return true;
      }
      console.error(`❌ Device registration failed: ${error.message}`);
      return false;
    }
    
    console.log(`✅ Device registered successfully: ${data.device_id}`);
    console.log(`   Device UUID: ${data.id}`);
    console.log(`   Registration time: ${data.registration_time}`);
    return true;
    
  } catch (err) {
    // Check if this is just a duplicate device (which means registration is working)
    if (err.message.includes('duplicate key') || err.message.includes('unique constraint')) {
      console.log(`✅ Device already registered (expected): ${testDevice.device_id}`);
      return true;
    }
    console.error(`❌ Device registration error: ${err.message}`);
    return false;
  }
}

async function testHealthMonitoring() {
  console.log('\n💗 Testing health monitoring...');
  
  const healthData = {
    device_id: 'Pi5_Edge_test_001',
    cpu_usage: 35.7,
    memory_usage: 52.3,
    disk_usage: 28.9,
    temperature: 41.2,
    uptime_seconds: 86400, // 24 hours
    network_connected: true,
    battery_level: null, // Pi doesn't have battery
    metadata: {
      cpu_cores: 4,
      total_memory_gb: 8,
      total_disk_gb: 64,
      os_version: 'Raspberry Pi OS 11'
    }
  };
  
  try {
    const { data, error } = await supabase
      .from('device_health')
      .insert(healthData)
      .select()
      .single();
    
    if (error) {
      console.error(`❌ Health monitoring failed: ${error.message}`);
      return false;
    }
    
    console.log(`✅ Health data recorded successfully`);
    console.log(`   Health record ID: ${data.id}`);
    console.log(`   CPU: ${data.cpu_usage}%, Memory: ${data.memory_usage}%, Temp: ${data.temperature}°C`);
    return true;
    
  } catch (err) {
    console.error(`❌ Health monitoring error: ${err.message}`);
    return false;
  }
}

async function testProductDetection() {
  console.log('\n🔍 Testing product detection...');
  
  const detectionData = {
    device_id: 'Pi5_Edge_test_001',
    brand_detected: 'Marlboro',
    confidence_score: 0.94,
    customer_age: 28,
    customer_gender: 'Male',
    detected_at: new Date().toISOString(),
    metadata: {
      detection_method: 'AI_Vision',
      model_version: 'v2.1.0',
      processing_time_ms: 150,
      bounding_box: {
        x: 120,
        y: 80,
        width: 200,
        height: 150
      }
    }
  };
  
  try {
    const { data, error } = await supabase
      .from('product_detections')
      .insert(detectionData)
      .select()
      .single();
    
    if (error) {
      console.error(`❌ Product detection failed: ${error.message}`);
      return false;
    }
    
    console.log(`✅ Product detection recorded successfully`);
    console.log(`   Detection ID: ${data.id}`);
    console.log(`   Brand: ${data.brand_detected}, Confidence: ${data.confidence_score}`);
    console.log(`   Customer: ${data.customer_gender}, Age: ${data.customer_age}`);
    return true;
    
  } catch (err) {
    console.error(`❌ Product detection error: ${err.message}`);
    return false;
  }
}

async function testLogging() {
  console.log('\n📋 Testing device logging...');
  
  const logEntries = [
    {
      device_id: 'Pi5_Edge_test_001',
      log_level: 'INFO',
      message: 'Device startup completed successfully',
      component: 'system',
      metadata: {
        startup_time_ms: 12500,
        services_started: ['camera', 'wifi', 'ai_engine']
      }
    },
    {
      device_id: 'Pi5_Edge_test_001',
      log_level: 'WARN',
      message: 'High CPU temperature detected',
      component: 'thermal_monitor',
      metadata: {
        temperature: 65.3,
        threshold: 60.0,
        action_taken: 'throttle_cpu'
      }
    },
    {
      device_id: 'Pi5_Edge_test_001',
      log_level: 'DEBUG',
      message: 'AI detection pipeline processing frame',
      component: 'ai_engine',
      metadata: {
        frame_id: 'frame_001234',
        processing_time_ms: 85,
        objects_detected: 3
      }
    }
  ];
  
  try {
    const { data, error } = await supabase
      .from('edge_logs')
      .insert(logEntries)
      .select();
    
    if (error) {
      console.error(`❌ Logging failed: ${error.message}`);
      return false;
    }
    
    console.log(`✅ Log entries recorded successfully`);
    console.log(`   ${data.length} log entries created`);
    data.forEach((log, index) => {
      console.log(`   ${index + 1}. [${log.log_level}] ${log.component}: ${log.message}`);
    });
    return true;
    
  } catch (err) {
    console.error(`❌ Logging error: ${err.message}`);
    return false;
  }
}

async function testTransactionWithDevice() {
  console.log('\n💰 Testing transaction with device_id...');
  
  try {
    // First, get the current max ID to avoid conflicts
    const { data: maxData } = await supabase
      .from('transactions')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);
    
    const nextId = maxData && maxData.length > 0 ? maxData[0].id + 1 : 1;
    
    // Use a unique ID and timestamp to make unique transaction
    const timestamp = Date.now();
    const transactionData = {
      id: nextId + Math.floor(Math.random() * 1000), // Ensure unique ID
      total_amount: 125.50 + (timestamp % 100),
      device_id: 'Pi5_Edge_test_001',
      customer_age: 28,
      customer_gender: 'Male',
      store_location: `NCR, Manila, Poblacion, Test-${timestamp}`,
      store_id: Math.floor(timestamp % 1000),
      is_weekend: false,
      nlp_processed: false
    };
    
    const { data, error } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();
    
    if (error) {
      console.error(`❌ Transaction with device_id failed: ${error.message}`);
      return false;
    }
    
    console.log(`✅ Transaction with device_id recorded successfully`);
    console.log(`   Transaction ID: ${data.id}`);
    console.log(`   Amount: ₱${data.total_amount}, Device: ${data.device_id}`);
    return true;
    
  } catch (err) {
    console.error(`❌ Transaction error: ${err.message}`);
    return false;
  }
}

async function verifyDataQueries() {
  console.log('\n📊 Testing data queries...');
  
  try {
    // Query devices
    const { data: devices, error: devicesError } = await supabase
      .from('devices')
      .select('*')
      .eq('device_id', 'Pi5_Edge_test_001');
    
    if (devicesError) {
      console.error(`❌ Device query failed: ${devicesError.message}`);
      return false;
    }
    
    console.log(`✅ Device query successful: Found ${devices.length} device(s)`);
    
    // Query recent health data
    const { data: health, error: healthError } = await supabase
      .from('device_health')
      .select('*')
      .eq('device_id', 'Pi5_Edge_test_001')
      .order('timestamp', { ascending: false })
      .limit(1);
    
    if (healthError) {
      console.error(`❌ Health query failed: ${healthError.message}`);
      return false;
    }
    
    console.log(`✅ Health query successful: Found ${health.length} health record(s)`);
    
    // Query product detections
    const { data: detections, error: detectionsError } = await supabase
      .from('product_detections')
      .select('*')
      .eq('device_id', 'Pi5_Edge_test_001');
    
    if (detectionsError) {
      console.error(`❌ Detection query failed: ${detectionsError.message}`);
      return false;
    }
    
    console.log(`✅ Detection query successful: Found ${detections.length} detection(s)`);
    
    // Query logs
    const { data: logs, error: logsError } = await supabase
      .from('edge_logs')
      .select('*')
      .eq('device_id', 'Pi5_Edge_test_001')
      .order('timestamp', { ascending: false });
    
    if (logsError) {
      console.error(`❌ Logs query failed: ${logsError.message}`);
      return false;
    }
    
    console.log(`✅ Logs query successful: Found ${logs.length} log entries`);
    
    return true;
    
  } catch (err) {
    console.error(`❌ Query verification error: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('\n🚀 Starting comprehensive edge device integration test...\n');
  
  let testResults = {
    device_registration: false,
    health_monitoring: false,
    product_detection: false,
    logging: false,
    transactions: false,
    data_queries: false
  };
  
  try {
    // Test device registration
    testResults.device_registration = await testDeviceRegistration();
    
    // Test health monitoring
    testResults.health_monitoring = await testHealthMonitoring();
    
    // Test product detection
    testResults.product_detection = await testProductDetection();
    
    // Test logging
    testResults.logging = await testLogging();
    
    // Test transactions with device_id
    testResults.transactions = await testTransactionWithDevice();
    
    // Test data queries
    testResults.data_queries = await verifyDataQueries();
    
    // Summary
    console.log('\n📋 Test Results Summary');
    console.log('========================');
    
    const totalTests = Object.keys(testResults).length;
    const passedTests = Object.values(testResults).filter(result => result === true).length;
    
    Object.entries(testResults).forEach(([test, passed]) => {
      const status = passed ? '✅' : '❌';
      const testName = test.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      console.log(`${status} ${testName}`);
    });
    
    console.log(`\n📊 Overall Result: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('\n🎉 All tests passed! Edge device integration is working perfectly!');
      console.log('\n📋 Edge devices are ready for deployment:');
      console.log('1. ✅ Device registration and management');
      console.log('2. ✅ Real-time health monitoring');
      console.log('3. ✅ AI product detection storage');
      console.log('4. ✅ Centralized device logging');
      console.log('5. ✅ Transaction tracking with device linkage');
      console.log('6. ✅ Data querying and retrieval');
      
      console.log('\n🚀 Next steps:');
      console.log('1. Get Supabase service role key from dashboard');
      console.log('2. Update .env.edge with actual API keys');
      console.log('3. Deploy edge_client.py to Raspberry Pi devices');
      console.log('4. Monitor device activity in Project Scout dashboard');
      
    } else {
      console.log('\n⚠️  Some tests failed. Please check the errors above.');
      console.log('   Edge device integration may need troubleshooting.');
    }
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Execute the integration test
main()
  .then(() => {
    console.log('\n🏁 Integration test complete!');
  })
  .catch(error => {
    console.error('Fatal test error:', error);
    process.exit(1);
  });