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