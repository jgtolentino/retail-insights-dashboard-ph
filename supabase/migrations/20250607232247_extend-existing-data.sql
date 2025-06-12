-- Extend Existing 18,000 Records with Additional Data Points
-- Project Scout Full Parity Implementation
-- This adds comprehensive columns to existing data without changing record count

-- =====================================================
-- EXTEND EXISTING TABLES WITH NEW COLUMNS
-- =====================================================

-- Extend transactions table with behavioral and IoT data
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS device_id VARCHAR(50);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS facial_id VARCHAR(100);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS emotional_state VARCHAR(20);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS transcription_text TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS checkout_time DECIMAL(5,2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS request_type VARCHAR(50);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS suggestion_offered BOOLEAN DEFAULT FALSE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS suggestion_accepted BOOLEAN DEFAULT FALSE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS substitution_occurred BOOLEAN DEFAULT FALSE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS audio_quality_score DECIMAL(3,2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS session_confidence DECIMAL(3,2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS local_language_used VARCHAR(20);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS cultural_context JSONB;

-- Extend stores table with enhanced metadata
ALTER TABLE stores ADD COLUMN IF NOT EXISTS store_type VARCHAR(30) DEFAULT 'sari-sari';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS size_category VARCHAR(20) DEFAULT 'small';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS monthly_avg_transactions INT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS avg_daily_revenue DECIMAL(10,2);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS has_iot_device BOOLEAN DEFAULT FALSE;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS network_type VARCHAR(20) DEFAULT 'wifi';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS power_backup BOOLEAN DEFAULT FALSE;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS operating_hours_start TIME DEFAULT '06:00:00';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS operating_hours_end TIME DEFAULT '22:00:00';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS peak_hours JSONB;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS manager_contact VARCHAR(100);

-- Extend customers table with Filipino-specific data
ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(20) DEFAULT 'tagalog';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS family_size INT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS income_bracket VARCHAR(20);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS shopping_frequency VARCHAR(20);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS payment_preference VARCHAR(30);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS loyalty_level VARCHAR(20) DEFAULT 'regular';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS cultural_preferences JSONB;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS regional_dialect VARCHAR(30);

-- Extend brands table with competitive analysis
ALTER TABLE brands ADD COLUMN IF NOT EXISTS market_share_ph DECIMAL(5,2);
ALTER TABLE brands ADD COLUMN IF NOT EXISTS competitor_level VARCHAR(20);
ALTER TABLE brands ADD COLUMN IF NOT EXISTS local_preference_score DECIMAL(3,2);
ALTER TABLE brands ADD COLUMN IF NOT EXISTS price_tier VARCHAR(20);
ALTER TABLE brands ADD COLUMN IF NOT EXISTS cultural_affinity DECIMAL(3,2);
ALTER TABLE brands ADD COLUMN IF NOT EXISTS substitution_likelihood DECIMAL(3,2);

-- Extend products table with detailed metadata
ALTER TABLE products ADD COLUMN IF NOT EXISTS local_name VARCHAR(200);
ALTER TABLE products ADD COLUMN IF NOT EXISTS typical_unit VARCHAR(20);
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_range_min DECIMAL(8,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_range_max DECIMAL(8,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS seasonal_demand JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS cultural_significance VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS substitute_products TEXT[];

-- =====================================================
-- CREATE MISSING ANALYTICS TABLES
-- =====================================================

-- Sales Interactions table (IoT behavioral data)
CREATE TABLE IF NOT EXISTS sales_interactions (
    interaction_id VARCHAR(255) PRIMARY KEY,
    device_id VARCHAR(50),
    store_id INT REFERENCES stores(id),
    transaction_date TIMESTAMP DEFAULT NOW(),
    facial_id VARCHAR(100),
    gender VARCHAR(20),
    age INT,
    emotional_state VARCHAR(20),
    transcription_text TEXT,
    confidence_score DECIMAL(3,2),
    session_duration_seconds INT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Transaction Items Enhanced
CREATE TABLE IF NOT EXISTS transaction_items (
    item_id SERIAL PRIMARY KEY,
    transaction_id INT REFERENCES transactions(id),
    product_id INT REFERENCES products(id),
    brand_id INT REFERENCES brands(id),
    quantity INT DEFAULT 1,
    unit_price DECIMAL(8,2),
    total_price DECIMAL(8,2),
    discount_amount DECIMAL(8,2) DEFAULT 0,
    local_term_used VARCHAR(200),
    request_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Substitutions tracking
CREATE TABLE IF NOT EXISTS substitutions (
    substitution_id SERIAL PRIMARY KEY,
    transaction_id INT REFERENCES transactions(id),
    original_product_id INT REFERENCES products(id),
    substitute_product_id INT REFERENCES products(id),
    reason VARCHAR(100),
    customer_response VARCHAR(20),
    accepted BOOLEAN,
    price_difference DECIMAL(8,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Request Behaviors (Filipino shopping patterns)
CREATE TABLE IF NOT EXISTS request_behaviors (
    behavior_id SERIAL PRIMARY KEY,
    transaction_id INT REFERENCES transactions(id),
    request_type VARCHAR(50),
    language_used VARCHAR(20),
    gesture_type VARCHAR(30),
    politeness_level VARCHAR(20),
    cultural_context TEXT,
    local_terms_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- POPULATE NEW COLUMNS WITH REALISTIC DATA
-- =====================================================

-- Update transactions with IoT and behavioral data
UPDATE transactions SET 
    device_id = CASE 
        WHEN store_id IS NOT NULL THEN 'Pi5_Store' || LPAD(store_id::text, 3, '0') || '_' || 
            SUBSTRING(MD5(id::text), 1, 6) || '_' || 
            EXTRACT(epoch FROM created_at)::text
        ELSE 'Pi5_Device_001'
    END,
    facial_id = 'anon_' || (RANDOM() * 9999)::INT,
    emotional_state = (ARRAY['happy', 'neutral', 'satisfied', 'excited', 'calm'])[FLOOR(RANDOM() * 5) + 1],
    transcription_text = CASE 
        WHEN RANDOM() < 0.3 THEN 'Pabili po ng ' || (SELECT name FROM products WHERE id = (RANDOM() * 100)::INT + 1 LIMIT 1)
        WHEN RANDOM() < 0.6 THEN 'May ' || (SELECT name FROM products WHERE id = (RANDOM() * 100)::INT + 1 LIMIT 1) || ' po kayo?'
        ELSE 'Ito na lang po, salamat'
    END,
    checkout_time = (RANDOM() * 45 + 15)::DECIMAL(5,2),
    request_type = (ARRAY['verbal', 'pointing', 'gesture', 'written', 'mixed'])[FLOOR(RANDOM() * 5) + 1],
    payment_method = (ARRAY['cash', 'gcash', 'paymaya', 'card', 'installment'])[FLOOR(RANDOM() * 5) + 1],
    suggestion_offered = RANDOM() < 0.25,
    suggestion_accepted = CASE WHEN RANDOM() < 0.25 THEN RANDOM() < 0.7 ELSE FALSE END,
    substitution_occurred = RANDOM() < 0.15,
    audio_quality_score = (RANDOM() * 0.4 + 0.6)::DECIMAL(3,2),
    session_confidence = (RANDOM() * 0.3 + 0.7)::DECIMAL(3,2),
    local_language_used = (ARRAY['tagalog', 'english', 'cebuano', 'ilocano', 'mixed'])[FLOOR(RANDOM() * 5) + 1],
    cultural_context = jsonb_build_object(
        'payment_timing', (ARRAY['payday_week', 'mid_month', 'regular', 'holiday_season'])[FLOOR(RANDOM() * 4) + 1],
        'shopping_occasion', (ARRAY['daily_essentials', 'special_occasion', 'bulk_buying', 'emergency'])[FLOOR(RANDOM() * 4) + 1],
        'family_context', (ARRAY['single', 'family_shopping', 'elderly_assistance', 'child_purchase'])[FLOOR(RANDOM() * 4) + 1]
    )
WHERE device_id IS NULL;

-- Update stores with enhanced metadata
UPDATE stores SET 
    store_type = CASE 
        WHEN RANDOM() < 0.7 THEN 'sari-sari'
        WHEN RANDOM() < 0.9 THEN 'convenience'
        ELSE 'mini-mart'
    END,
    size_category = CASE 
        WHEN RANDOM() < 0.6 THEN 'small'
        WHEN RANDOM() < 0.9 THEN 'medium'
        ELSE 'large'
    END,
    monthly_avg_transactions = (RANDOM() * 800 + 200)::INT,
    avg_daily_revenue = (RANDOM() * 5000 + 1000)::DECIMAL(10,2),
    has_iot_device = RANDOM() < 0.3, -- 30% have IoT devices
    network_type = (ARRAY['wifi', 'cellular', 'hybrid'])[FLOOR(RANDOM() * 3) + 1],
    power_backup = RANDOM() < 0.4,
    peak_hours = jsonb_build_object(
        'morning', ARRAY['07:00', '09:00'],
        'lunch', ARRAY['12:00', '14:00'],
        'evening', ARRAY['17:00', '20:00']
    ),
    manager_contact = '+639' || (RANDOM() * 900000000 + 100000000)::BIGINT::TEXT
WHERE store_type IS NULL;

-- Update customers with Filipino-specific data
UPDATE customers SET 
    preferred_language = (ARRAY['tagalog', 'english', 'cebuano', 'ilocano', 'hiligaynon'])[FLOOR(RANDOM() * 5) + 1],
    family_size = (RANDOM() * 6 + 2)::INT,
    income_bracket = CASE 
        WHEN RANDOM() < 0.3 THEN 'low'
        WHEN RANDOM() < 0.8 THEN 'middle'
        ELSE 'high'
    END,
    shopping_frequency = (ARRAY['daily', 'weekly', 'bi-weekly', 'monthly'])[FLOOR(RANDOM() * 4) + 1],
    payment_preference = (ARRAY['cash', 'digital', 'mixed', 'credit'])[FLOOR(RANDOM() * 4) + 1],
    loyalty_level = CASE 
        WHEN RANDOM() < 0.5 THEN 'regular'
        WHEN RANDOM() < 0.8 THEN 'loyal'
        ELSE 'premium'
    END,
    cultural_preferences = jsonb_build_object(
        'local_brands_preference', (RANDOM() * 0.6 + 0.2)::DECIMAL(3,2),
        'price_sensitivity', (RANDOM() * 0.8 + 0.2)::DECIMAL(3,2),
        'convenience_priority', (RANDOM() * 0.7 + 0.3)::DECIMAL(3,2)
    ),
    regional_dialect = (ARRAY['metro_manila', 'cebuano', 'ilocano', 'hiligaynon', 'bicolano'])[FLOOR(RANDOM() * 5) + 1]
WHERE preferred_language IS NULL;

-- Update brands with competitive analysis
UPDATE brands SET 
    market_share_ph = CASE 
        WHEN is_tbwa = true THEN (RANDOM() * 15 + 5)::DECIMAL(5,2)
        ELSE (RANDOM() * 10 + 1)::DECIMAL(5,2)
    END,
    competitor_level = CASE 
        WHEN is_tbwa = true THEN 'primary'
        WHEN RANDOM() < 0.3 THEN 'direct'
        WHEN RANDOM() < 0.7 THEN 'indirect'
        ELSE 'emerging'
    END,
    local_preference_score = (RANDOM() * 0.6 + 0.4)::DECIMAL(3,2),
    price_tier = (ARRAY['budget', 'mid-range', 'premium', 'luxury'])[FLOOR(RANDOM() * 4) + 1],
    cultural_affinity = (RANDOM() * 0.8 + 0.2)::DECIMAL(3,2),
    substitution_likelihood = (RANDOM() * 0.5 + 0.1)::DECIMAL(3,2)
WHERE market_share_ph IS NULL;

-- Update products with detailed metadata
UPDATE products SET 
    local_name = CASE 
        WHEN name ILIKE '%ice%' THEN 'yelo'
        WHEN name ILIKE '%salt%' THEN 'asin'
        WHEN name ILIKE '%sugar%' THEN 'asukal'
        WHEN name ILIKE '%rice%' THEN 'bigas'
        WHEN name ILIKE '%milk%' THEN 'gatas'
        WHEN name ILIKE '%coffee%' THEN 'kape'
        WHEN name ILIKE '%bread%' THEN 'tinapay'
        WHEN name ILIKE '%water%' THEN 'tubig'
        ELSE name
    END,
    typical_unit = (ARRAY['piece', 'pack', 'bottle', 'sachet', 'can', 'box'])[FLOOR(RANDOM() * 6) + 1],
    price_range_min = (RANDOM() * 20 + 5)::DECIMAL(8,2),
    price_range_max = (RANDOM() * 50 + 25)::DECIMAL(8,2),
    seasonal_demand = jsonb_build_object(
        'summer', (RANDOM() * 0.4 + 0.8)::DECIMAL(3,2),
        'rainy', (RANDOM() * 0.4 + 0.6)::DECIMAL(3,2),
        'holiday', (RANDOM() * 0.6 + 1.0)::DECIMAL(3,2)
    ),
    cultural_significance = CASE 
        WHEN name ILIKE '%rice%' THEN 'staple_food'
        WHEN name ILIKE '%coffee%' THEN 'social_drink'
        WHEN name ILIKE '%bread%' THEN 'breakfast_essential'
        ELSE 'convenience_item'
    END
WHERE local_name IS NULL;

-- =====================================================
-- CREATE COMPREHENSIVE VIEWS
-- =====================================================

-- Enhanced Brand Analytics View
CREATE OR REPLACE VIEW v_brand_analytics_enhanced AS
SELECT 
    b.id as brand_id,
    b.name as brand_name,
    b.category,
    b.is_tbwa,
    b.market_share_ph,
    b.competitor_level,
    b.local_preference_score,
    b.price_tier,
    COUNT(DISTINCT t.id) as transaction_count,
    SUM(t.total_amount) as total_revenue,
    AVG(t.total_amount) as avg_transaction_value,
    COUNT(DISTINCT t.customer_id) as unique_customers,
    AVG(t.audio_quality_score) as avg_audio_quality,
    COUNT(CASE WHEN t.suggestion_offered THEN 1 END) as suggestions_offered,
    COUNT(CASE WHEN t.suggestion_accepted THEN 1 END) as suggestions_accepted,
    COUNT(CASE WHEN t.substitution_occurred THEN 1 END) as substitutions_occurred,
    STRING_AGG(DISTINCT t.local_language_used, ', ') as languages_used
FROM brands b
LEFT JOIN transaction_items ti ON b.id = ti.brand_id
LEFT JOIN transactions t ON ti.transaction_id = t.id
GROUP BY b.id, b.name, b.category, b.is_tbwa, b.market_share_ph, 
         b.competitor_level, b.local_preference_score, b.price_tier
ORDER BY total_revenue DESC NULLS LAST;

-- Filipino Consumer Behavior View
CREATE OR REPLACE VIEW v_filipino_consumer_behavior AS
SELECT 
    c.region,
    c.preferred_language,
    c.family_size,
    c.income_bracket,
    c.shopping_frequency,
    c.payment_preference,
    COUNT(DISTINCT c.id) as customer_count,
    AVG(t.total_amount) as avg_spending,
    STRING_AGG(DISTINCT t.payment_method, ', ') as payment_methods_used,
    AVG((c.cultural_preferences->>'local_brands_preference')::DECIMAL) as local_brand_preference,
    AVG((c.cultural_preferences->>'price_sensitivity')::DECIMAL) as price_sensitivity,
    COUNT(CASE WHEN t.suggestion_accepted THEN 1 END) as suggestions_accepted,
    COUNT(CASE WHEN t.substitution_occurred THEN 1 END) as substitutions_made
FROM customers c
LEFT JOIN transactions t ON c.id = t.customer_id
GROUP BY c.region, c.preferred_language, c.family_size, c.income_bracket, 
         c.shopping_frequency, c.payment_preference;

-- Store Performance with IoT Data
CREATE OR REPLACE VIEW v_store_performance_iot AS
SELECT 
    s.id as store_id,
    s.name as store_name,
    s.city,
    s.region,
    s.store_type,
    s.size_category,
    s.has_iot_device,
    s.network_type,
    COUNT(DISTINCT t.id) as total_transactions,
    SUM(t.total_amount) as total_revenue,
    AVG(t.total_amount) as avg_transaction_value,
    COUNT(DISTINCT t.customer_id) as unique_customers,
    AVG(t.checkout_time) as avg_checkout_time,
    AVG(t.audio_quality_score) as avg_audio_quality,
    COUNT(CASE WHEN t.suggestion_offered THEN 1 END) as suggestions_offered,
    COUNT(CASE WHEN t.suggestion_accepted THEN 1 END) as suggestions_accepted,
    (COUNT(CASE WHEN t.suggestion_accepted THEN 1 END)::DECIMAL / 
     NULLIF(COUNT(CASE WHEN t.suggestion_offered THEN 1 END), 0) * 100) as suggestion_acceptance_rate,
    COUNT(CASE WHEN t.substitution_occurred THEN 1 END) as substitutions_occurred,
    STRING_AGG(DISTINCT t.device_id, ', ') as device_ids
FROM stores s
LEFT JOIN transactions t ON s.id = t.store_id
GROUP BY s.id, s.name, s.city, s.region, s.store_type, s.size_category, 
         s.has_iot_device, s.network_type
ORDER BY total_revenue DESC;

-- Device Performance Analytics
CREATE OR REPLACE VIEW v_device_performance AS
SELECT 
    t.device_id,
    s.name as store_name,
    s.city,
    s.region,
    COUNT(*) as transaction_count,
    AVG(t.audio_quality_score) as avg_audio_quality,
    AVG(t.session_confidence) as avg_session_confidence,
    AVG(t.checkout_time) as avg_checkout_time,
    COUNT(CASE WHEN t.suggestion_offered THEN 1 END) as suggestions_offered,
    COUNT(CASE WHEN t.suggestion_accepted THEN 1 END) as suggestions_accepted,
    COUNT(CASE WHEN t.substitution_occurred THEN 1 END) as substitutions_occurred,
    STRING_AGG(DISTINCT t.local_language_used, ', ') as languages_detected,
    MIN(t.created_at) as first_transaction,
    MAX(t.created_at) as last_transaction
FROM transactions t
LEFT JOIN stores s ON t.store_id = s.id
WHERE t.device_id IS NOT NULL
GROUP BY t.device_id, s.name, s.city, s.region
ORDER BY transaction_count DESC;

-- =====================================================
-- CREATE ADVANCED RPC FUNCTIONS
-- =====================================================

-- Get substitution patterns
CREATE OR REPLACE FUNCTION get_substitution_patterns(
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL,
    p_store_id INT DEFAULT NULL
)
RETURNS TABLE(
    original_product VARCHAR,
    substitute_product VARCHAR,
    original_brand VARCHAR,
    substitute_brand VARCHAR,
    frequency BIGINT,
    acceptance_rate DECIMAL,
    avg_price_difference DECIMAL,
    category VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        op.name as original_product,
        sp.name as substitute_product,
        ob.name as original_brand,
        sb.name as substitute_brand,
        COUNT(*) as frequency,
        (COUNT(CASE WHEN sub.accepted THEN 1 END)::DECIMAL / COUNT(*) * 100) as acceptance_rate,
        AVG(sub.price_difference) as avg_price_difference,
        ob.category
    FROM substitutions sub
    JOIN products op ON sub.original_product_id = op.id
    JOIN products sp ON sub.substitute_product_id = sp.id
    JOIN brands ob ON op.brand_id = ob.id
    JOIN brands sb ON sp.brand_id = sb.id
    JOIN transactions t ON sub.transaction_id = t.id
    WHERE 
        (p_start_date IS NULL OR t.created_at::date >= p_start_date) AND
        (p_end_date IS NULL OR t.created_at::date <= p_end_date) AND
        (p_store_id IS NULL OR t.store_id = p_store_id)
    GROUP BY op.name, sp.name, ob.name, sb.name, ob.category
    ORDER BY frequency DESC;
END;
$$ LANGUAGE plpgsql;

-- Get behavioral insights
CREATE OR REPLACE FUNCTION get_behavioral_insights(
    p_language VARCHAR DEFAULT NULL,
    p_region VARCHAR DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'language_distribution', (
            SELECT json_agg(
                json_build_object(
                    'language', local_language_used,
                    'transaction_count', COUNT(*),
                    'avg_checkout_time', AVG(checkout_time),
                    'suggestion_acceptance_rate', 
                    (COUNT(CASE WHEN suggestion_accepted THEN 1 END)::DECIMAL / 
                     NULLIF(COUNT(CASE WHEN suggestion_offered THEN 1 END), 0) * 100)
                )
            )
            FROM transactions t
            JOIN stores s ON t.store_id = s.id
            WHERE 
                (p_region IS NULL OR s.region = p_region) AND
                t.local_language_used IS NOT NULL
            GROUP BY local_language_used
            ORDER BY COUNT(*) DESC
        ),
        'request_patterns', (
            SELECT json_agg(
                json_build_object(
                    'request_type', request_type,
                    'frequency', COUNT(*),
                    'avg_success_rate', AVG(CASE WHEN suggestion_accepted THEN 1.0 ELSE 0.0 END)
                )
            )
            FROM transactions t
            JOIN stores s ON t.store_id = s.id
            WHERE 
                (p_region IS NULL OR s.region = p_region) AND
                request_type IS NOT NULL
            GROUP BY request_type
        ),
        'cultural_context', (
            SELECT json_agg(
                json_build_object(
                    'context', cultural_context->>'shopping_occasion',
                    'frequency', COUNT(*),
                    'avg_amount', AVG(total_amount)
                )
            )
            FROM transactions t
            JOIN stores s ON t.store_id = s.id
            WHERE 
                (p_region IS NULL OR s.region = p_region) AND
                cultural_context IS NOT NULL
            GROUP BY cultural_context->>'shopping_occasion'
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes on new columns
CREATE INDEX IF NOT EXISTS idx_transactions_device_id ON transactions(device_id);
CREATE INDEX IF NOT EXISTS idx_transactions_emotional_state ON transactions(emotional_state);
CREATE INDEX IF NOT EXISTS idx_transactions_local_language ON transactions(local_language_used);
CREATE INDEX IF NOT EXISTS idx_transactions_suggestion_offered ON transactions(suggestion_offered);
CREATE INDEX IF NOT EXISTS idx_transactions_substitution ON transactions(substitution_occurred);
CREATE INDEX IF NOT EXISTS idx_stores_iot_device ON stores(has_iot_device);
CREATE INDEX IF NOT EXISTS idx_stores_store_type ON stores(store_type);
CREATE INDEX IF NOT EXISTS idx_customers_preferred_language ON customers(preferred_language);
CREATE INDEX IF NOT EXISTS idx_customers_income_bracket ON customers(income_bracket);
CREATE INDEX IF NOT EXISTS idx_brands_competitor_level ON brands(competitor_level);
CREATE INDEX IF NOT EXISTS idx_brands_price_tier ON brands(price_tier);

-- =====================================================
-- SUMMARY STATISTICS
-- =====================================================

-- Show summary of data enhancement
DO $$
DECLARE
    transaction_count INT;
    enhanced_transactions INT;
    iot_stores INT;
    total_stores INT;
BEGIN
    SELECT COUNT(*) INTO transaction_count FROM transactions;
    SELECT COUNT(*) INTO enhanced_transactions FROM transactions WHERE device_id IS NOT NULL;
    SELECT COUNT(*) INTO iot_stores FROM stores WHERE has_iot_device = true;
    SELECT COUNT(*) INTO total_stores FROM stores;
    
    RAISE NOTICE '========================';
    RAISE NOTICE 'DATA ENHANCEMENT SUMMARY';
    RAISE NOTICE '========================';
    RAISE NOTICE 'Total Transactions: %', transaction_count;
    RAISE NOTICE 'Enhanced with IoT Data: %', enhanced_transactions;
    RAISE NOTICE 'Stores with IoT Devices: % of %', iot_stores, total_stores;
    RAISE NOTICE 'Enhancement Coverage: %%%', (enhanced_transactions::DECIMAL / transaction_count * 100)::INT;
END $$;