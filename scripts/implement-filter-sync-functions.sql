-- FILTER SYNCHRONIZATION RPC FUNCTIONS
-- These ensure frontend filters always match actual database data
-- Run this in Supabase SQL Editor

-- =====================================================
-- FUNCTION 1: Get All Filter Options (Database-First)
-- =====================================================

CREATE OR REPLACE FUNCTION get_filter_options()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'categories', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'value', category,
                    'label', category,
                    'count', usage_count
                )
            )
            FROM (
                SELECT 
                    b.category,
                    COUNT(DISTINCT t.id) as usage_count
                FROM brands b
                JOIN products p ON b.id = p.brand_id
                JOIN transaction_items ti ON p.id = ti.product_id
                JOIN transactions t ON ti.transaction_id = t.id
                WHERE b.category IS NOT NULL
                GROUP BY b.category
                ORDER BY usage_count DESC
            ) cat_data
        ),
        'brands', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'value', id::text,
                    'label', name,
                    'category', category,
                    'is_tbwa', COALESCE(is_tbwa, false),
                    'count', usage_count
                )
            )
            FROM (
                SELECT 
                    b.id,
                    b.name,
                    b.category,
                    b.is_tbwa,
                    COUNT(DISTINCT t.id) as usage_count
                FROM brands b
                JOIN products p ON b.id = p.brand_id
                JOIN transaction_items ti ON p.id = ti.product_id
                JOIN transactions t ON ti.transaction_id = t.id
                WHERE b.name IS NOT NULL
                GROUP BY b.id, b.name, b.category, b.is_tbwa
                ORDER BY usage_count DESC
            ) brand_data
        ),
        'products', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'value', id::text,
                    'label', name,
                    'brand_id', brand_id::text,
                    'brand_name', brand_name,
                    'category', category,
                    'count', usage_count
                )
            )
            FROM (
                SELECT 
                    p.id,
                    p.name,
                    p.brand_id,
                    b.name as brand_name,
                    b.category,
                    COUNT(DISTINCT t.id) as usage_count
                FROM products p
                JOIN brands b ON p.brand_id = b.id
                JOIN transaction_items ti ON p.id = ti.product_id
                JOIN transactions t ON ti.transaction_id = t.id
                WHERE p.name IS NOT NULL
                GROUP BY p.id, p.name, p.brand_id, b.name, b.category
                ORDER BY usage_count DESC
            ) product_data
        ),
        'locations', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'value', location,
                    'label', location,
                    'store_count', store_count,
                    'transaction_count', usage_count
                )
            )
            FROM (
                SELECT 
                    s.location,
                    COUNT(DISTINCT s.id) as store_count,
                    COUNT(DISTINCT t.id) as usage_count
                FROM stores s
                JOIN transactions t ON s.id = t.store_id
                WHERE s.location IS NOT NULL
                GROUP BY s.location
                ORDER BY usage_count DESC
            ) location_data
        ),
        'tbwa_analysis', (
            SELECT jsonb_build_object(
                'total_brands', COUNT(*),
                'tbwa_brands', COUNT(CASE WHEN is_tbwa = true THEN 1 END),
                'competitor_brands', COUNT(CASE WHEN is_tbwa = false THEN 1 END),
                'categories_with_tbwa', COUNT(DISTINCT CASE WHEN is_tbwa = true THEN category END)
            )
            FROM brands
            WHERE name IS NOT NULL
        )
    ) INTO result;
    
    RETURN result;
END;
$$;

-- =====================================================
-- FUNCTION 2: Validate Filter Combination
-- =====================================================

