-- Fix RPC functions to use correct column names from the transactions table

-- Drop and recreate get_age_distribution_simple with correct column names
DROP FUNCTION IF EXISTS get_age_distribution_simple();

CREATE OR REPLACE FUNCTION get_age_distribution_simple()
RETURNS TABLE(age_group TEXT, count BIGINT, percentage NUMERIC) AS $$
BEGIN
    -- Use customer_age column which exists in transactions table
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
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate get_gender_distribution_simple with correct column names
DROP FUNCTION IF EXISTS get_gender_distribution_simple();

CREATE OR REPLACE FUNCTION get_gender_distribution_simple()
RETURNS TABLE(gender TEXT, count BIGINT, percentage NUMERIC) AS $$
BEGIN
    -- Use customer_gender column which exists in transactions table
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

-- Drop conflicting get_dashboard_summary_weekly functions and create a single one
DROP FUNCTION IF EXISTS get_dashboard_summary_weekly(timestamp without time zone, timestamp without time zone);
DROP FUNCTION IF EXISTS get_dashboard_summary_weekly(date, date, integer);
DROP FUNCTION IF EXISTS get_dashboard_summary_weekly();

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
        COUNT(DISTINCT COALESCE(t.customer_id, t.id))::bigint as unique_customers,
        CASE 
            WHEN COUNT(CASE WHEN COALESCE(t.suggestion_offered, false) THEN 1 END) > 0 
            THEN (COUNT(CASE WHEN COALESCE(t.suggestion_accepted, false) THEN 1 END)::NUMERIC / COUNT(CASE WHEN COALESCE(t.suggestion_offered, false) THEN 1 END) * 100)
            ELSE 0::NUMERIC
        END as suggestion_acceptance_rate,
        CASE 
            WHEN COUNT(*) > 0 
            THEN (COUNT(CASE WHEN COALESCE(t.substitution_occurred, false) THEN 1 END)::NUMERIC / COUNT(*) * 100)
            ELSE 0::NUMERIC
        END as substitution_rate,
        COUNT(CASE WHEN COALESCE(t.suggestion_offered, false) THEN 1 END)::bigint as suggestions_offered,
        COUNT(CASE WHEN COALESCE(t.suggestion_accepted, false) THEN 1 END)::bigint as suggestions_accepted
    FROM transactions t
    WHERE 
        (p_start_date IS NULL OR t.created_at::date >= p_start_date) AND
        (p_end_date IS NULL OR t.created_at::date <= p_end_date) AND
        (p_store_id IS NULL OR t.store_id = p_store_id)
    GROUP BY 
        date_trunc('week', t.created_at::date),
        EXTRACT(week FROM t.created_at)
    ORDER BY week_start DESC
    LIMIT 12;
END;
$$ LANGUAGE plpgsql;