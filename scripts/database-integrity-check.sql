-- DATABASE SYNCHRONIZATION & INTEGRITY CHECK SCRIPT
-- Run this in Supabase SQL Editor to verify all data relationships

-- =====================================================
-- SECTION 1: DATA INTEGRITY CHECKS
-- =====================================================

-- 1.1 Check for orphaned records (referential integrity)
SELECT 'ORPHANED TRANSACTION ITEMS' as issue_type, COUNT(*) as count
FROM transaction_items ti 
LEFT JOIN transactions t ON ti.transaction_id = t.id 
WHERE t.id IS NULL

UNION ALL

SELECT 'ORPHANED TRANSACTIONS (NO STORE)', COUNT(*)
FROM transactions t 
LEFT JOIN stores s ON t.store_id = s.id 
WHERE s.id IS NULL

UNION ALL

SELECT 'ORPHANED PRODUCTS (NO BRAND)', COUNT(*)
FROM products p 
LEFT JOIN brands b ON p.brand_id = b.id 
WHERE b.id IS NULL

UNION ALL

SELECT 'MISSING TRANSACTION ITEMS', COUNT(*)
FROM transactions t 
LEFT JOIN transaction_items ti ON t.id = ti.transaction_id 
WHERE ti.id IS NULL;

-- =====================================================
-- SECTION 2: FILTER REFERENCE VERIFICATION
-- =====================================================

-- 2.1 Verify all filter dropdown data sources
SELECT 'FILTER VERIFICATION' as check_type, 
       'brands' as filter_name, 
       COUNT(*) as available_options,
       COUNT(DISTINCT category) as categories
FROM brands
WHERE name IS NOT NULL AND name != ''

UNION ALL

SELECT 'FILTER VERIFICATION', 'products', COUNT(*), COUNT(DISTINCT brand_id)
FROM products p
JOIN brands b ON p.brand_id = b.id
WHERE p.name IS NOT NULL

UNION ALL

SELECT 'FILTER VERIFICATION', 'stores', COUNT(*), COUNT(DISTINCT location)
FROM stores
WHERE name IS NOT NULL

UNION ALL

SELECT 'FILTER VERIFICATION', 'categories', COUNT(DISTINCT category), 0
FROM brands
WHERE category IS NOT NULL;

-- =====================================================
-- SECTION 3: DATA FRESHNESS & SYNC STATUS
-- =====================================================

-- 3.1 Check data freshness across all tables
SELECT 
    'DATA FRESHNESS' as check_type,
    'transactions' as table_name,
    COUNT(*) as total_records,
    MAX(created_at) as latest_record,
    MIN(created_at) as earliest_record,
    NOW() - MAX(created_at) as time_since_last_update
FROM transactions

UNION ALL

SELECT 'DATA FRESHNESS', 'transaction_items', COUNT(*), MAX(created_at), MIN(created_at), NOW() - MAX(created_at)
FROM transaction_items

UNION ALL

SELECT 'DATA FRESHNESS', 'brands', COUNT(*), MAX(created_at), MIN(created_at), NOW() - MAX(created_at)
FROM brands

UNION ALL

SELECT 'DATA FRESHNESS', 'products', COUNT(*), MAX(created_at), MIN(created_at), NOW() - MAX(created_at)
FROM products;

-- =====================================================
-- SECTION 4: FILTER CROSS-REFERENCE VALIDATION
-- =====================================================

-- 4.1 Verify filter combinations actually exist in data
WITH filter_combinations AS (
    SELECT DISTINCT
        b.category,
        b.name as brand_name,
        p.name as product_name,
        s.location,
        COUNT(t.id) as transaction_count
    FROM transactions t
    JOIN stores s ON t.store_id = s.id
    JOIN transaction_items ti ON t.id = ti.transaction_id
    JOIN products p ON ti.product_id = p.id
    JOIN brands b ON p.brand_id = b.id
    GROUP BY b.category, b.name, p.name, s.location
)
SELECT 
    'FILTER COMBINATIONS' as check_type,
    category,
    COUNT(*) as available_products,
    COUNT(DISTINCT brand_name) as available_brands,
    SUM(transaction_count) as total_transactions
FROM filter_combinations
GROUP BY category
ORDER BY total_transactions DESC;

-- =====================================================
-- SECTION 5: REAL-TIME SYNC VERIFICATION
-- =====================================================

-- 5.1 Check if RPC functions return consistent data
-- Test your main dashboard RPC functions
SELECT 'RPC FUNCTION TEST' as test_type, 'get_daily_trends' as function_name;
-- SELECT * FROM get_daily_trends() LIMIT 5;

SELECT 'RPC FUNCTION TEST' as test_type, 'get_age_distribution' as function_name;
-- SELECT * FROM get_age_distribution() LIMIT 5;

-- =====================================================
-- SECTION 6: PERFORMANCE & INDEX VERIFICATION
-- =====================================================

-- 6.1 Check if proper indexes exist for filtering
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
    AND tablename IN ('transactions', 'transaction_items', 'products', 'brands', 'stores')
ORDER BY tablename, indexname;

-- =====================================================
-- SECTION 7: FILTER DROPDOWN DATA CONSISTENCY
-- =====================================================

-- 7.1 Generate exact data that should appear in each filter dropdown
-- Categories Filter
SELECT 'CATEGORIES_FILTER' as filter_type, category as option_value, COUNT(*) as usage_count
FROM brands b
JOIN products p ON b.id = p.brand_id
JOIN transaction_items ti ON p.id = ti.product_id
WHERE category IS NOT NULL
GROUP BY category
ORDER BY usage_count DESC;

