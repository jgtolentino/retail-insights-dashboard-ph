-- 🇵🇭 COMPREHENSIVE PHILIPPINE RETAIL DATA GENERATION
-- Date Range: June 1, 2024 - May 31, 2025 (12 months)
-- Hierarchical: Region → Province → City/Municipality → Barangay → Store

-- =====================================================
-- STEP 1: CREATE HIERARCHICAL LOCATION STRUCTURE
-- =====================================================

-- Create location hierarchy table if not exists
CREATE TABLE IF NOT EXISTS location_hierarchy (
    id SERIAL PRIMARY KEY,
    region VARCHAR(100),
    province VARCHAR(100),
    city_municipality VARCHAR(100),
    barangay VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    population INTEGER,
    urban_rural VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert real Philippine locations with barangays
INSERT INTO location_hierarchy (region, province, city_municipality, barangay, latitude, longitude, population, urban_rural) VALUES
-- NCR (National Capital Region)
('NCR', 'Metro Manila', 'Manila', 'Ermita', 14.5885, 120.9830, 7466, 'urban'),
('NCR', 'Metro Manila', 'Manila', 'Malate', 14.5747, 120.9850, 78130, 'urban'),
('NCR', 'Metro Manila', 'Manila', 'Paco', 14.5783, 121.0070, 71459, 'urban'),
('NCR', 'Metro Manila', 'Manila', 'Pandacan', 14.5936, 121.0052, 84716, 'urban'),
('NCR', 'Metro Manila', 'Manila', 'Sampaloc', 14.6126, 120.9960, 241528, 'urban'),
('NCR', 'Metro Manila', 'Quezon City', 'Diliman', 14.6507, 121.0494, 78000, 'urban'),
('NCR', 'Metro Manila', 'Quezon City', 'Cubao', 14.6177, 121.0521, 65000, 'urban'),
('NCR', 'Metro Manila', 'Quezon City', 'Commonwealth', 14.6852, 121.0946, 198000, 'urban'),
('NCR', 'Metro Manila', 'Makati', 'Poblacion', 14.5654, 121.0311, 21000, 'urban'),
('NCR', 'Metro Manila', 'Makati', 'Bel-Air', 14.5616, 121.0245, 8000, 'urban'),
('NCR', 'Metro Manila', 'Pasig', 'Kapitolyo', 14.5745, 121.0689, 32000, 'urban'),
('NCR', 'Metro Manila', 'Taguig', 'BGC', 14.5469, 121.0505, 45000, 'urban'),

-- Region I (Ilocos Region)
('Region I', 'Ilocos Norte', 'Laoag City', 'Brgy. 1 San Lorenzo', 18.1987, 120.5947, 4200, 'urban'),
('Region I', 'Ilocos Norte', 'Laoag City', 'Brgy. 30 Suyo', 18.1825, 120.5940, 3800, 'urban'),
('Region I', 'Ilocos Sur', 'Vigan City', 'Barangay I (Poblacion)', 17.5747, 120.3896, 3500, 'urban'),
('Region I', 'La Union', 'San Fernando City', 'Parian', 16.6158, 120.3176, 8900, 'urban'),
('Region I', 'Pangasinan', 'Dagupan City', 'Poblacion Oeste', 16.0433, 120.3330, 12000, 'urban'),

-- Region II (Cagayan Valley)
('Region II', 'Cagayan', 'Tuguegarao City', 'Centro 1 (Poblacion)', 17.6189, 121.7270, 9500, 'urban'),
('Region II', 'Cagayan', 'Tuguegarao City', 'Ugac Norte', 17.6324, 121.7370, 7200, 'urban'),
('Region II', 'Isabela', 'Ilagan City', 'Baligatan', 17.1486, 121.8893, 5600, 'urban'),
('Region II', 'Nueva Vizcaya', 'Bayombong', 'Poblacion', 16.4824, 121.1498, 4300, 'urban'),

-- Region III (Central Luzon)
('Region III', 'Bulacan', 'Malolos City', 'Atlag', 14.8433, 120.8103, 11000, 'urban'),
('Region III', 'Bulacan', 'Meycauayan City', 'Poblacion', 14.7368, 120.9607, 15000, 'urban'),
('Region III', 'Nueva Ecija', 'Cabanatuan City', 'Sumacab Este', 15.4865, 120.9663, 13000, 'urban'),
('Region III', 'Pampanga', 'Angeles City', 'Balibago', 15.1627, 120.5887, 28000, 'urban'),
('Region III', 'Pampanga', 'San Fernando City', 'Dolores', 15.0286, 120.6935, 12000, 'urban'),
('Region III', 'Tarlac', 'Tarlac City', 'San Nicolas', 15.4802, 120.5908, 9800, 'urban'),
('Region III', 'Zambales', 'Olongapo City', 'Barretto', 14.8245, 120.2715, 16000, 'urban'),

-- Region IV-A (CALABARZON)
('Region IV-A', 'Batangas', 'Batangas City', 'Poblacion 1', 13.7565, 121.0583, 8900, 'urban'),
('Region IV-A', 'Batangas', 'Lipa City', 'Marawoy', 13.9414, 121.1634, 11000, 'urban'),
('Region IV-A', 'Cavite', 'Dasmariñas City', 'Zone 1-A', 14.3270, 120.9385, 18000, 'urban'),
('Region IV-A', 'Cavite', 'Imus City', 'Poblacion I-A', 14.4296, 120.9365, 22000, 'urban'),
('Region IV-A', 'Laguna', 'Calamba City', 'Real', 14.2115, 121.1653, 19000, 'urban'),
('Region IV-A', 'Laguna', 'San Pedro City', 'Poblacion', 14.3595, 121.0473, 21000, 'urban'),
('Region IV-A', 'Quezon', 'Lucena City', 'Ibabang Dupay', 13.9373, 121.6180, 15000, 'urban'),
('Region IV-A', 'Rizal', 'Antipolo City', 'Dela Paz', 14.5864, 121.1761, 25000, 'urban'),

-- Region V (Bicol Region)
('Region V', 'Albay', 'Legazpi City', 'Sagpon', 13.1391, 123.7438, 9200, 'urban'),
('Region V', 'Camarines Norte', 'Daet', 'Lag-on', 14.1122, 122.9553, 5400, 'urban'),
('Region V', 'Camarines Sur', 'Naga City', 'Concepcion Pequeña', 13.6192, 123.1814, 11000, 'urban'),
('Region V', 'Sorsogon', 'Sorsogon City', 'Sirangan', 12.9742, 124.0046, 7800, 'urban'),

-- Region VI (Western Visayas)
('Region VI', 'Aklan', 'Kalibo', 'Poblacion', 11.7074, 122.3674, 12000, 'urban'),
('Region VI', 'Iloilo', 'Iloilo City', 'City Proper', 10.6969, 122.5644, 16000, 'urban'),
('Region VI', 'Iloilo', 'Iloilo City', 'Jaro', 10.7202, 122.5621, 23000, 'urban'),
('Region VI', 'Negros Occidental', 'Bacolod City', 'Barangay 12', 10.6769, 122.9509, 14000, 'urban'),
('Region VI', 'Negros Occidental', 'Bacolod City', 'Mandalagan', 10.6970, 122.9619, 19000, 'urban'),

-- Region VII (Central Visayas)
('Region VII', 'Cebu', 'Cebu City', 'Lahug', 10.3321, 123.8956, 22000, 'urban'),
('Region VII', 'Cebu', 'Cebu City', 'IT Park', 10.3279, 123.9052, 18000, 'urban'),
('Region VII', 'Cebu', 'Mandaue City', 'Centro', 10.3236, 123.9223, 16000, 'urban'),
('Region VII', 'Cebu', 'Lapu-Lapu City', 'Poblacion', 10.3103, 123.9494, 14000, 'urban'),
('Region VII', 'Bohol', 'Tagbilaran City', 'Cogon', 9.6501, 123.8538, 9800, 'urban'),

-- Region VIII (Eastern Visayas)
('Region VIII', 'Leyte', 'Tacloban City', 'Downtown', 11.2444, 125.0038, 13000, 'urban'),
('Region VIII', 'Leyte', 'Ormoc City', 'Cogon', 11.0059, 124.6075, 8700, 'urban'),
('Region VIII', 'Samar', 'Catbalogan City', 'Purok 1', 11.7750, 124.8856, 6500, 'urban'),

-- Region IX (Zamboanga Peninsula)
('Region IX', 'Zamboanga del Sur', 'Pagadian City', 'Balangasan', 7.8257, 123.4369, 11000, 'urban'),
('Region IX', 'Zamboanga City', 'Zamboanga City', 'Zone IV', 6.9101, 122.0738, 18000, 'urban'),

-- Region X (Northern Mindanao)
('Region X', 'Misamis Oriental', 'Cagayan de Oro City', 'Divisoria', 8.4822, 124.6472, 21000, 'urban'),
('Region X', 'Misamis Oriental', 'Cagayan de Oro City', 'Cogon', 8.4543, 124.6310, 17000, 'urban'),
('Region X', 'Misamis Occidental', 'Ozamiz City', 'Baybay San Roque', 8.1462, 123.8414, 9300, 'urban'),
('Region X', 'Bukidnon', 'Malaybalay City', 'Casisang', 8.1575, 125.1276, 7600, 'urban'),

-- Region XI (Davao Region)
('Region XI', 'Davao del Sur', 'Davao City', 'Poblacion District', 7.0909, 125.6087, 28000, 'urban'),
('Region XI', 'Davao del Sur', 'Davao City', 'Buhangin', 7.1094, 125.6285, 19000, 'urban'),
('Region XI', 'Davao del Sur', 'Davao City', 'Agdao', 7.0819, 125.6169, 22000, 'urban'),
('Region XI', 'Davao del Sur', 'Digos City', 'Zone 1', 6.7496, 125.3572, 11000, 'urban'),

-- Region XII (SOCCSKSARGEN)
('Region XII', 'South Cotabato', 'General Santos City', 'Poblacion', 6.1108, 125.1716, 17000, 'urban'),
('Region XII', 'South Cotabato', 'Koronadal City', 'Zone III', 6.5022, 124.8430, 12000, 'urban'),
('Region XII', 'Sultan Kudarat', 'Tacurong City', 'New Isabela', 6.6931, 124.6756, 8900, 'urban'),

-- Region XIII (Caraga)
('Region XIII', 'Agusan del Norte', 'Butuan City', 'Libertad', 8.9495, 125.5406, 14000, 'urban'),
('Region XIII', 'Surigao del Norte', 'Surigao City', 'Washington', 9.7838, 125.4887, 9200, 'urban'),

-- BARMM (Bangsamoro Autonomous Region)
('BARMM', 'Maguindanao', 'Cotabato City', 'Poblacion 1', 7.2239, 124.2486, 13000, 'urban'),
('BARMM', 'Lanao del Sur', 'Marawi City', 'Poblacion', 7.9986, 124.2928, 8700, 'urban'),

-- CAR (Cordillera Administrative Region)
('CAR', 'Benguet', 'Baguio City', 'Session Road Area', 16.4123, 120.5940, 23000, 'urban'),
('CAR', 'Benguet', 'Baguio City', 'Burnham Park Area', 16.4115, 120.5963, 18000, 'urban'),
('CAR', 'Benguet', 'La Trinidad', 'Poblacion', 16.4611, 120.5878, 11000, 'urban')
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 2: GENERATE STORES WITH HIERARCHICAL LOCATIONS
-- =====================================================

-- Function to generate stores with proper location hierarchy
CREATE OR REPLACE FUNCTION generate_hierarchical_stores()
RETURNS VOID AS $$
DECLARE
    v_location RECORD;
    v_store_count INT;
    v_store_name TEXT;
    i INT;
BEGIN
    -- For each barangay, create 1-3 stores
    FOR v_location IN 
        SELECT * FROM location_hierarchy 
        ORDER BY region, province, city_municipality, barangay
    LOOP
        -- Urban areas get more stores
        v_store_count := CASE 
            WHEN v_location.urban_rural = 'urban' AND v_location.population > 20000 THEN 3
            WHEN v_location.urban_rural = 'urban' THEN 2
            ELSE 1
        END;
        
        -- Generate stores for this barangay
        FOR i IN 1..v_store_count LOOP
            v_store_name := CASE i
                WHEN 1 THEN v_location.barangay || ' Sari-Sari Store'
                WHEN 2 THEN 'Tindahan ni Ate ' || LEFT(v_location.barangay, 3)
                WHEN 3 THEN v_location.barangay || ' Mini Mart'
            END;
            
            INSERT INTO stores (
                name,
                location,
                region,
                province,
                city,
                barangay,
                latitude,
                longitude,
                store_type,
                created_at
            ) VALUES (
                v_store_name,
                v_location.barangay || ', ' || v_location.city_municipality,
                v_location.region,
                v_location.province,
                v_location.city_municipality,
                v_location.barangay,
                v_location.latitude + (RANDOM() - 0.5) * 0.01, -- Slight variation
                v_location.longitude + (RANDOM() - 0.5) * 0.01,
                CASE 
                    WHEN i = 3 THEN 'mini_mart'
                    WHEN v_location.urban_rural = 'urban' THEN 'urban_sari_sari'
                    ELSE 'rural_sari_sari'
                END,
                NOW() - INTERVAL '400 days'
            );
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute store generation if stores table is empty
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM stores LIMIT 1) THEN
        -- Add necessary columns to stores table
        ALTER TABLE stores 
        ADD COLUMN IF NOT EXISTS region VARCHAR(100),
        ADD COLUMN IF NOT EXISTS province VARCHAR(100),
        ADD COLUMN IF NOT EXISTS city VARCHAR(100),
        ADD COLUMN IF NOT EXISTS barangay VARCHAR(100),
        ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
        ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
        ADD COLUMN IF NOT EXISTS store_type VARCHAR(50);
        
        -- Generate stores
        PERFORM generate_hierarchical_stores();
    END IF;
