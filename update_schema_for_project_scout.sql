-- PROJECT SCOUT DEVICE MANAGEMENT SCHEMA UPDATES
-- Implementing the 5 priority deliverables from Project Scout analysis

-- 1. Device Identity Management System (Priority #1)
-- Create devices table with MAC-based unique device IDs
CREATE TABLE IF NOT EXISTS devices (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(20) UNIQUE NOT NULL CHECK (device_id ~ '^PI5_[0-9]{4}_[a-f0-9]{6}$'),
  store_id INTEGER NOT NULL,
  mac_address VARCHAR(17) NOT NULL,
  device_type VARCHAR(50) DEFAULT 'Raspberry Pi 5',
  status VARCHAR(20) DEFAULT 'active',
  installed_date TIMESTAMP DEFAULT NOW(),
  last_heartbeat TIMESTAMP DEFAULT NOW(),
  ram_gb INTEGER,
  storage_gb INTEGER,
  network_type VARCHAR(10),
  monitoring_level VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices(device_id);
CREATE INDEX IF NOT EXISTS idx_devices_store_id ON devices(store_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);

-- 2. Core Health Monitoring Dashboard (Priority #3)
-- Device health monitoring with real-time metrics
CREATE TABLE IF NOT EXISTS device_health (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(20) REFERENCES devices(device_id),
  cpu_usage DECIMAL(5,2),
  memory_usage DECIMAL(5,2),
  storage_usage DECIMAL(5,2),
  network_latency_ms INTEGER,
  temperature_celsius DECIMAL(4,1),
  status VARCHAR(20),
  uptime_hours INTEGER,
  error_count_24h INTEGER DEFAULT 0,
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for health monitoring queries
CREATE INDEX IF NOT EXISTS idx_device_health_device_id ON device_health(device_id);
CREATE INDEX IF NOT EXISTS idx_device_health_recorded_at ON device_health(recorded_at);
CREATE INDEX IF NOT EXISTS idx_device_health_status ON device_health(status);

-- 3. Real-time Data Validation Pipeline (Priority #2)
-- Add validation columns to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS device_id VARCHAR(20),
ADD COLUMN IF NOT EXISTS validation_status VARCHAR(20) DEFAULT 'valid',
ADD COLUMN IF NOT EXISTS data_quality_score DECIMAL(3,2) DEFAULT 1.00;

-- Indexes for validation queries
CREATE INDEX IF NOT EXISTS idx_transactions_device_id ON transactions(device_id);
CREATE INDEX IF NOT EXISTS idx_transactions_validation_status ON transactions(validation_status);
CREATE INDEX IF NOT EXISTS idx_transactions_quality_score ON transactions(data_quality_score);

-- 4. Master Data Registry (Priority #4)
-- Enhanced brands table with TBWA client tracking
ALTER TABLE brands 
ADD COLUMN IF NOT EXISTS is_tbwa BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS client_priority VARCHAR(20) DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT NOW();

-- Enhanced products table with category tracking
ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS monitoring_priority VARCHAR(20) DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT NOW();

-- Enhanced stores table with device tracking
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS has_device BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS device_installation_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS tier INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT NOW();

-- 5. Error Boundary & Monitoring Foundation (Priority #5)
-- System monitoring and error tracking
CREATE TABLE IF NOT EXISTS system_alerts (
  id SERIAL PRIMARY KEY,
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  device_id VARCHAR(20),
  store_id INTEGER,
  message TEXT,
  details JSONB,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- Alert indexes
CREATE INDEX IF NOT EXISTS idx_system_alerts_device_id ON system_alerts(device_id);
CREATE INDEX IF NOT EXISTS idx_system_alerts_severity ON system_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_system_alerts_resolved ON system_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_system_alerts_created_at ON system_alerts(created_at);

-- Data validation functions
CREATE OR REPLACE FUNCTION validate_device_id(device_id_input VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN device_id_input ~ '^PI5_[0-9]{4}_[a-f0-9]{6}$';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_transaction_data()
RETURNS TRIGGER AS $$
DECLARE
  quality_score DECIMAL(3,2) := 1.00;
  validation_status VARCHAR(20) := 'valid';
BEGIN
  -- Validate device ID format
  IF NEW.device_id IS NOT NULL AND NOT validate_device_id(NEW.device_id) THEN
    quality_score := quality_score - 0.3;
    validation_status := 'invalid_device_id';
  END IF;
  
  -- Validate store ID
  IF NEW.store_id IS NULL OR NEW.store_id <= 0 THEN
    quality_score := quality_score - 0.2;
    validation_status := 'invalid_store_id';
  END IF;
  
  -- Validate amount
  IF NEW.total_amount IS NULL OR NEW.total_amount <= 0 THEN
    quality_score := quality_score - 0.3;
    validation_status := 'invalid_amount';
  END IF;
  
  -- Validate timestamp
  IF NEW.created_at IS NULL THEN
    quality_score := quality_score - 0.2;
    validation_status := 'missing_timestamp';
  END IF;
  
  -- Set calculated values
  NEW.data_quality_score := GREATEST(quality_score, 0.0);
  NEW.validation_status := validation_status;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for transaction validation
DROP TRIGGER IF EXISTS trigger_validate_transaction ON transactions;
CREATE TRIGGER trigger_validate_transaction
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION validate_transaction_data();

-- Device health alert function
CREATE OR REPLACE FUNCTION check_device_health()
RETURNS TRIGGER AS $$
BEGIN
  -- Critical CPU usage alert
  IF NEW.cpu_usage > 90 THEN
    INSERT INTO system_alerts (alert_type, severity, device_id, message, details)
    VALUES ('HIGH_CPU_USAGE', 'critical', NEW.device_id, 
            'CPU usage exceeds 90%', 
            jsonb_build_object('cpu_usage', NEW.cpu_usage, 'threshold', 90));
  END IF;
  
  -- High memory usage alert
  IF NEW.memory_usage > 85 THEN
    INSERT INTO system_alerts (alert_type, severity, device_id, message, details)
    VALUES ('HIGH_MEMORY_USAGE', 'warning', NEW.device_id,
            'Memory usage exceeds 85%',
            jsonb_build_object('memory_usage', NEW.memory_usage, 'threshold', 85));
  END IF;
  
  -- High temperature alert
  IF NEW.temperature_celsius > 60 THEN
    INSERT INTO system_alerts (alert_type, severity, device_id, message, details)
    VALUES ('HIGH_TEMPERATURE', 'warning', NEW.device_id,
            'Device temperature is high',
            jsonb_build_object('temperature', NEW.temperature_celsius, 'threshold', 60));
  END IF;
  
  -- Network latency alert
  IF NEW.network_latency_ms > 5000 THEN
    INSERT INTO system_alerts (alert_type, severity, device_id, message, details)
    VALUES ('HIGH_LATENCY', 'warning', NEW.device_id,
            'Network latency is high',
            jsonb_build_object('latency_ms', NEW.network_latency_ms, 'threshold', 5000));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for device health monitoring
DROP TRIGGER IF EXISTS trigger_check_device_health ON device_health;
CREATE TRIGGER trigger_check_device_health
  AFTER INSERT ON device_health
  FOR EACH ROW
  EXECUTE FUNCTION check_device_health();

-- Views for dashboard analytics
CREATE OR REPLACE VIEW device_status_summary AS
SELECT 
  status,
  COUNT(*) as device_count,
  AVG(CASE WHEN last_heartbeat > NOW() - INTERVAL '1 hour' THEN 1 ELSE 0 END) as online_percentage
FROM devices
GROUP BY status;

CREATE OR REPLACE VIEW device_health_latest AS
SELECT DISTINCT ON (dh.device_id)
  dh.device_id,
  d.store_id,
  d.status as device_status,
  dh.cpu_usage,
  dh.memory_usage,
  dh.storage_usage,
  dh.network_latency_ms,
  dh.temperature_celsius,
  dh.status as health_status,
  dh.uptime_hours,
  dh.error_count_24h,
  dh.recorded_at
FROM device_health dh
JOIN devices d ON d.device_id = dh.device_id
ORDER BY dh.device_id, dh.recorded_at DESC;

CREATE OR REPLACE VIEW system_health_overview AS
SELECT
  (SELECT COUNT(*) FROM devices WHERE status = 'active') as active_devices,
  (SELECT COUNT(*) FROM devices WHERE last_heartbeat > NOW() - INTERVAL '1 hour') as online_devices,
  (SELECT COUNT(*) FROM system_alerts WHERE resolved = false AND severity = 'critical') as critical_alerts,
  (SELECT COUNT(*) FROM system_alerts WHERE resolved = false AND severity = 'warning') as warning_alerts,
  (SELECT AVG(data_quality_score) FROM transactions WHERE created_at > NOW() - INTERVAL '24 hours') as avg_data_quality_24h,
  (SELECT COUNT(*) FROM transactions WHERE validation_status != 'valid' AND created_at > NOW() - INTERVAL '24 hours') as validation_errors_24h;

-- TBWA performance analytics view
CREATE OR REPLACE VIEW tbwa_performance_summary AS
SELECT
  b.name as brand_name,
  b.is_tbwa,
  COUNT(ti.id) as transaction_count,
  SUM(ti.quantity * ti.price) as total_revenue,
  AVG(ti.price) as avg_price,
  COUNT(DISTINCT t.store_id) as store_reach
FROM transaction_items ti
JOIN products p ON p.id = ti.product_id
JOIN brands b ON b.id = p.brand_id
JOIN transactions t ON t.id = ti.transaction_id
WHERE t.created_at > NOW() - INTERVAL '30 days'
GROUP BY b.id, b.name, b.is_tbwa
ORDER BY total_revenue DESC;

-- Regional device deployment view
CREATE OR REPLACE VIEW regional_device_deployment AS
SELECT
  CASE 
    WHEN s.location LIKE '%NCR%' THEN 'NCR'
    WHEN s.location LIKE '%Central Luzon%' THEN 'Region III'
    WHEN s.location LIKE '%CALABARZON%' THEN 'Region IV-A'
    WHEN s.location LIKE '%Central Visayas%' THEN 'Region VII'
    WHEN s.location LIKE '%Davao%' THEN 'Region XI'
    ELSE 'Other Regions'
  END as region,
  COUNT(d.id) as device_count,
  COUNT(CASE WHEN d.status = 'active' THEN 1 END) as active_devices,
  AVG(dhl.cpu_usage) as avg_cpu_usage,
  AVG(dhl.memory_usage) as avg_memory_usage
FROM stores s
LEFT JOIN devices d ON d.store_id = s.id
LEFT JOIN device_health_latest dhl ON dhl.device_id = d.device_id
GROUP BY region
ORDER BY device_count DESC;

-- Grant permissions for dashboard access
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- Comments for documentation
COMMENT ON TABLE devices IS 'Project Scout Priority #1: Device Identity Management System with MAC-based unique IDs';
COMMENT ON TABLE device_health IS 'Project Scout Priority #3: Core Health Monitoring Dashboard with real-time metrics';
COMMENT ON TABLE system_alerts IS 'Project Scout Priority #5: Error Boundary & Monitoring Foundation';
COMMENT ON VIEW device_health_latest IS 'Latest health status for each device - optimized for dashboard queries';
COMMENT ON VIEW system_health_overview IS 'System-wide health metrics for executive dashboard';
COMMENT ON VIEW tbwa_performance_summary IS 'TBWA vs competitor performance analytics';

-- Success message
SELECT 
  '🎊 PROJECT SCOUT SCHEMA IMPLEMENTATION COMPLETE!' as status,
  'All 5 priority deliverables have been implemented:' as deliverables,
  '✅ Device Identity Management System' as priority_1,
  '✅ Real-time Data Validation Pipeline' as priority_2, 
  '✅ Core Health Monitoring Dashboard' as priority_3,
  '✅ Master Data Registry' as priority_4,
  '✅ Error Boundary & Monitoring Foundation' as priority_5;