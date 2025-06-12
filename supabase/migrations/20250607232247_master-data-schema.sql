-- Project Scout Master Data Architecture
-- Implementing recommendations from Comprehensive Analysis Report
-- This addresses the critical device collision and data integrity issues

-- =====================================================
-- DEVICE MASTER DATA SYSTEM
-- =====================================================

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

-- Store Master Data Enhancement
CREATE TABLE IF NOT EXISTS store_master_enhanced (
    store_id INT PRIMARY KEY REFERENCES stores(id),
    store_type VARCHAR(50), -- 'sari-sari', 'convenience', 'supermarket'
    size_category VARCHAR(20), -- 'small', 'medium', 'large'
    manager_name VARCHAR(100),
    manager_phone VARCHAR(20),
    manager_email VARCHAR(100),
    operating_hours_start TIME,
    operating_hours_end TIME,
    timezone VARCHAR(50) DEFAULT 'Asia/Manila',
    network_type VARCHAR(20), -- 'wifi', 'cellular', 'hybrid'
    power_backup BOOLEAN DEFAULT FALSE,
    backup_duration_hours INT,
    monthly_avg_transactions INT,
    avg_daily_revenue DECIMAL(10,2),
    peak_hours JSONB, -- Store busy hours data
    installation_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Device Installation Tracking
CREATE TABLE IF NOT EXISTS device_installations (
    installation_id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) REFERENCES device_master(device_id),
    store_id INT REFERENCES stores(id),
    installation_date DATE,
    installer_name VARCHAR(100),
    pre_installation_checklist JSONB,
    installation_photos TEXT[], -- Array of photo URLs
    network_test_results JSONB,
    audio_test_results JSONB,
    post_installation_validation JSONB,
    installation_status VARCHAR(20) DEFAULT 'scheduled' 
        CHECK (installation_status IN ('scheduled', 'in_progress', 'completed', 'failed', 'rescheduled')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- =====================================================
-- SESSION MATCHING & DATA QUALITY
-- =====================================================

-- Session Matching Table - Addresses data integrity issues
CREATE TABLE IF NOT EXISTS session_matches (
    match_id SERIAL PRIMARY KEY,
    interaction_id VARCHAR(255) REFERENCES sales_interactions(interaction_id),
    transcript_id VARCHAR(255),
    detection_id VARCHAR(255),
    match_confidence DECIMAL(4,3) CHECK (match_confidence BETWEEN 0 AND 1),
    time_offset_ms INT,
    match_method VARCHAR(50), -- 'timestamp', 'audio_correlation', 'manual'
    validation_status VARCHAR(20) DEFAULT 'pending' 
        CHECK (validation_status IN ('pending', 'validated', 'rejected', 'needs_review')),
    created_at TIMESTAMP DEFAULT NOW(),
    validated_at TIMESTAMP,
    validated_by VARCHAR(100)
);

-- Transaction Items Enhancement
CREATE TABLE IF NOT EXISTS transaction_items_enhanced (
    item_id SERIAL PRIMARY KEY,
    interaction_id VARCHAR(255) REFERENCES sales_interactions(interaction_id),
    product_id INT,
    brand_id INT,
    product_name VARCHAR(200),
    brand_name VARCHAR(100),
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    confidence_score DECIMAL(4,3),
    detection_method VARCHAR(50), -- 'audio', 'visual', 'manual'
    local_product_term VARCHAR(200), -- Filipino/local terms used
    created_at TIMESTAMP DEFAULT NOW()
);

-- Request Methods Reference (Filipino shopping behavior tracking)
CREATE TABLE IF NOT EXISTS request_methods (
    method_id SERIAL PRIMARY KEY,
    interaction_id VARCHAR(255) REFERENCES sales_interactions(interaction_id),
    request_type VARCHAR(50), -- 'verbal', 'pointing', 'gesture', 'written'
    language_used VARCHAR(20), -- 'tagalog', 'english', 'cebuano', 'mixed'
    local_terms_used TEXT[], -- Array of local terms
    confidence DECIMAL(4,3),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- DEVICE HEALTH MONITORING
-- =====================================================

-- Device Health Metrics
CREATE TABLE IF NOT EXISTS device_health_metrics (
    metric_id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) REFERENCES device_master(device_id),
    timestamp TIMESTAMP DEFAULT NOW(),
    cpu_usage DECIMAL(5,2), -- Percentage
    memory_usage DECIMAL(5,2), -- Percentage
    disk_usage DECIMAL(5,2), -- Percentage
    temperature DECIMAL(5,2), -- Celsius
    network_latency_ms INT,
    audio_input_level DECIMAL(5,2), -- dB
    last_upload_success BOOLEAN,
    error_count_24h INT DEFAULT 0,
    uptime_seconds BIGINT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Device Alerts and Notifications
CREATE TABLE IF NOT EXISTS device_alerts (
    alert_id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) REFERENCES device_master(device_id),
    alert_type VARCHAR(50), -- 'temperature', 'disk_full', 'network_down', 'upload_failed'
    severity VARCHAR(20) DEFAULT 'medium' 
        CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT,
    alert_data JSONB, -- Additional alert context
    status VARCHAR(20) DEFAULT 'active' 
        CHECK (status IN ('active', 'acknowledged', 'resolved')),
    created_at TIMESTAMP DEFAULT NOW(),
    acknowledged_at TIMESTAMP,
    acknowledged_by VARCHAR(100),
    resolved_at TIMESTAMP
);

-- =====================================================
-- SUBSTITUTION TRACKING
-- =====================================================

-- Hierarchical Substitution Events
CREATE TABLE IF NOT EXISTS substitution_events (
    substitution_id SERIAL PRIMARY KEY,
    interaction_id VARCHAR(255) REFERENCES sales_interactions(interaction_id),
    original_request TEXT,
    substitute_offered TEXT,
    substitution_level VARCHAR(20) CHECK (substitution_level IN ('CATEGORY', 'BRAND', 'PRODUCT')),
    original_category VARCHAR(100),
    substitute_category VARCHAR(100),
    original_brand VARCHAR(100),
    substitute_brand VARCHAR(100),
    original_product VARCHAR(200),
    substitute_product VARCHAR(200),
    reason VARCHAR(100), -- 'out_of_stock', 'price_preference', 'customer_choice'
    accepted BOOLEAN,
    customer_response TEXT,
    confidence_score DECIMAL(4,3),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- FILIPINO-SPECIFIC ENHANCEMENTS
-- =====================================================

-- Unbranded Commodities (Local sari-sari store items)
CREATE TABLE IF NOT EXISTS unbranded_commodities (
    commodity_id SERIAL PRIMARY KEY,
    local_name VARCHAR(100), -- 'yelo', 'asin', 'asukal'
    english_name VARCHAR(100), -- 'ice', 'salt', 'sugar'
    category VARCHAR(50),
    typical_unit VARCHAR(20), -- 'pack', 'piece', 'kilo'
    typical_price_range DECIMAL(10,2),
    regional_variations TEXT[], -- Different terms per region
    created_at TIMESTAMP DEFAULT NOW()
);

-- Local Product Terms Mapping
CREATE TABLE IF NOT EXISTS local_product_terms (
    term_id SERIAL PRIMARY KEY,
    local_term VARCHAR(200),
    standard_product VARCHAR(200),
    brand_id INT,
    region VARCHAR(50),
    frequency_count INT DEFAULT 1,
    confidence DECIMAL(4,3),
    created_at TIMESTAMP DEFAULT NOW(),
    last_used TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Device Master Indexes
CREATE INDEX IF NOT EXISTS idx_device_master_store_id ON device_master(store_id);
CREATE INDEX IF NOT EXISTS idx_device_master_status ON device_master(status);
CREATE INDEX IF NOT EXISTS idx_device_master_last_heartbeat ON device_master(last_heartbeat);

-- Health Monitoring Indexes
CREATE INDEX IF NOT EXISTS idx_device_health_device_timestamp ON device_health_metrics(device_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_device_alerts_device_status ON device_alerts(device_id, status);

-- Session Matching Indexes
CREATE INDEX IF NOT EXISTS idx_session_matches_interaction ON session_matches(interaction_id);
CREATE INDEX IF NOT EXISTS idx_session_matches_confidence ON session_matches(match_confidence DESC);

-- Substitution Indexes
CREATE INDEX IF NOT EXISTS idx_substitution_events_interaction ON substitution_events(interaction_id);
CREATE INDEX IF NOT EXISTS idx_substitution_events_level ON substitution_events(substitution_level);

-- =====================================================
-- VIEWS FOR ANALYTICS
-- =====================================================

-- Device Health Summary View
CREATE OR REPLACE VIEW v_device_health_summary AS
SELECT 
    dm.device_id,
    dm.store_id,
    s.name as store_name,
    dm.status,
    dm.last_heartbeat,
    dhm.cpu_usage,
    dhm.memory_usage,
    dhm.disk_usage,
    dhm.temperature,
    dhm.network_latency_ms,
    COUNT(da.alert_id) FILTER (WHERE da.status = 'active') as active_alerts,
    dm.total_transactions_recorded
FROM device_master dm
LEFT JOIN stores s ON dm.store_id = s.id
LEFT JOIN device_health_metrics dhm ON dm.device_id = dhm.device_id 
    AND dhm.timestamp = (
        SELECT MAX(timestamp) 
        FROM device_health_metrics dhm2 
        WHERE dhm2.device_id = dm.device_id
    )
LEFT JOIN device_alerts da ON dm.device_id = da.device_id AND da.status = 'active'
GROUP BY dm.device_id, dm.store_id, s.name, dm.status, dm.last_heartbeat, 
         dhm.cpu_usage, dhm.memory_usage, dhm.disk_usage, dhm.temperature, dhm.network_latency_ms,
         dm.total_transactions_recorded;

-- Substitution Analytics View
CREATE OR REPLACE VIEW v_substitution_analytics AS
SELECT 
    substitution_level,
    original_category,
    substitute_category,
    original_brand,
    substitute_brand,
    reason,
    COUNT(*) as frequency,
    AVG(confidence_score) as avg_confidence,
    SUM(CASE WHEN accepted THEN 1 ELSE 0 END)::FLOAT / COUNT(*) as acceptance_rate
FROM substitution_events
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY substitution_level, original_category, substitute_category, 
         original_brand, substitute_brand, reason
ORDER BY frequency DESC;

-- Store Performance with Device Data
CREATE OR REPLACE VIEW v_store_device_performance AS
SELECT 
    s.id as store_id,
    s.name as store_name,
    s.city,
    s.region,
    COUNT(DISTINCT dm.device_id) as device_count,
    COUNT(DISTINCT CASE WHEN dm.status = 'active' THEN dm.device_id END) as active_devices,
    SUM(dm.total_transactions_recorded) as total_transactions,
    AVG(dhm.cpu_usage) as avg_cpu_usage,
    AVG(dhm.temperature) as avg_temperature,
    COUNT(da.alert_id) FILTER (WHERE da.status = 'active') as active_alerts
FROM stores s
LEFT JOIN device_master dm ON s.id = dm.store_id
LEFT JOIN device_health_metrics dhm ON dm.device_id = dhm.device_id 
    AND dhm.timestamp >= CURRENT_DATE - INTERVAL '1 day'
LEFT JOIN device_alerts da ON dm.device_id = da.device_id AND da.status = 'active'
GROUP BY s.id, s.name, s.city, s.region
ORDER BY total_transactions DESC;

-- =====================================================
-- TRIGGERS FOR DATA INTEGRITY
-- =====================================================

-- Update device last_heartbeat on health metric insert
CREATE OR REPLACE FUNCTION update_device_heartbeat()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE device_master 
    SET last_heartbeat = NEW.timestamp,
        updated_at = NOW()
    WHERE device_id = NEW.device_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_device_heartbeat
    AFTER INSERT ON device_health_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_device_heartbeat();

-- Update transaction count on sales_interactions insert
CREATE OR REPLACE FUNCTION update_device_transaction_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE device_master 
    SET total_transactions_recorded = total_transactions_recorded + 1,
        last_upload = NOW(),
        updated_at = NOW()
    WHERE device_id = NEW.device_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_transaction_count
    AFTER INSERT ON sales_interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_device_transaction_count();