END $$;

-- =====================================================
-- STEP 3: GENERATE TRANSACTIONS (June 2024 - May 2025)
-- =====================================================

CREATE OR REPLACE FUNCTION generate_philippine_transactions(
    p_start_date DATE DEFAULT '2024-06-01',
    p_end_date DATE DEFAULT '2025-05-31',
    p_transaction_count INT DEFAULT 50000
)
RETURNS TABLE (
    status TEXT,
    transactions_created INT,
    date_range TEXT
) AS $$
DECLARE
    v_store_id INT;
    v_customer_age INT;
    v_customer_gender VARCHAR(10);
    v_transaction_date TIMESTAMPTZ;
    v_transaction_id INT;
    v_basket_size INT;
    v_product_id INT;
    v_quantity INT;
    v_total_amount DECIMAL(10,2);
    v_hour INT;
    v_day_of_week INT;
    v_transcription TEXT;
    v_store_count INT;
    v_stores INT[];
    i INT;
    j INT;
BEGIN
    -- Get all store IDs
    SELECT ARRAY_AGG(id) INTO v_stores FROM stores;
    v_store_count := array_length(v_stores, 1);
    
    -- Generate transactions
    FOR i IN 1..p_transaction_count LOOP
        -- Select store (weighted by region)
        v_store_id := v_stores[1 + (i % v_store_count)];
        
        -- Generate transaction datetime within date range
        v_transaction_date := p_start_date + 
            (RANDOM() * (p_end_date - p_start_date)) + 
            INTERVAL '6 hours' + -- Start at 6 AM
            (RANDOM() * INTERVAL '14 hours'); -- Up to 8 PM
        
        v_hour := EXTRACT(HOUR FROM v_transaction_date);
        v_day_of_week := EXTRACT(DOW FROM v_transaction_date);
        
        -- Customer demographics (Philippine patterns)
        v_customer_age := CASE 
            WHEN RANDOM() < 0.25 THEN 18 + (RANDOM() * 7)::INT  -- 18-25 (25%)
            WHEN RANDOM() < 0.60 THEN 25 + (RANDOM() * 15)::INT -- 25-40 (35%)
            WHEN RANDOM() < 0.85 THEN 40 + (RANDOM() * 15)::INT -- 40-55 (25%)
            ELSE 55 + (RANDOM() * 20)::INT                      -- 55-75 (15%)
        END;
        
        v_customer_gender := CASE 
            WHEN RANDOM() < 0.52 THEN 'Female'
            ELSE 'Male'
        END;
        
        -- Generate realistic transcription
        v_transcription := generate_filipino_transcription(v_hour, v_customer_age);
        
        -- Basket size varies by time of day
        v_basket_size := CASE 
            WHEN v_hour BETWEEN 6 AND 9 THEN 1 + (RANDOM() * 3)::INT   -- Morning: 1-3 items
            WHEN v_hour BETWEEN 17 AND 20 THEN 2 + (RANDOM() * 5)::INT -- Evening: 2-6 items
            ELSE 1 + (RANDOM() * 4)::INT                               -- Default: 1-4 items
        END;
        
        -- Create transaction
        INSERT INTO transactions (
            store_id,
            customer_age,
            customer_gender,
            amount,
            created_at,
            transcription_text,
            nlp_processed,
            checkout_time,
            payment_method
        ) VALUES (
            v_store_id,
            v_customer_age,
            v_customer_gender,
            0, -- Will update after items
            v_transaction_date,
            v_transcription,
            FALSE, -- Ready for NLP processing
            v_transaction_date + INTERVAL '30 seconds' + (RANDOM() * INTERVAL '300 seconds'),
            CASE WHEN RANDOM() < 0.7 THEN 'cash' ELSE 'gcash' END
        ) RETURNING id INTO v_transaction_id;
        
        -- Add transaction items
        v_total_amount := 0;
        FOR j IN 1..v_basket_size LOOP
            -- Select product based on time and demographics
            v_product_id := select_product_by_context(v_hour, v_customer_age, v_customer_gender);
            v_quantity := CASE 
                WHEN RANDOM() < 0.7 THEN 1
                WHEN RANDOM() < 0.9 THEN 2
                ELSE 3 + (RANDOM() * 2)::INT
            END;
            
            INSERT INTO transaction_items (
                transaction_id,
                product_id,
                quantity,
                price
            ) SELECT 
                v_transaction_id,
                v_product_id,
                v_quantity,
                p.price
            FROM products p
            WHERE p.id = v_product_id;
            
            -- Update total amount
            SELECT v_total_amount + (p.price * v_quantity) 
            INTO v_total_amount
            FROM products p
            WHERE p.id = v_product_id;
        END LOOP;
        
        -- Update transaction total
        UPDATE transactions 
        SET amount = v_total_amount
        WHERE id = v_transaction_id;
        
        -- Add request behaviors (for NLP to process later)
        IF v_transcription IS NOT NULL AND RANDOM() < 0.8 THEN
            INSERT INTO request_behaviors (
                transaction_id,
                request_type,
                request_method,
                suggestion_offered,
                suggestion_accepted,
                extracted_phrase
            ) VALUES (
                v_transaction_id,
                CASE 
                    WHEN v_transcription LIKE '%Marlboro%' OR v_transcription LIKE '%Alaska%' THEN 'branded'
                    WHEN v_transcription LIKE '%yosi%' OR v_transcription LIKE '%gatas%' THEN 'unbranded'
                    ELSE 'general'
                END,
                CASE 
                    WHEN v_transcription LIKE '%pahingi%' OR v_transcription LIKE '%pabili%' THEN 'verbal'
                    WHEN v_transcription LIKE '%yan%' OR v_transcription LIKE '%yun%' THEN 'pointing'
                    ELSE 'combined'
                END,
                RANDOM() < 0.3, -- 30% get suggestions
                RANDOM() < 0.6, -- 60% accept suggestions
                LEFT(v_transcription, 50)
            );
        END IF;
        
        -- Add substitutions occasionally
        IF RANDOM() < 0.15 THEN -- 15% have substitutions
            PERFORM add_substitution_pattern(v_transaction_id);
        END IF;
        
        -- Progress indicator
        IF i % 1000 = 0 THEN
            RAISE NOTICE 'Generated % transactions...', i;
        END IF;
    END LOOP;
    
    -- Return summary
    RETURN QUERY
    SELECT 
        'Success'::TEXT as status,
        p_transaction_count as transactions_created,
        p_start_date::TEXT || ' to ' || p_end_date::TEXT as date_range;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 4: HELPER FUNCTIONS
