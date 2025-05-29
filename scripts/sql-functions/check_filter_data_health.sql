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