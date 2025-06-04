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