-- =====================================================

-- Generate realistic Filipino transcriptions
CREATE OR REPLACE FUNCTION generate_filipino_transcription(
    p_hour INT,
    p_age INT
)
RETURNS TEXT AS $$
DECLARE
    v_greetings TEXT[] := ARRAY[
        'Ate', 'Kuya', 'Boss', 'Maam', 'Sir', 'Tito', 'Tita'
    ];
    v_requests TEXT[] := ARRAY[
        'pahingi ng', 'pabili ng', 'meron ba kayong', 'pwede ba', 'gusto ko ng'
    ];
    v_products TEXT[] := ARRAY[
        'Marlboro', 'Fortune', 'Alaska evap', 'Bear Brand', 'Nescafe 3-in-1',
        'Lucky Me Pancit Canton', 'Argentina', 'Century Tuna', 'Sky Flakes',
        'Chippy', 'Coke', 'Red Horse', 'Smart load', 'Globe load'
    ];
    v_endings TEXT[] := ARRAY[
        'salamat po', 'thank you', 'sige', 'okay lang', 'balik ako'
    ];
BEGIN
    -- Morning patterns
    IF p_hour BETWEEN 6 AND 10 THEN
        RETURN v_greetings[1 + (RANDOM() * array_length(v_greetings, 1))::INT] || ', ' ||
               v_requests[1 + (RANDOM() * array_length(v_requests, 1))::INT] || ' ' ||
               CASE WHEN RANDOM() < 0.5 THEN 'kape' ELSE 'pandesal' END || ', ' ||
               v_endings[1 + (RANDOM() * array_length(v_endings, 1))::INT];
    -- Regular patterns
    ELSE
        RETURN v_greetings[1 + (RANDOM() * array_length(v_greetings, 1))::INT] || ', ' ||
               v_requests[1 + (RANDOM() * array_length(v_requests, 1))::INT] || ' ' ||
               v_products[1 + (RANDOM() * array_length(v_products, 1))::INT] || ', ' ||
               CASE WHEN RANDOM() < 0.3 THEN 'dalawa' ELSE '' END || ' ' ||
               v_endings[1 + (RANDOM() * array_length(v_endings, 1))::INT];
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Select products based on context
CREATE OR REPLACE FUNCTION select_product_by_context(
    p_hour INT,
    p_age INT,
    p_gender VARCHAR
)
RETURNS INT AS $$
DECLARE
    v_product_id INT;