-- Brands Filter  
SELECT 'BRANDS_FILTER' as filter_type, b.name as option_value, COUNT(*) as usage_count
FROM brands b
JOIN products p ON b.id = p.brand_id
JOIN transaction_items ti ON p.id = ti.product_id
WHERE b.name IS NOT NULL
GROUP BY b.name
ORDER BY usage_count DESC;

-- Products Filter
SELECT 'PRODUCTS_FILTER' as filter_type, p.name as option_value, COUNT(*) as usage_count
FROM products p
JOIN transaction_items ti ON p.id = ti.product_id
WHERE p.name IS NOT NULL
GROUP BY p.name
ORDER BY usage_count DESC;

-- Locations Filter
SELECT 'LOCATIONS_FILTER' as filter_type, s.location as option_value, COUNT(*) as usage_count
FROM stores s
JOIN transactions t ON s.id = t.store_id
WHERE s.location IS NOT NULL
GROUP BY s.location
ORDER BY usage_count DESC;

-- =====================================================
-- SECTION 8: MATERIALIZED VIEW REFRESH STATUS
-- =====================================================

-- 8.1 Check if materialized views exist and are fresh
SELECT 
    schemaname,
    matviewname,
    hasindexes,
    ispopulated,
    definition
FROM pg_matviews 
WHERE schemaname = 'public';

-- Refresh all materialized views if they exist
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_hourly_metrics;

-- =====================================================
-- SECTION 9: FINAL SYNC SUMMARY
-- =====================================================

-- 9.1 Generate sync status summary
SELECT 
    'SYNC STATUS SUMMARY' as report_type,
    (SELECT COUNT(*) FROM transactions) as total_transactions,
    (SELECT COUNT(*) FROM transaction_items) as total_items,
    (SELECT COUNT(*) FROM brands) as total_brands,
    (SELECT COUNT(*) FROM products) as total_products,
    (SELECT COUNT(*) FROM stores) as total_stores,
    (SELECT MAX(created_at) FROM transactions) as last_transaction_time,
    (CASE 
        WHEN (SELECT MAX(created_at) FROM transactions) > NOW() - INTERVAL '1 day' 
        THEN 'FRESH' 
        ELSE 'STALE' 
    END) as data_freshness_status;

-- =====================================================
-- SECTION 10: ADDITIONAL DIAGNOSTIC QUERIES
-- =====================================================

-- 10.1 Check TBWA brand status
SELECT 'TBWA BRAND STATUS' as check_type,
    COUNT(*) as total_brands,
    COUNT(CASE WHEN is_tbwa_client = true THEN 1 END) as tbwa_brands,
    COUNT(CASE WHEN is_tbwa_client = false OR is_tbwa_client IS NULL THEN 1 END) as competitor_brands
FROM brands;

-- 10.2 Verify transaction date ranges
SELECT 'TRANSACTION DATE RANGE' as check_type,
    MIN(created_at::DATE) as earliest_date,
    MAX(created_at::DATE) as latest_date,
    COUNT(DISTINCT created_at::DATE) as unique_days,
    EXTRACT(DAYS FROM (MAX(created_at) - MIN(created_at))) as total_day_span
FROM transactions;

-- 10.3 Check for data consistency across joins
SELECT 'DATA JOIN CONSISTENCY' as check_type,
    COUNT(DISTINCT t.id) as unique_transactions,
    COUNT(DISTINCT ti.id) as unique_transaction_items,
    COUNT(DISTINCT p.id) as unique_products_in_transactions,
    COUNT(DISTINCT b.id) as unique_brands_in_transactions,
    COUNT(DISTINCT s.id) as unique_stores_in_transactions
FROM transactions t
JOIN transaction_items ti ON t.id = ti.transaction_id
JOIN products p ON ti.product_id = p.id
JOIN brands b ON p.brand_id = b.id
JOIN stores s ON t.store_id = s.id;

-- 10.4 Revenue calculation consistency check
SELECT 'REVENUE CONSISTENCY' as check_type,
    SUM(total_amount) as transaction_total_revenue,
    SUM(ti.quantity * ti.price) as calculated_item_revenue,
    ABS(SUM(total_amount) - SUM(ti.quantity * ti.price)) as revenue_difference
FROM transactions t
JOIN transaction_items ti ON t.id = ti.transaction_id;

-- 10.5 Check for null or invalid data that could break filters
SELECT 'DATA QUALITY' as check_type, 'brands_missing_names' as issue, COUNT(*) as count
FROM brands WHERE name IS NULL OR name = ''

UNION ALL

SELECT 'DATA QUALITY', 'products_missing_names', COUNT(*)
FROM products WHERE name IS NULL OR name = ''

UNION ALL

SELECT 'DATA QUALITY', 'stores_missing_locations', COUNT(*)
FROM stores WHERE location IS NULL OR location = ''

UNION ALL

SELECT 'DATA QUALITY', 'negative_amounts', COUNT(*)
FROM transactions WHERE total_amount < 0

UNION ALL

SELECT 'DATA QUALITY', 'zero_quantity_items', COUNT(*)
FROM transaction_items WHERE quantity <= 0

UNION ALL

SELECT 'DATA QUALITY', 'negative_prices', COUNT(*)
FROM transaction_items WHERE price < 0;