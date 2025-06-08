-- Missing RPC Functions for Consumer Insights
-- These functions are referenced in the application but missing from database

-- Age Distribution Simple Function
CREATE OR REPLACE FUNCTION get_age_distribution_simple()
RETURNS TABLE(
    age_group TEXT,
    count BIGINT,
    percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN customer_age BETWEEN 18 AND 25 THEN '18-25'
            WHEN customer_age BETWEEN 26 AND 35 THEN '26-35'
            WHEN customer_age BETWEEN 36 AND 45 THEN '36-45'
            WHEN customer_age BETWEEN 46 AND 55 THEN '46-55'
            WHEN customer_age BETWEEN 56 AND 65 THEN '56-65'
            WHEN customer_age > 65 THEN '65+'
            ELSE 'Unknown'
        END as age_group,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM transactions WHERE customer_age IS NOT NULL)), 2) as percentage
    FROM transactions 
    WHERE customer_age IS NOT NULL
    GROUP BY 
        CASE 
            WHEN customer_age BETWEEN 18 AND 25 THEN '18-25'
            WHEN customer_age BETWEEN 26 AND 35 THEN '26-35'
            WHEN customer_age BETWEEN 36 AND 45 THEN '36-45'
            WHEN customer_age BETWEEN 46 AND 55 THEN '46-55'
            WHEN customer_age BETWEEN 56 AND 65 THEN '56-65'
            WHEN customer_age > 65 THEN '65+'
            ELSE 'Unknown'
        END
    ORDER BY 
        CASE 
            WHEN customer_age BETWEEN 18 AND 25 THEN 1
            WHEN customer_age BETWEEN 26 AND 35 THEN 2
            WHEN customer_age BETWEEN 36 AND 45 THEN 3
            WHEN customer_age BETWEEN 46 AND 55 THEN 4
            WHEN customer_age BETWEEN 56 AND 65 THEN 5
            WHEN customer_age > 65 THEN 6
            ELSE 7
        END;
END;
$$ LANGUAGE plpgsql;

-- Gender Distribution Simple Function
CREATE OR REPLACE FUNCTION get_gender_distribution_simple()
RETURNS TABLE(
    gender TEXT,
    count BIGINT,
    percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(customer_gender, 'Unknown') as gender,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM transactions)), 2) as percentage
    FROM transactions 
    GROUP BY customer_gender
    ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql;