BEGIN
    -- Morning preferences
    IF p_hour BETWEEN 6 AND 10 THEN
        SELECT id INTO v_product_id
        FROM products p
        JOIN brands b ON p.brand_id = b.id
        WHERE b.category IN ('Beverages', 'Food')
        AND p.name ILIKE ANY(ARRAY['%coffee%', '%3-in-1%', '%bread%', '%pandesal%'])
        ORDER BY RANDOM()
        LIMIT 1;
    -- Young adult preferences
    ELSIF p_age < 30 THEN
        SELECT id INTO v_product_id
        FROM products p
        JOIN brands b ON p.brand_id = b.id
        WHERE b.category IN ('Tobacco', 'Beverages', 'Snacks')
        ORDER BY RANDOM()
        LIMIT 1;
    -- Default selection
    ELSE
        SELECT id INTO v_product_id
        FROM products
        ORDER BY RANDOM()
        LIMIT 1;
    END IF;
    
    -- Fallback if no specific product found
    IF v_product_id IS NULL THEN
        SELECT id INTO v_product_id
        FROM products
        ORDER BY RANDOM()
        LIMIT 1;
    END IF;
    
    RETURN v_product_id;
END;
$$ LANGUAGE plpgsql;

-- Add substitution patterns
CREATE OR REPLACE FUNCTION add_substitution_pattern(
    p_transaction_id INT
)
RETURNS VOID AS $$
DECLARE
    v_item RECORD;
    v_substitute_id INT;
