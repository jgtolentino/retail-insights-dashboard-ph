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