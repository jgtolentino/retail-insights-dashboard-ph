-- Fix Age Distribution Function Signature Conflict
-- This script resolves the "Could not choose the best candidate function" error

-- 1. Drop all existing age distribution functions to clear conflicts
DROP FUNCTION IF EXISTS public.get_age_distribution(timestamp with time zone, timestamp with time zone);
DROP FUNCTION IF EXISTS public.get_age_distribution(timestamp with time zone, timestamp with time zone, integer);
DROP FUNCTION IF EXISTS public.get_age_distribution(timestamptz, timestamptz);
DROP FUNCTION IF EXISTS public.get_age_distribution(timestamptz, timestamptz, integer);

-- 2. Create single, properly defined function
CREATE OR REPLACE FUNCTION public.get_age_distribution(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  bucket_size INTEGER DEFAULT 10
)
RETURNS TABLE(
  age_bucket TEXT,
  customer_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE 
      WHEN t.customer_age IS NULL THEN 'Unknown'
      ELSE CONCAT(
        FLOOR(t.customer_age / bucket_size) * bucket_size,
        '-',
        FLOOR(t.customer_age / bucket_size) * bucket_size + (bucket_size - 1)
      )
    END AS age_bucket,
    COUNT(*)::BIGINT AS customer_count
  FROM public.transactions t
  WHERE t.created_at >= start_date 
    AND t.created_at <= end_date
  GROUP BY 
    CASE 
      WHEN t.customer_age IS NULL THEN 'Unknown'
      ELSE CONCAT(
        FLOOR(t.customer_age / bucket_size) * bucket_size,
        '-',
        FLOOR(t.customer_age / bucket_size) * bucket_size + (bucket_size - 1)
      )
    END
  ORDER BY 
    CASE 
      WHEN t.customer_age IS NULL THEN 999999
      ELSE FLOOR(t.customer_age / bucket_size) * bucket_size
    END;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3. Grant proper permissions
GRANT EXECUTE ON FUNCTION public.get_age_distribution(TIMESTAMPTZ, TIMESTAMPTZ, INTEGER) TO public;
GRANT EXECUTE ON FUNCTION public.get_age_distribution(TIMESTAMPTZ, TIMESTAMPTZ, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.get_age_distribution(TIMESTAMPTZ, TIMESTAMPTZ, INTEGER) TO authenticated;

-- 4. Also fix gender distribution function while we're at it
DROP FUNCTION IF EXISTS public.get_gender_distribution(timestamp with time zone, timestamp with time zone);
DROP FUNCTION IF EXISTS public.get_gender_distribution(timestamptz, timestamptz);

CREATE OR REPLACE FUNCTION public.get_gender_distribution(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS TABLE(
  gender TEXT,
  customer_count BIGINT,
  total_revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE 
      WHEN t.customer_gender IS NULL OR t.customer_gender = '' THEN 'Unknown'
      ELSE t.customer_gender
    END AS gender,
    COUNT(*)::BIGINT AS customer_count,
    COALESCE(SUM(t.amount), 0)::NUMERIC AS total_revenue
  FROM public.transactions t
  WHERE t.created_at >= start_date 
    AND t.created_at <= end_date
  GROUP BY 
    CASE 
      WHEN t.customer_gender IS NULL OR t.customer_gender = '' THEN 'Unknown'
      ELSE t.customer_gender
    END
  ORDER BY customer_count DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 5. Grant permissions for gender distribution
GRANT EXECUTE ON FUNCTION public.get_gender_distribution(TIMESTAMPTZ, TIMESTAMPTZ) TO public;
GRANT EXECUTE ON FUNCTION public.get_gender_distribution(TIMESTAMPTZ, TIMESTAMPTZ) TO anon;
GRANT EXECUTE ON FUNCTION public.get_gender_distribution(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

-- 6. Test the functions work correctly
DO $$
DECLARE
    test_start_date TIMESTAMPTZ := NOW() - INTERVAL '30 days';
    test_end_date TIMESTAMPTZ := NOW();
    rec RECORD;
BEGIN
    -- Test age distribution function
    RAISE NOTICE 'Testing age distribution function...';
    FOR rec IN 
        SELECT * FROM public.get_age_distribution(test_start_date, test_end_date, 10)
        LIMIT 3
    LOOP
        RAISE NOTICE 'Age bucket: %, Count: %', rec.age_bucket, rec.customer_count;
    END LOOP;
    
    -- Test gender distribution function
    RAISE NOTICE 'Testing gender distribution function...';
    FOR rec IN 
        SELECT * FROM public.get_gender_distribution(test_start_date, test_end_date)
        LIMIT 3
    LOOP
        RAISE NOTICE 'Gender: %, Count: %, Revenue: %', rec.gender, rec.customer_count, rec.total_revenue;
    END LOOP;
    
    RAISE NOTICE 'Function tests completed successfully!';
END $$;

-- 7. Create indexes to improve performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_transactions_customer_age ON public.transactions(customer_age) WHERE customer_age IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_customer_gender ON public.transactions(customer_gender) WHERE customer_gender IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);

COMMIT;