-- 🚀 COMPLETE DATA IMPORT SCRIPT
-- Run this in your Supabase SQL Editor
-- This combines all scripts in the correct execution order

-- =====================================================
-- STEP 1: RUN HIERARCHICAL STRUCTURE
-- =====================================================
-- Copy and run the content from: scripts/create_hierarchical_structure.sql

-- =====================================================
-- STEP 2: RUN TBWA COMPLETE BRANDS
-- =====================================================
-- Copy and run the content from: scripts/tbwa_complete_brands_structure.sql

-- =====================================================
-- STEP 3: RUN PHILIPPINE DATA GENERATION
-- =====================================================
-- Copy and run the content from: scripts/generate_philippine_data.sql

-- =====================================================
-- FINAL VERIFICATION
-- =====================================================

-- After running all scripts, verify with these queries:

-- 1. Check TBWA Brand Coverage
SELECT 
    'TBWA Portfolio Check' as check_type,
    COUNT(DISTINCT c.id) as companies,
    COUNT(DISTINCT b.id) as brands,
    COUNT(DISTINCT p.id) as products,
    COUNT(DISTINCT sv.id) as skus
FROM companies c
JOIN brands b ON c.id = b.company_id
LEFT JOIN products p ON b.id = p.brand_id
LEFT JOIN sku_variants sv ON p.id = sv.product_id
WHERE c.is_tbwa_client = true;

-- 2. Check Geographic Coverage
SELECT 
    'Geographic Coverage' as check_type,
    COUNT(DISTINCT region) as regions,
    COUNT(DISTINCT province) as provinces,
    COUNT(DISTINCT city_municipality) as cities,
    COUNT(DISTINCT barangay) as barangays,
    COUNT(DISTINCT id) as total_stores
FROM stores;

-- 3. Check Transaction Data
SELECT 
    'Transaction Data' as check_type,
    COUNT(*) as total_transactions,
    MIN(created_at)::DATE as earliest_date,
    MAX(created_at)::DATE as latest_date,
    ROUND(AVG(amount), 2) as avg_transaction,
    COUNT(DISTINCT store_id) as active_stores
FROM transactions
WHERE created_at >= '2024-06-01';

-- 4. Show TBWA Brands with Products
SELECT 
    c.name as company,
    b.name as brand,
    COUNT(DISTINCT p.id) as products,
    COUNT(DISTINCT sv.id) as skus,
    STRING_AGG(DISTINCT b.category, ', ') as categories
FROM companies c
JOIN brands b ON c.id = b.company_id
LEFT JOIN products p ON b.id = p.brand_id
LEFT JOIN sku_variants sv ON p.id = sv.product_id
WHERE c.is_tbwa_client = true
GROUP BY c.name, b.name
ORDER BY c.name, b.name;

-- 5. Show Competitive Landscape
SELECT 
    b.category,
    COUNT(CASE WHEN c.is_tbwa_client THEN 1 END) as tbwa_brands,
    COUNT(CASE WHEN NOT c.is_tbwa_client THEN 1 END) as competitor_brands,
    ROUND(100.0 * COUNT(CASE WHEN c.is_tbwa_client THEN 1 END) / COUNT(*), 1) as tbwa_share_pct
FROM brands b
JOIN companies c ON b.company_id = c.id
GROUP BY b.category
ORDER BY b.category;