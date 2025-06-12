-- Manual RPC Function Fixes
-- Copy and paste this into Supabase SQL Editor

-- Fix get_age_distribution_simple
DROP FUNCTION IF EXISTS get_age_distribution_simple();

CREATE OR REPLACE FUNCTION get_age_distribution_simple()
RETURNS TABLE(age_group TEXT, count BIGINT, percentage NUMERIC) AS $$
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
        ROUND((COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM transactions WHERE customer_age IS NOT NULL), 0)), 2) as percentage
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

-- Fix get_gender_distribution_simple
DROP FUNCTION IF EXISTS get_gender_distribution_simple();

CREATE OR REPLACE FUNCTION get_gender_distribution_simple()
RETURNS TABLE(gender TEXT, count BIGINT, percentage NUMERIC) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(customer_gender, 'Unknown') as gender,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM transactions), 0)), 2) as percentage
    FROM transactions 
    GROUP BY customer_gender
    ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql;