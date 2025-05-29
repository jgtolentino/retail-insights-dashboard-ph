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