BEGIN
    -- Get a random item from the transaction
    SELECT ti.*, p.brand_id, b.category
    INTO v_item
    FROM transaction_items ti
    JOIN products p ON ti.product_id = p.id
    JOIN brands b ON p.brand_id = b.id
    WHERE ti.transaction_id = p_transaction_id
    ORDER BY RANDOM()
    LIMIT 1;
    
    -- Find a substitute in the same category
    SELECT p.id INTO v_substitute_id
    FROM products p
    JOIN brands b ON p.brand_id = b.id
    WHERE b.category = v_item.category
    AND p.id != v_item.product_id
    ORDER BY RANDOM()
    LIMIT 1;
    
    IF v_substitute_id IS NOT NULL THEN
        INSERT INTO substitutions (
            transaction_id,
            transaction_item_id,
            original_product_id,
            substituted_product_id,
            substitution_reason,
            conversation_context
        ) VALUES (
            p_transaction_id,
            v_item.id,
            v_item.product_id,
            v_substitute_id,
            CASE (RANDOM() * 3)::INT
                WHEN 0 THEN 'out_of_stock'
                WHEN 1 THEN 'price_preference'
                ELSE 'promotion'
            END,
            'Customer accepted alternative product'
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 5: EXECUTE DATA GENERATION
-- =====================================================

-- Generate the data
SELECT * FROM generate_philippine_transactions(
    '2024-06-01'::DATE,  -- Start date
    '2025-05-31'::DATE,  -- End date  
    50000                -- Number of transactions
);

-- =====================================================
-- STEP 6: GENERATE AGGREGATED ANALYTICS
-- =====================================================

-- Refresh materialized views
REFRESH MATERIALIZED VIEW IF EXISTS mv_hourly_metrics;

-- Update store metrics
UPDATE stores s
SET 
    total_transactions = stats.transaction_count,
    avg_basket_size = stats.avg_basket_size,
    total_revenue = stats.total_revenue
FROM (
    SELECT 
        store_id,
        COUNT(DISTINCT id) as transaction_count,
        AVG(amount) as avg_basket_size,
        SUM(amount) as total_revenue
    FROM transactions
    WHERE created_at >= '2024-06-01'
    GROUP BY store_id
) stats
WHERE s.id = stats.store_id;

-- Generate hourly patterns
CREATE TABLE IF NOT EXISTS hourly_patterns AS
SELECT 
    EXTRACT(HOUR FROM created_at) as hour,
    COUNT(*) as transaction_count,
    AVG(amount) as avg_transaction_value,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY amount) as median_value
