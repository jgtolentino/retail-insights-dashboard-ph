-- 🚀 INCREMENTAL DATA GENERATION TO REACH 18,000 TRANSACTIONS
-- This script adds to existing data without duplicating

-- =====================================================
-- STEP 1: CHECK CURRENT DATA STATUS
-- =====================================================

WITH current_status AS (
    SELECT 
        COUNT(*) as existing_transactions,
        MIN(created_at) as earliest_date,
        MAX(created_at) as latest_date,
        COUNT(DISTINCT store_id) as store_count,
        COUNT(DISTINCT DATE(created_at)) as days_with_data
    FROM transactions
)
SELECT 
    existing_transactions,
    18000 - existing_transactions as transactions_to_add,
    earliest_date::DATE,
    latest_date::DATE,
    store_count,
    days_with_data
FROM current_status;

-- =====================================================
-- STEP 2: EXTEND DATE RANGE FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION extend_transaction_dates()
RETURNS TABLE (
    status TEXT,
    transactions_extended INT,
    new_date_range TEXT
) AS $$
DECLARE
    v_transaction RECORD;
    v_new_date TIMESTAMPTZ;
    v_count INT := 0;
BEGIN
    -- Extend existing transactions to cover June 2024 - May 2025
    FOR v_transaction IN 
        SELECT id, created_at
        FROM transactions
        WHERE created_at < '2024-06-01' OR created_at > '2025-05-31'
    LOOP
        -- Map old dates to new range proportionally
        IF v_transaction.created_at < '2024-06-01' THEN
            -- Map early 2025 dates to late 2024
            v_new_date := '2024-06-01'::DATE + 
                (EXTRACT(DOY FROM v_transaction.created_at) || ' days')::INTERVAL;
        ELSE
            -- Keep within range
            v_new_date := v_transaction.created_at;
        END IF;
        
        UPDATE transactions 
        SET created_at = v_new_date,
            checkout_time = v_new_date + INTERVAL '2 minutes'
        WHERE id = v_transaction.id;
        
        v_count := v_count + 1;
    END LOOP;
    
    RETURN QUERY
    SELECT 
        'Date Extension Complete'::TEXT,
        v_count,
        'June 2024 - May 2025'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Execute date extension
SELECT * FROM extend_transaction_dates();

-- =====================================================
-- STEP 3: ADD INCREMENTAL TRANSACTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION add_incremental_transactions(
    p_target_total INT DEFAULT 18000
)
RETURNS TABLE (
    status TEXT,
    initial_count INT,
    added_count INT,
    final_count INT
) AS $$
DECLARE
    v_current_count INT;
    v_transactions_to_add INT;
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
    v_transcription TEXT;
    v_stores INT[];
    v_store_count INT;
    i INT;
    j INT;
