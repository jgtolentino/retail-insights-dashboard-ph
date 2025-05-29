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