-- Weekly Dashboard Summary Function
CREATE OR REPLACE FUNCTION get_dashboard_summary_weekly(
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL,
    p_store_id INTEGER DEFAULT NULL
)
RETURNS TABLE(
    week_start DATE,
    week_end DATE,
    week_number INTEGER,
    total_revenue NUMERIC,
    total_transactions BIGINT,
    avg_transaction NUMERIC,
    unique_customers BIGINT,
    suggestion_acceptance_rate NUMERIC,
    substitution_rate NUMERIC,
    suggestions_offered BIGINT,
    suggestions_accepted BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        date_trunc('week', t.created_at::date)::date as week_start,
        (date_trunc('week', t.created_at::date) + interval '6 days')::date as week_end,
        EXTRACT(week FROM t.created_at)::integer as week_number,
        COALESCE(SUM(t.total_amount), 0) as total_revenue,
        COUNT(*)::bigint as total_transactions,
        COALESCE(AVG(t.total_amount), 0) as avg_transaction,
        COUNT(DISTINCT t.customer_id)::bigint as unique_customers,
        0::numeric as suggestion_acceptance_rate, -- Placeholder - implement when suggestion data available
        0::numeric as substitution_rate, -- Placeholder - implement when substitution data available
        0::bigint as suggestions_offered, -- Placeholder
        0::bigint as suggestions_accepted -- Placeholder
    FROM transactions t
    WHERE 
        (p_start_date IS NULL OR t.created_at::date >= p_start_date) AND
        (p_end_date IS NULL OR t.created_at::date <= p_end_date) AND
        (p_store_id IS NULL OR t.store_id = p_store_id)
    GROUP BY 
        date_trunc('week', t.created_at::date),
        EXTRACT(week FROM t.created_at)
    ORDER BY week_start DESC
    LIMIT 12; -- Last 12 weeks
END;
$$ LANGUAGE plpgsql;

-- Consumer Profile Function (Enhanced)
CREATE OR REPLACE FUNCTION get_consumer_profile()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'age_distribution', (
            SELECT json_agg(
                json_build_object(
                    'age_group', age_group,
                    'count', count,
                    'percentage', percentage
                )
            )
            FROM get_age_distribution_simple()
        ),
        'gender_distribution', (
            SELECT json_agg(
                json_build_object(
                    'gender', gender,
                    'count', count,
                    'percentage', percentage
                )
            )
            FROM get_gender_distribution_simple()
        ),
        'age_gender_matrix', (
            SELECT json_agg(
                json_build_object(
                    'age_group', 
                    CASE 
                        WHEN customer_age BETWEEN 18 AND 25 THEN '18-25'
                        WHEN customer_age BETWEEN 26 AND 35 THEN '26-35'
                        WHEN customer_age BETWEEN 36 AND 45 THEN '36-45'
                        WHEN customer_age BETWEEN 46 AND 55 THEN '46-55'
                        WHEN customer_age BETWEEN 56 AND 65 THEN '56-65'
                        WHEN customer_age > 65 THEN '65+'
                        ELSE 'Unknown'
                    END,
                    'gender', COALESCE(customer_gender, 'Unknown'),
                    'count', count,
                    'avg_spending', avg_spending
                )
            )
            FROM (
                SELECT 
                    customer_age,
                    customer_gender,
                    COUNT(*) as count,
                    ROUND(AVG(total_amount), 2) as avg_spending
                FROM transactions 
                WHERE customer_age IS NOT NULL
                GROUP BY customer_age, customer_gender
            ) matrix
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Dashboard Summary Function (if missing)
CREATE OR REPLACE FUNCTION get_dashboard_summary(
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL,
    p_store_id INTEGER DEFAULT NULL
)
RETURNS TABLE(
    total_revenue NUMERIC,
    total_transactions BIGINT,
    avg_transaction NUMERIC,
    unique_customers BIGINT,
    suggestion_acceptance_rate NUMERIC,
    substitution_rate NUMERIC,
    suggestions_offered BIGINT,
    suggestions_accepted BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(t.total_amount), 0) as total_revenue,
        COUNT(*)::bigint as total_transactions,
        COALESCE(AVG(t.total_amount), 0) as avg_transaction,
        COUNT(DISTINCT t.customer_id)::bigint as unique_customers,
        0::numeric as suggestion_acceptance_rate, -- Placeholder
        0::numeric as substitution_rate, -- Placeholder
        0::bigint as suggestions_offered, -- Placeholder
        0::bigint as suggestions_accepted -- Placeholder
    FROM transactions t
    WHERE 
        (p_start_date IS NULL OR t.created_at::date >= p_start_date) AND
        (p_end_date IS NULL OR t.created_at::date <= p_end_date) AND
        (p_store_id IS NULL OR t.store_id = p_store_id);
END;
$$ LANGUAGE plpgsql;

-- Add missing view if it doesn't exist
CREATE OR REPLACE VIEW brand_analytics AS
SELECT 
    b.id as brand_id,
    b.name as brand_name,
    b.category,
    b.is_tbwa,
    COUNT(DISTINCT t.id) as transaction_count,
    SUM(t.total_amount) as total_revenue,
    AVG(t.total_amount) as avg_transaction_value,
    COUNT(DISTINCT t.customer_id) as unique_customers
FROM brands b
LEFT JOIN transaction_items ti ON b.id = ti.brand_id
LEFT JOIN transactions t ON ti.transaction_id = t.id
GROUP BY b.id, b.name, b.category, b.is_tbwa
ORDER BY total_revenue DESC NULLS LAST;