-- Create missing RPC functions for the dashboard
-- Run this in Supabase SQL Editor

-- 1. Create get_dashboard_summary function
CREATE OR REPLACE FUNCTION get_dashboard_summary()
RETURNS TABLE (
    total_revenue NUMERIC,
    total_transactions INTEGER,
    avg_transaction NUMERIC,
    unique_customers INTEGER,
    suggestion_acceptance_rate NUMERIC,
    substitution_rate NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(t.total_amount), 0) as total_revenue,
        COUNT(DISTINCT t.id) as total_transactions,
        COALESCE(AVG(t.total_amount), 0) as avg_transaction,
        COUNT(DISTINCT t.customer_age || '-' || t.customer_gender) as unique_customers,
        COALESCE(
            (COUNT(CASE WHEN t.suggestion_accepted = true THEN 1 END)::NUMERIC / 
             NULLIF(COUNT(CASE WHEN t.suggestion_accepted IS NOT NULL THEN 1 END), 0)) * 100, 
            0
        ) as suggestion_acceptance_rate,
        COALESCE(
            (COUNT(DISTINCT s.transaction_id)::NUMERIC / 
             NULLIF(COUNT(DISTINCT t.id), 0)) * 100,
            0
        ) as substitution_rate
    FROM transactions t
    LEFT JOIN substitutions s ON s.transaction_id = t.id;
END;
$$;

-- 2. Create get_dashboard_summary_weekly function
CREATE OR REPLACE FUNCTION get_dashboard_summary_weekly()
RETURNS TABLE (
    week_start DATE,
    total_revenue NUMERIC,
    transaction_count INTEGER,
    avg_transaction NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE_TRUNC('week', t.created_at)::DATE as week_start,
        SUM(t.total_amount) as total_revenue,
        COUNT(t.id) as transaction_count,
        AVG(t.total_amount) as avg_transaction
    FROM transactions t
    WHERE t.created_at >= CURRENT_DATE - INTERVAL '12 weeks'
    GROUP BY DATE_TRUNC('week', t.created_at)
    ORDER BY week_start DESC;
END;
$$;

-- 3. Create get_age_distribution_simple function
CREATE OR REPLACE FUNCTION get_age_distribution_simple()
RETURNS TABLE (
    age_group TEXT,
    customer_count INTEGER,
    percentage NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH age_groups AS (
        SELECT 
            CASE 
                WHEN customer_age < 25 THEN '18-24'
                WHEN customer_age < 35 THEN '25-34'
                WHEN customer_age < 45 THEN '35-44'
                WHEN customer_age < 55 THEN '45-54'
                ELSE '55+'
            END as age_group,
            COUNT(*) as count
        FROM transactions
        WHERE customer_age IS NOT NULL
        GROUP BY 1
    )
    SELECT 
        ag.age_group,
        ag.count::INTEGER as customer_count,
        ROUND((ag.count::NUMERIC / SUM(ag.count) OVER ()) * 100, 2) as percentage
    FROM age_groups ag
    ORDER BY 
        CASE ag.age_group
            WHEN '18-24' THEN 1
            WHEN '25-34' THEN 2
            WHEN '35-44' THEN 3
            WHEN '45-54' THEN 4
            WHEN '55+' THEN 5
        END;
END;
$$;

-- 4. Create get_gender_distribution_simple function
CREATE OR REPLACE FUNCTION get_gender_distribution_simple()
RETURNS TABLE (
    gender TEXT,
    customer_count INTEGER,
    percentage NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(customer_gender, 'Unknown') as gender,
        COUNT(*)::INTEGER as customer_count,
        ROUND((COUNT(*)::NUMERIC / SUM(COUNT(*)) OVER ()) * 100, 2) as percentage
    FROM transactions
    GROUP BY customer_gender
    ORDER BY customer_count DESC;
END;
$$;

-- 5. Create get_consumer_profile function
CREATE OR REPLACE FUNCTION get_consumer_profile()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    WITH age_dist AS (
        SELECT json_agg(row_to_json(t)) as data
        FROM (
            SELECT 
                CASE 
                    WHEN customer_age < 25 THEN '18-24'
                    WHEN customer_age < 35 THEN '25-34'
                    WHEN customer_age < 45 THEN '35-44'
                    WHEN customer_age < 55 THEN '45-54'
                    ELSE '55+'
                END as age_group,
                COUNT(*) as count
            FROM transactions
            WHERE customer_age IS NOT NULL
            GROUP BY 1
        ) t
    ),
    gender_dist AS (
        SELECT json_agg(row_to_json(t)) as data
        FROM (
            SELECT 
                COALESCE(customer_gender, 'Unknown') as gender,
                COUNT(*) as count
            FROM transactions
            GROUP BY customer_gender
        ) t
    ),
    age_gender_matrix AS (
        SELECT json_agg(row_to_json(t)) as data
        FROM (
            SELECT 
                CASE 
                    WHEN customer_age < 25 THEN '18-24'
                    WHEN customer_age < 35 THEN '25-34'
                    WHEN customer_age < 45 THEN '35-44'
                    WHEN customer_age < 55 THEN '45-54'
                    ELSE '55+'
                END as age_group,
                COALESCE(customer_gender, 'Unknown') as gender,
                COUNT(*) as count
            FROM transactions
            WHERE customer_age IS NOT NULL
            GROUP BY 1, 2
        ) t
    )
    SELECT json_build_object(
        'age_distribution', COALESCE((SELECT data FROM age_dist), '[]'::json),
        'gender_distribution', COALESCE((SELECT data FROM gender_dist), '[]'::json),
        'age_gender_matrix', COALESCE((SELECT data FROM age_gender_matrix), '[]'::json)
    ) INTO result;
    
    RETURN result;
END;
$$;

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION get_dashboard_summary TO anon;
GRANT EXECUTE ON FUNCTION get_dashboard_summary_weekly TO anon;
GRANT EXECUTE ON FUNCTION get_age_distribution_simple TO anon;
GRANT EXECUTE ON FUNCTION get_gender_distribution_simple TO anon;
GRANT EXECUTE ON FUNCTION get_consumer_profile TO anon;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'All RPC functions created successfully!';
END $$;