BEGIN
    -- Get current transaction count
    SELECT COUNT(*) INTO v_current_count FROM transactions;
    v_transactions_to_add := GREATEST(0, p_target_total - v_current_count);
    
    IF v_transactions_to_add = 0 THEN
        RETURN QUERY
        SELECT 
            'Already at target'::TEXT,
            v_current_count,
            0,
            v_current_count;
        RETURN;
    END IF;
    
    -- Get all store IDs
    SELECT ARRAY_AGG(id) INTO v_stores FROM stores;
    v_store_count := array_length(v_stores, 1);
    
    -- If no stores exist, create some basic ones
    IF v_store_count IS NULL OR v_store_count = 0 THEN
        -- Create basic stores for major areas
        INSERT INTO stores (name, location, store_type, created_at)
        SELECT 
            'Store ' || n || ' - ' || location,
            location,
            CASE WHEN n % 3 = 0 THEN 'mini_mart' ELSE 'sari_sari' END,
            NOW() - INTERVAL '400 days'
        FROM (
            VALUES 
            ('Manila'), ('Quezon City'), ('Makati'), ('Cebu City'), 
            ('Davao City'), ('Cagayan de Oro'), ('Iloilo City'), ('Bacolod')
        ) AS locations(location),
        generate_series(1, 3) AS n;
        
        -- Refresh store array
        SELECT ARRAY_AGG(id) INTO v_stores FROM stores;
        v_store_count := array_length(v_stores, 1);
    END IF;
    
    -- Generate transactions to fill the gap
    FOR i IN 1..v_transactions_to_add LOOP
        -- Distribute across stores
        v_store_id := v_stores[1 + (i % v_store_count)];
        
        -- Generate date within June 2024 - May 2025
        v_transaction_date := '2024-06-01'::DATE + 
            (RANDOM() * 365)::INT * INTERVAL '1 day' +
            INTERVAL '6 hours' + 
            (RANDOM() * INTERVAL '14 hours');
        
        v_hour := EXTRACT(HOUR FROM v_transaction_date);
        
        -- Customer demographics
        v_customer_age := CASE 
            WHEN RANDOM() < 0.25 THEN 18 + (RANDOM() * 7)::INT
            WHEN RANDOM() < 0.60 THEN 25 + (RANDOM() * 15)::INT
            WHEN RANDOM() < 0.85 THEN 40 + (RANDOM() * 15)::INT
            ELSE 55 + (RANDOM() * 20)::INT
        END;
        
        v_customer_gender := CASE 
            WHEN RANDOM() < 0.52 THEN 'Female' ELSE 'Male'
        END;
        
        -- Generate transcription
        v_transcription := CASE (RANDOM() * 10)::INT
            WHEN 0 THEN 'Ate, pabili ng Alaska evap, salamat po'
            WHEN 1 THEN 'Kuya, meron ba kayong Marlboro, yung red'
            WHEN 2 THEN 'Boss, pahingi ng Oishi, dalawa'
            WHEN 3 THEN 'Maam, Champion detergent powder, yung maliit'
            WHEN 4 THEN 'Sir, Del Monte ketchup tsaka Coke 1.5'
            WHEN 5 THEN 'Tita, Winston lights at Smart load 100'
            WHEN 6 THEN 'Ate, Nescafe 3in1 tatlo, thank you'
            WHEN 7 THEN 'Kuya, Lucky Me beef at pandesal'
            WHEN 8 THEN 'Boss, Chippy tsaka C2 apple'
            ELSE 'Pabili po, salamat'
        END;
        
        -- Basket size (realistic for sari-sari)
        v_basket_size := CASE 
            WHEN v_hour BETWEEN 6 AND 9 THEN 1 + (RANDOM() * 2)::INT
            WHEN v_hour BETWEEN 17 AND 20 THEN 2 + (RANDOM() * 4)::INT
            ELSE 1 + (RANDOM() * 3)::INT
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
            payment_method
        ) VALUES (
            v_store_id,
            v_customer_age,
            v_customer_gender,
            0,
            v_transaction_date,
            v_transcription,
            FALSE,
            CASE WHEN RANDOM() < 0.8 THEN 'cash' ELSE 'gcash' END
        ) RETURNING id INTO v_transaction_id;
        
        -- Add transaction items
        v_total_amount := 0;
        FOR j IN 1..v_basket_size LOOP
            -- Select random product (create if none exist)
            SELECT id INTO v_product_id 
            FROM products 
            WHERE price BETWEEN 10 AND 200
            ORDER BY RANDOM() 
            LIMIT 1;
            
            -- If no products, use a default product ID or skip
            IF v_product_id IS NULL THEN
                v_product_id := 1; -- Fallback
            END IF;
            
            v_quantity := CASE 
                WHEN RANDOM() < 0.7 THEN 1
                WHEN RANDOM() < 0.9 THEN 2
                ELSE 3
            END;
            
            -- Insert transaction item
            INSERT INTO transaction_items (
                transaction_id,
                product_id,
                quantity,
                price
            ) 
            SELECT 
                v_transaction_id,
                v_product_id,
                v_quantity,
                COALESCE(p.price, 50) -- Default price if product not found
            FROM products p
            WHERE p.id = v_product_id
            ON CONFLICT DO NOTHING;
            
            -- Update total
            SELECT v_total_amount + (COALESCE(p.price, 50) * v_quantity)
            INTO v_total_amount
            FROM products p
            WHERE p.id = v_product_id;
        END LOOP;
        
        -- Update transaction total
        UPDATE transactions 
        SET amount = v_total_amount
        WHERE id = v_transaction_id;
        
        -- Progress indicator every 1000
        IF i % 1000 = 0 THEN
            RAISE NOTICE 'Added % transactions...', i;
        END IF;
    END LOOP;
    
    -- Return summary
    RETURN QUERY
    SELECT 
        'Success'::TEXT,
        v_current_count,
        v_transactions_to_add,
        (SELECT COUNT(*) FROM transactions)::INT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 4: EXECUTE INCREMENTAL GENERATION
-- =====================================================

-- Add transactions to reach 18,000 total
SELECT * FROM add_incremental_transactions(18000);

-- =====================================================
-- STEP 5: ENRICH EXISTING DATA
-- =====================================================

-- Add customer demographics to transactions that don't have them
UPDATE transactions 
SET 
    customer_age = CASE 
        WHEN RANDOM() < 0.25 THEN 18 + (RANDOM() * 7)::INT
        WHEN RANDOM() < 0.60 THEN 25 + (RANDOM() * 15)::INT
        WHEN RANDOM() < 0.85 THEN 40 + (RANDOM() * 15)::INT
        ELSE 55 + (RANDOM() * 20)::INT
    END,
    customer_gender = CASE 
        WHEN RANDOM() < 0.52 THEN 'Female' ELSE 'Male'
    END
WHERE customer_age IS NULL OR customer_gender IS NULL;

-- Add transcriptions to transactions that don't have them
UPDATE transactions 
SET transcription_text = 
    CASE (RANDOM() * 10)::INT
        WHEN 0 THEN 'Ate, pabili ng Alaska evap'
        WHEN 1 THEN 'Kuya, Marlboro red'
        WHEN 2 THEN 'Boss, Oishi prawn crackers'
        WHEN 3 THEN 'Champion powder, yung maliit'
        WHEN 4 THEN 'Del Monte ketchup'
        WHEN 5 THEN 'Winston lights'
        WHEN 6 THEN 'Nescafe 3in1'
        WHEN 7 THEN 'Lucky Me pancit canton'
        WHEN 8 THEN 'Chippy barbecue'
        ELSE 'Pabili po'
    END
WHERE transcription_text IS NULL;

-- =====================================================
-- STEP 6: CREATE BALANCED DISTRIBUTION
-- =====================================================

-- Function to balance transactions across months
CREATE OR REPLACE FUNCTION balance_transaction_distribution()
RETURNS VOID AS $$
DECLARE
    v_month RECORD;
    v_target_per_month INT := 1500; -- 18000 / 12 months
    v_current_count INT;
    v_deficit INT;
BEGIN
    -- Check each month's transaction count
    FOR v_month IN 
        SELECT 
            DATE_TRUNC('month', created_at) as month_start,
            COUNT(*) as transaction_count
        FROM transactions
        WHERE created_at BETWEEN '2024-06-01' AND '2025-05-31'
        GROUP BY DATE_TRUNC('month', created_at)
    LOOP
        v_deficit := v_target_per_month - v_month.transaction_count;
        
        IF v_deficit > 0 THEN
            -- Move some transactions from over-represented months
            UPDATE transactions
            SET created_at = v_month.month_start + 
                (RANDOM() * INTERVAL '28 days')
            WHERE id IN (
                SELECT id 
                FROM transactions
                WHERE DATE_TRUNC('month', created_at) IN (
                    SELECT DATE_TRUNC('month', created_at)
                    FROM transactions
                    WHERE created_at BETWEEN '2024-06-01' AND '2025-05-31'
                    GROUP BY DATE_TRUNC('month', created_at)
                    HAVING COUNT(*) > v_target_per_month
                    LIMIT 1
                )
                ORDER BY RANDOM()
                LIMIT v_deficit
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Balance the distribution
SELECT balance_transaction_distribution();

-- =====================================================
-- STEP 7: FINAL VERIFICATION
-- =====================================================

-- Check final status
WITH summary AS (
    SELECT 
        COUNT(*) as total_transactions,
        COUNT(DISTINCT store_id) as unique_stores,
        COUNT(DISTINCT DATE(created_at)) as days_with_data,
        MIN(created_at)::DATE as start_date,
        MAX(created_at)::DATE as end_date,
        ROUND(AVG(amount), 2) as avg_transaction_value,
        COUNT(DISTINCT customer_age || '-' || customer_gender) as demographic_combinations
    FROM transactions
    WHERE created_at BETWEEN '2024-06-01' AND '2025-05-31'
)
SELECT * FROM summary;

-- Monthly distribution check
SELECT 
    TO_CHAR(created_at, 'YYYY-MM') as month,
    COUNT(*) as transactions,
    ROUND(AVG(amount), 2) as avg_amount,
    COUNT(DISTINCT store_id) as active_stores
FROM transactions
WHERE created_at BETWEEN '2024-06-01' AND '2025-05-31'
GROUP BY TO_CHAR(created_at, 'YYYY-MM')
ORDER BY month;

-- Transaction pattern by hour
SELECT 
    EXTRACT(HOUR FROM created_at) as hour,
    COUNT(*) as transaction_count,
    ROUND(AVG(amount), 2) as avg_amount
FROM transactions
WHERE created_at BETWEEN '2024-06-01' AND '2025-05-31'
GROUP BY EXTRACT(HOUR FROM created_at)
ORDER BY hour;