FROM transactions
GROUP BY EXTRACT(HOUR FROM created_at)
ORDER BY hour;

-- Generate regional insights
CREATE TABLE IF NOT EXISTS regional_insights AS
SELECT 
    s.region,
    s.province,
    COUNT(DISTINCT t.id) as transactions,
    COUNT(DISTINCT s.id) as active_stores,
    SUM(t.amount) as total_revenue,
    AVG(t.amount) as avg_transaction,
    COUNT(DISTINCT DATE(t.created_at)) as active_days
FROM transactions t
JOIN stores s ON t.store_id = s.id
WHERE t.created_at >= '2024-06-01'
GROUP BY s.region, s.province
ORDER BY total_revenue DESC;

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT 
    'Data Generation Summary' as report,
    COUNT(DISTINCT t.id) as total_transactions,
    COUNT(DISTINCT t.store_id) as active_stores,
    COUNT(DISTINCT s.region) as regions_covered,
    COUNT(DISTINCT s.barangay) as barangays_covered,
    MIN(t.created_at)::DATE as earliest_date,
    MAX(t.created_at)::DATE as latest_date,
    ROUND(AVG(t.amount), 2) as avg_transaction_value,
    COUNT(DISTINCT t.customer_age || '-' || t.customer_gender) as unique_demographics
FROM transactions t
JOIN stores s ON t.store_id = s.id
WHERE t.created_at >= '2024-06-01';

-- Show sample transactions by region
SELECT 
    s.region,
    COUNT(*) as transactions,
    ROUND(AVG(t.amount), 2) as avg_amount,
    MIN(t.created_at)::DATE as first_transaction,
    MAX(t.created_at)::DATE as last_transaction
FROM transactions t
JOIN stores s ON t.store_id = s.id
WHERE t.created_at >= '2024-06-01'
GROUP BY s.region
ORDER BY transactions DESC;