-- Fix Consumer Insights Database Functions and Permissions
-- This script addresses the failing data connection tests

-- 1. First, let's check what functions exist
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_age_distribution', 'get_gender_distribution');

-- 2. Drop existing functions if they exist (to recreate with proper signatures)
DROP FUNCTION IF EXISTS public.get_age_distribution(TIMESTAMPTZ, TIMESTAMPTZ, INT);
DROP FUNCTION IF EXISTS public.get_age_distribution(TEXT, TEXT, INT);
DROP FUNCTION IF EXISTS public.get_age_distribution(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_gender_distribution(TIMESTAMPTZ, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.get_gender_distribution(TEXT, TEXT);

-- 3. Create Age Distribution Function with proper signature
CREATE OR REPLACE FUNCTION public.get_age_distribution(
    start_date TIMESTAMPTZ DEFAULT '2025-01-01'::TIMESTAMPTZ,
    end_date TIMESTAMPTZ DEFAULT '2025-12-31'::TIMESTAMPTZ,
    bucket_size INT DEFAULT 10
)
RETURNS TABLE (
    age_bucket TEXT,
    customer_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN customer_age IS NULL THEN 'Unknown'
            ELSE (FLOOR(customer_age / bucket_size) * bucket_size)::TEXT || '-' || 
                 (FLOOR(customer_age / bucket_size) * bucket_size + bucket_size - 1)::TEXT
        END as age_bucket,
        COUNT(DISTINCT id)::BIGINT as customer_count
    FROM public.transactions
    WHERE created_at >= start_date 
    AND created_at <= end_date
    AND customer_age IS NOT NULL
    GROUP BY 
        CASE 
            WHEN customer_age IS NULL THEN 'Unknown'
            ELSE (FLOOR(customer_age / bucket_size) * bucket_size)::TEXT || '-' || 
                 (FLOOR(customer_age / bucket_size) * bucket_size + bucket_size - 1)::TEXT
        END
    ORDER BY MIN(customer_age);
END;
$$;

-- 4. Create Gender Distribution Function with proper signature
CREATE OR REPLACE FUNCTION public.get_gender_distribution(
    start_date TIMESTAMPTZ DEFAULT '2025-01-01'::TIMESTAMPTZ,
    end_date TIMESTAMPTZ DEFAULT '2025-12-31'::TIMESTAMPTZ
)
RETURNS TABLE (
    gender TEXT,
    customer_count BIGINT,
    total_revenue NUMERIC,
    percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_customers BIGINT;
BEGIN
    -- Get total customer count for percentage calculation
    SELECT COUNT(DISTINCT id) INTO total_customers
    FROM public.transactions
    WHERE created_at >= start_date 
    AND created_at <= end_date
    AND customer_gender IS NOT NULL;
    
    RETURN QUERY
    SELECT 
        COALESCE(customer_gender, 'Unknown') as gender,
        COUNT(DISTINCT id)::BIGINT as customer_count,
        COALESCE(SUM(total_amount), 0)::NUMERIC as total_revenue,
        CASE 
            WHEN total_customers > 0 THEN 
                ROUND((COUNT(DISTINCT id)::NUMERIC / total_customers::NUMERIC) * 100, 2)
            ELSE 0
        END as percentage
    FROM public.transactions
    WHERE created_at >= start_date 
    AND created_at <= end_date
    AND customer_gender IS NOT NULL
    GROUP BY customer_gender
    ORDER BY customer_count DESC;
END;
$$;

-- 5. Grant execute permissions to public (anon users)
GRANT EXECUTE ON FUNCTION public.get_age_distribution(TIMESTAMPTZ, TIMESTAMPTZ, INT) TO public;
GRANT EXECUTE ON FUNCTION public.get_gender_distribution(TIMESTAMPTZ, TIMESTAMPTZ) TO public;

-- 6. Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_age_distribution(TIMESTAMPTZ, TIMESTAMPTZ, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_gender_distribution(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

-- 7. Ensure RLS policies allow reading transactions
-- First check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'transactions';

-- Enable RLS if not already enabled and create permissive policy
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "public_read_transactions" ON public.transactions;
DROP POLICY IF EXISTS "allow_read_transactions" ON public.transactions;

-- Create a permissive read policy for transactions
CREATE POLICY "allow_read_transactions" 
ON public.transactions 
FOR SELECT 
USING (true);

-- 8. Test the functions with sample data
SELECT 'Testing Age Distribution Function:' as test_name;
SELECT * FROM public.get_age_distribution(
    '2025-01-01'::TIMESTAMPTZ, 
    '2025-12-31'::TIMESTAMPTZ, 
    10
) LIMIT 5;

SELECT 'Testing Gender Distribution Function:' as test_name;
SELECT * FROM public.get_gender_distribution(
    '2025-01-01'::TIMESTAMPTZ, 
    '2025-12-31'::TIMESTAMPTZ
) LIMIT 5;

-- 9. Test raw transaction data access
SELECT 'Testing Raw Transaction Data:' as test_name;
SELECT 
    COUNT(*) as total_transactions,
    MIN(created_at) as earliest_date,
    MAX(created_at) as latest_date,
    COUNT(DISTINCT customer_age) as unique_ages,
    COUNT(DISTINCT customer_gender) as unique_genders
FROM public.transactions
WHERE created_at >= '2025-01-01'::TIMESTAMPTZ 
AND created_at <= '2025-12-31'::TIMESTAMPTZ;

-- 10. Show function signatures for verification
SELECT 
    routine_name,
    string_agg(
        parameter_name || ' ' || data_type || 
        CASE WHEN parameter_default IS NOT NULL THEN ' DEFAULT ' || parameter_default ELSE '' END,
        ', ' ORDER BY ordinal_position
    ) as parameters
FROM information_schema.parameters 
WHERE specific_schema = 'public' 
AND specific_name IN (
    SELECT specific_name 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name IN ('get_age_distribution', 'get_gender_distribution')
)
GROUP BY routine_name, specific_name
ORDER BY routine_name;
