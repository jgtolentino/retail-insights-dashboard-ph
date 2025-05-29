-- 🎯 COMPLETE DATA SETUP FOR 18,000 TRANSACTIONS
-- Run these scripts in order in your Supabase SQL Editor

-- =====================================================
-- EXECUTION ORDER
-- =====================================================

/*
1. FIRST: Run the hierarchical structure (if not already done)
   - Copy from: scripts/create_hierarchical_structure.sql
   
2. SECOND: Run the TBWA complete brands structure
   - Copy from: scripts/tbwa_complete_brands_structure.sql
   
3. THIRD: Run the incremental data generation
   - Copy from: scripts/incremental_data_generation.sql
   
4. OPTIONAL: If you want to start fresh with Philippine geography
   - Copy ONLY the location and store generation parts from: scripts/generate_philippine_data.sql
*/

-- =====================================================
-- QUICK SETUP CHECK
-- =====================================================

-- Check what we currently have
WITH current_state AS (
    SELECT 
        (SELECT COUNT(*) FROM transactions) as transaction_count,
        (SELECT COUNT(*) FROM stores) as store_count,
        (SELECT COUNT(*) FROM products) as product_count,
        (SELECT COUNT(*) FROM brands) as brand_count,
        (SELECT COUNT(*) FROM companies WHERE is_tbwa_client = true) as tbwa_companies
)
SELECT 
    transaction_count,
    CASE 
        WHEN transaction_count >= 18000 THEN '✅ Already at target'
        ELSE '⚠️ Need ' || (18000 - transaction_count) || ' more transactions'
    END as transaction_status,
    store_count,
    product_count,
    brand_count,
    tbwa_companies
FROM current_state;

-- =====================================================
-- QUICK FIX IF NEEDED
-- =====================================================

-- If you're missing basic data, run these quick inserts:

-- Quick store creation if needed
INSERT INTO stores (name, location, store_type, created_at)
SELECT 
    'Sari-Sari Store ' || ROW_NUMBER() OVER () as name,
    region as location,
    'sari_sari' as store_type,
    NOW() - INTERVAL '400 days'
FROM (
    VALUES 
    ('NCR'), ('Region I'), ('Region II'), ('Region III'),
    ('Region IV-A'), ('Region V'), ('Region VI'), ('Region VII'),
    ('Region VIII'), ('Region IX'), ('Region X'), ('Region XI'),
    ('Region XII'), ('Region XIII'), ('CAR'), ('BARMM')
) AS regions(region)
WHERE NOT EXISTS (SELECT 1 FROM stores LIMIT 1);

-- Quick product creation if needed
INSERT INTO products (name, sku, price, brand_id)
SELECT 
    product_name,
    UPPER(REPLACE(product_name, ' ', '_')),
    price,
    1 -- Default brand ID, update later
FROM (
    VALUES 
    ('Alaska Evap 370ml', 38),
    ('Oishi Prawn Crackers', 20),
    ('Champion Detergent Bar', 15),
    ('Del Monte Ketchup 250g', 28),
    ('Winston Red 20s', 145),
    ('Marlboro Red 20s', 160),
    ('Lucky Me Pancit Canton', 12),
    ('Nescafe 3in1', 8),
    ('Coke 1.5L', 55),
    ('Chippy 110g', 35)
) AS sample_products(product_name, price)
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);

-- =====================================================
-- FINAL SUMMARY AFTER ALL SCRIPTS
-- =====================================================

-- Run this query after executing all scripts to verify:
SELECT 
    '📊 FINAL DATA SUMMARY' as report_section,
    '' as metric,
    '' as value
UNION ALL
SELECT 
    'Transactions', 
    'Total Count', 
    COUNT(*)::TEXT
FROM transactions
UNION ALL
SELECT 
    'Date Range',
    'Coverage',
    MIN(created_at)::DATE || ' to ' || MAX(created_at)::DATE
FROM transactions
UNION ALL
SELECT 
    'Geographic',
    'Regions',
    COUNT(DISTINCT region)::TEXT
FROM stores
WHERE region IS NOT NULL
UNION ALL
SELECT 
    'Brands',
    'TBWA Brands',
    COUNT(*)::TEXT
FROM brands b
JOIN companies c ON b.company_id = c.id
WHERE c.is_tbwa_client = true
UNION ALL
SELECT 
    'Brands',
    'Competitor Brands',
    COUNT(*)::TEXT
FROM brands b
JOIN companies c ON b.company_id = c.id
WHERE c.is_tbwa_client = false
UNION ALL
SELECT 
    'Products',
    'With SKU Variants',
    COUNT(DISTINCT sv.product_id)::TEXT
FROM sku_variants sv
UNION ALL
SELECT 
    'Analytics',
    'Ready for Drill-down',
    '✅ Yes'
ORDER BY report_section, metric;