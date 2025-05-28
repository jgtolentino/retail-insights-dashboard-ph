-- Fix Age Distribution Function Conflict
-- This resolves the "Could not choose the best candidate function" error

-- Drop existing conflicting functions
DROP FUNCTION IF EXISTS public.get_age_distribution(timestamp with time zone, timestamp with time zone);
DROP FUNCTION IF EXISTS public.get_age_distribution(timestamp with time zone, timestamp with time zone, integer);

-- Create single, clear function with default parameter
CREATE OR REPLACE FUNCTION public.get_age_distribution(
  start_date TIMESTAMPTZ,
  end_date   TIMESTAMPTZ,
  bucket_size INT DEFAULT 10
)
RETURNS TABLE(
  age_bucket    TEXT,
  customer_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE 
      WHEN customer_age IS NULL THEN 'Unknown'
      ELSE CONCAT(
        FLOOR(customer_age / bucket_size) * bucket_size,
        '-',
        FLOOR(customer_age / bucket_size) * bucket_size + (bucket_size - 1)
      )
    END AS age_bucket,
    COUNT(*)::BIGINT AS customer_count
  FROM public.transactions
  WHERE created_at BETWEEN start_date AND end_date
  GROUP BY FLOOR(customer_age / bucket_size)
  ORDER BY FLOOR(customer_age / bucket_size);
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_age_distribution(TIMESTAMPTZ, TIMESTAMPTZ, INT) TO public;
GRANT EXECUTE ON FUNCTION public.get_age_distribution(TIMESTAMPTZ, TIMESTAMPTZ, INT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_age_distribution(TIMESTAMPTZ, TIMESTAMPTZ, INT) TO authenticated;

-- Also ensure gender distribution function exists and is properly accessible
CREATE OR REPLACE FUNCTION public.get_gender_distribution(
  start_date TIMESTAMPTZ,
  end_date   TIMESTAMPTZ
)
RETURNS TABLE(
  gender         TEXT,
  customer_count BIGINT,
  total_revenue  NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE 
      WHEN customer_gender IS NULL OR customer_gender = '' THEN 'Unknown'
      ELSE customer_gender
    END AS gender,
    COUNT(*)::BIGINT AS customer_count,
    COALESCE(SUM(amount), 0)::NUMERIC AS total_revenue
  FROM public.transactions
  WHERE created_at BETWEEN start_date AND end_date
  GROUP BY customer_gender
  ORDER BY customer_count DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant permissions for gender distribution
GRANT EXECUTE ON FUNCTION public.get_gender_distribution(TIMESTAMPTZ, TIMESTAMPTZ) TO public;
GRANT EXECUTE ON FUNCTION public.get_gender_distribution(TIMESTAMPTZ, TIMESTAMPTZ) TO anon;
GRANT EXECUTE ON FUNCTION public.get_gender_distribution(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

-- Verify functions work with sample data
DO $$
DECLARE
    test_start_date TIMESTAMPTZ := NOW() - INTERVAL '30 days';
    test_end_date TIMESTAMPTZ := NOW();
    age_result RECORD;
    gender_result RECORD;
BEGIN
    -- Test age distribution function
    FOR age_result IN 
        SELECT * FROM public.get_age_distribution(test_start_date, test_end_date)
        LIMIT 3
    LOOP
        RAISE NOTICE 'Age Distribution Test - Bucket: %, Count: %', age_result.age_bucket, age_result.customer_count;
    END LOOP;
    
    -- Test gender distribution function
    FOR gender_result IN 
        SELECT * FROM public.get_gender_distribution(test_start_date, test_end_date)
        LIMIT 3
    LOOP
        RAISE NOTICE 'Gender Distribution Test - Gender: %, Count: %, Revenue: %', 
                     gender_result.gender, gender_result.customer_count, gender_result.total_revenue;
    END LOOP;
    
    RAISE NOTICE 'Function verification completed successfully';
END $$;