CREATE OR REPLACE FUNCTION validate_filter_combination(
    p_categories TEXT[] DEFAULT NULL,
    p_brands TEXT[] DEFAULT NULL,
    p_products TEXT[] DEFAULT NULL,
    p_locations TEXT[] DEFAULT NULL,
    p_tbwa_only BOOLEAN DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    transaction_count INT;
BEGIN
    -- Count transactions that match the filter combination
    SELECT COUNT(DISTINCT t.id) INTO transaction_count
    FROM transactions t
    JOIN stores s ON t.store_id = s.id
    JOIN transaction_items ti ON t.id = ti.transaction_id
    JOIN products p ON ti.product_id = p.id
    JOIN brands b ON p.brand_id = b.id
    WHERE (p_categories IS NULL OR b.category = ANY(p_categories))
        AND (p_brands IS NULL OR b.id::text = ANY(p_brands))
        AND (p_products IS NULL OR p.id::text = ANY(p_products))
        AND (p_locations IS NULL OR s.location = ANY(p_locations))
        AND (p_tbwa_only IS NULL OR b.is_tbwa = p_tbwa_only);

    -- Return validation result
    SELECT jsonb_build_object(
        'is_valid', transaction_count > 0,
        'transaction_count', transaction_count,
        'filters_applied', jsonb_build_object(
            'categories', COALESCE(array_length(p_categories, 1), 0),
            'brands', COALESCE(array_length(p_brands, 1), 0),
            'products', COALESCE(array_length(p_products, 1), 0),
            'locations', COALESCE(array_length(p_locations, 1), 0),
            'tbwa_only', p_tbwa_only
        ),
        'message', CASE 
            WHEN transaction_count > 0 THEN 'Filter combination is valid'
            ELSE 'No data matches this filter combination'
        END
    ) INTO result;
    
    RETURN result;
END;
$$;

-- =====================================================
-- FUNCTION 3: Get Cascading Filter Options
-- =====================================================

CREATE OR REPLACE FUNCTION get_cascading_filter_options(
    p_selected_categories TEXT[] DEFAULT NULL,
    p_selected_brands TEXT[] DEFAULT NULL,
    p_selected_products TEXT[] DEFAULT NULL,
    p_selected_locations TEXT[] DEFAULT NULL,
    p_tbwa_only BOOLEAN DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Returns available options based on current selections
    -- This ensures filters only show options that have data
    
    WITH filtered_base AS (
        SELECT DISTINCT
            t.id as transaction_id,
            b.id as brand_id,
            b.name as brand_name,
            b.category,
            b.is_tbwa,
            p.id as product_id,
            p.name as product_name,
            s.location
        FROM transactions t
        JOIN stores s ON t.store_id = s.id
        JOIN transaction_items ti ON t.id = ti.transaction_id
        JOIN products p ON ti.product_id = p.id
        JOIN brands b ON p.brand_id = b.id
        WHERE (p_selected_categories IS NULL OR b.category = ANY(p_selected_categories))
            AND (p_selected_brands IS NULL OR b.id::text = ANY(p_selected_brands))
            AND (p_selected_products IS NULL OR p.id::text = ANY(p_selected_products))
            AND (p_selected_locations IS NULL OR s.location = ANY(p_selected_locations))
            AND (p_tbwa_only IS NULL OR b.is_tbwa = p_tbwa_only)
    )
    SELECT jsonb_build_object(
        'available_categories', (
            SELECT jsonb_agg(DISTINCT category)
            FROM filtered_base
            WHERE category IS NOT NULL
        ),
        'available_brands', (
            SELECT jsonb_agg(DISTINCT jsonb_build_object(
                'id', brand_id::text,
                'name', brand_name,
                'category', category,
                'is_tbwa', is_tbwa
            ))
            FROM filtered_base
            WHERE brand_name IS NOT NULL
        ),
        'available_products', (
            SELECT jsonb_agg(DISTINCT jsonb_build_object(
                'id', product_id::text,
                'name', product_name,
                'brand_id', brand_id::text
            ))
            FROM filtered_base
            WHERE product_name IS NOT NULL
        ),
        'available_locations', (
            SELECT jsonb_agg(DISTINCT location)
            FROM filtered_base
            WHERE location IS NOT NULL
        ),
        'tbwa_breakdown', (
            SELECT jsonb_build_object(
                'tbwa_transactions', COUNT(CASE WHEN is_tbwa = true THEN transaction_id END),
                'competitor_transactions', COUNT(CASE WHEN is_tbwa = false THEN transaction_id END),
                'total_transactions', COUNT(DISTINCT transaction_id)
            )
            FROM filtered_base
        ),
        'total_matching_transactions', (
            SELECT COUNT(DISTINCT transaction_id)
            FROM filtered_base
        )
    ) INTO result;
    
    RETURN result;
END;
$$;

-- =====================================================
-- FUNCTION 4: Database Health Check for Filters
-- =====================================================

CREATE OR REPLACE FUNCTION check_filter_data_health()
RETURNS TABLE (
    check_name TEXT,
    status TEXT,
    details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check 1: Orphaned Records
    RETURN QUERY
    SELECT 
        'orphaned_records'::TEXT,
        CASE WHEN orphan_count > 0 THEN 'WARNING' ELSE 'OK' END::TEXT,
        jsonb_build_object(
            'orphaned_transaction_items', orphan_count,
            'description', 'Transaction items without valid transactions'
        )
    FROM (
        SELECT COUNT(*) as orphan_count
        FROM transaction_items ti 
        LEFT JOIN transactions t ON ti.transaction_id = t.id 
        WHERE t.id IS NULL
    ) x;

    -- Check 2: Missing Filter Data
    RETURN QUERY
    SELECT 
        'missing_filter_data'::TEXT,
        CASE WHEN missing_count > 0 THEN 'WARNING' ELSE 'OK' END::TEXT,
        jsonb_build_object(
            'brands_without_category', missing_count,
            'description', 'Brands missing category information'
        )
    FROM (
        SELECT COUNT(*) as missing_count
        FROM brands 
        WHERE category IS NULL OR category = ''
    ) x;

    -- Check 3: Data Freshness
    RETURN QUERY
    SELECT 
        'data_freshness'::TEXT,
        CASE 
            WHEN last_update < NOW() - INTERVAL '1 day' THEN 'WARNING'
            WHEN last_update < NOW() - INTERVAL '1 hour' THEN 'OK'
            ELSE 'EXCELLENT'
        END::TEXT,
        jsonb_build_object(
            'last_transaction', last_update,
            'hours_since_update', EXTRACT(EPOCH FROM (NOW() - last_update))/3600,
            'description', 'Time since last transaction'
        )
    FROM (
        SELECT MAX(created_at) as last_update FROM transactions
    ) x;

    -- Check 4: TBWA Brand Distribution
    RETURN QUERY
    SELECT 
        'tbwa_distribution'::TEXT,
        CASE 
            WHEN tbwa_count >= 20 AND competitor_count >= 10 THEN 'EXCELLENT'
            WHEN tbwa_count >= 10 THEN 'OK'
            ELSE 'WARNING'
        END::TEXT,
        jsonb_build_object(
            'tbwa_brands', tbwa_count,
            'competitor_brands', competitor_count,
            'total_brands', total_brands,
            'tbwa_percentage', ROUND((tbwa_count::DECIMAL / total_brands * 100), 2),
            'description', 'TBWA vs competitor brand distribution'
        )
    FROM (
        SELECT 
            COUNT(CASE WHEN is_tbwa = true THEN 1 END) as tbwa_count,
            COUNT(CASE WHEN is_tbwa = false THEN 1 END) as competitor_count,
            COUNT(*) as total_brands
        FROM brands
    ) x;

    -- Check 5: Filter Completeness
    RETURN QUERY
    SELECT 
        'filter_completeness'::TEXT,
        'OK'::TEXT,
        jsonb_build_object(
            'total_categories', (SELECT COUNT(DISTINCT category) FROM brands WHERE category IS NOT NULL),
            'total_brands', (SELECT COUNT(*) FROM brands),
            'total_products', (SELECT COUNT(*) FROM products),
            'total_locations', (SELECT COUNT(DISTINCT location) FROM stores WHERE location IS NOT NULL),
            'description', 'Available filter options count'
        );
END;
$$;

-- =====================================================
-- FUNCTION 5: Enhanced Brand Analysis for Filters
-- =====================================================

CREATE OR REPLACE FUNCTION get_brand_analysis_for_filters(
    p_category TEXT DEFAULT NULL,
    p_tbwa_only BOOLEAN DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    WITH brand_metrics AS (
        SELECT 
            b.id,
            b.name,
            b.category,
            b.is_tbwa,
            COUNT(DISTINCT t.id) as transaction_count,
            COUNT(DISTINCT ti.id) as item_count,
            SUM(ti.quantity * ti.price) as total_revenue,
            COUNT(DISTINCT p.id) as product_count
        FROM brands b
        JOIN products p ON b.id = p.brand_id
        JOIN transaction_items ti ON p.id = ti.product_id
        JOIN transactions t ON ti.transaction_id = t.id
        WHERE (p_category IS NULL OR b.category = p_category)
            AND (p_tbwa_only IS NULL OR b.is_tbwa = p_tbwa_only)
        GROUP BY b.id, b.name, b.category, b.is_tbwa
    )
    SELECT jsonb_build_object(
        'brands', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'name', name,
                    'category', category,
                    'is_tbwa', is_tbwa,
                    'metrics', jsonb_build_object(
                        'transactions', transaction_count,
                        'items', item_count,
                        'revenue', total_revenue,
                        'products', product_count
                    )
                )
            )
            FROM brand_metrics
            ORDER BY total_revenue DESC
        ),
        'summary', (
            SELECT jsonb_build_object(
                'total_brands', COUNT(*),
                'total_transactions', SUM(transaction_count),
                'total_revenue', SUM(total_revenue),
                'avg_revenue_per_brand', AVG(total_revenue),
                'top_brand', (
                    SELECT name FROM brand_metrics ORDER BY total_revenue DESC LIMIT 1
                )
            )
            FROM brand_metrics
        )
    ) INTO result;
    
    RETURN result;
END;
$$;

-- =====================================================
-- Test the functions
-- =====================================================

-- Test filter options
SELECT 'Testing get_filter_options...' as test;
SELECT get_filter_options();

-- Test validation
SELECT 'Testing validate_filter_combination...' as test;
SELECT validate_filter_combination(
    ARRAY['Dairy', 'Snacks'], 
    NULL, 
    NULL, 
    NULL, 
    true
);

-- Test health check
SELECT 'Testing check_filter_data_health...' as test;
SELECT * FROM check_filter_data_health();

-- Test brand analysis
SELECT 'Testing get_brand_analysis_for_filters...' as test;
SELECT get_brand_analysis_for_filters('Snacks', true);