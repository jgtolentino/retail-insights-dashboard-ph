-- Fix Consumer Insights Functions - Use correct field names
-- This migration fixes the database functions to use 'total_amount' instead of 'amount'

-- 1. Drop existing functions to avoid overload issues
DROP FUNCTION IF EXISTS public.get_age_distribution(TIMESTAMPTZ, TIMESTAMPTZ, INT);
DROP FUNCTION IF EXISTS public.get_age_distribution(TIMESTAMP, TIMESTAMP, INT);
DROP FUNCTION IF EXISTS public.get_age_distribution(TEXT, TEXT, INT);
DROP FUNCTION IF EXISTS public.get_age_distribution(TEXT, TEXT);

DROP FUNCTION IF EXISTS public.get_gender_distribution(TIMESTAMPTZ, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.get_gender_distribution(TIMESTAMP, TIMESTAMP);
DROP FUNCTION IF EXISTS public.get_gender_distribution(TEXT, TEXT);

DROP FUNCTION IF EXISTS public.get_purchase_behavior_by_age(TIMESTAMPTZ, TIMESTAMPTZ);

-- 2. Create Age Distribution Function (CORRECTED)
CREATE OR REPLACE FUNCTION public.get_age_distribution(
  start_date TIMESTAMPTZ DEFAULT '2025-01-01'::TIMESTAMPTZ,
  end_date   TIMESTAMPTZ DEFAULT '2025-12-31'::TIMESTAMPTZ,
  bucket_size INT DEFAULT 10
)
RETURNS TABLE(
  age_bucket    TEXT,
  customer_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    CONCAT(
      FLOOR(customer_age / bucket_size) * bucket_size,
      '-',
      FLOOR(customer_age / bucket_size) * bucket_size + (bucket_size - 1)
    ) AS age_bucket,
    COUNT(*)::BIGINT AS customer_count
  FROM public.transactions
  WHERE customer_age IS NOT NULL
    AND created_at BETWEEN start_date AND end_date
  GROUP BY FLOOR(customer_age / bucket_size)
  ORDER BY FLOOR(customer_age / bucket_size);
END;
$$;

-- 3. Create Gender Distribution Function (CORRECTED)
CREATE OR REPLACE FUNCTION public.get_gender_distribution(
  start_date TIMESTAMPTZ DEFAULT '2025-01-01'::TIMESTAMPTZ,
  end_date   TIMESTAMPTZ DEFAULT '2025-12-31'::TIMESTAMPTZ
)
RETURNS TABLE(
  gender         TEXT,
  customer_count BIGINT,
  total_revenue  NUMERIC,
  percentage     NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_customers BIGINT;
BEGIN
  -- Get total customer count for percentage calculation
  SELECT COUNT(*) INTO total_customers
  FROM public.transactions
  WHERE customer_gender IS NOT NULL
    AND created_at BETWEEN start_date AND end_date;

  RETURN QUERY
  SELECT
    COALESCE(customer_gender, 'Unknown') AS gender,
    COUNT(*)::BIGINT AS customer_count,
    SUM(total_amount)::NUMERIC AS total_revenue,  -- FIXED: was 'amount'
    CASE 
      WHEN total_customers > 0 THEN 
        ROUND((COUNT(*)::NUMERIC / total_customers::NUMERIC) * 100, 2)
      ELSE 0
    END AS percentage
  FROM public.transactions
  WHERE customer_gender IS NOT NULL
    AND created_at BETWEEN start_date AND end_date
  GROUP BY customer_gender
  ORDER BY customer_count DESC;
END;
$$;

-- 4. Create Purchase Behavior Function (CORRECTED)
CREATE OR REPLACE FUNCTION public.get_purchase_behavior_by_age(
  start_date TIMESTAMPTZ DEFAULT '2025-01-01'::TIMESTAMPTZ,
  end_date   TIMESTAMPTZ DEFAULT '2025-12-31'::TIMESTAMPTZ
)
RETURNS TABLE(
  age_group      TEXT,
  avg_transaction_value NUMERIC,
  purchase_frequency    NUMERIC,
  preferred_categories  TEXT[]
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
      total_amount,  -- FIXED: was 'amount'
      customer_age
    FROM public.transactions t
    WHERE customer_age IS NOT NULL
      AND created_at BETWEEN start_date AND end_date
  )
  SELECT 
    ag.age_group,
    AVG(ag.total_amount)::NUMERIC as avg_transaction_value,  -- FIXED: was 'amount'
    COUNT(*)::NUMERIC / NULLIF(COUNT(DISTINCT ag.customer_age), 0) as purchase_frequency,
    ARRAY['General']::TEXT[] as preferred_categories -- Placeholder for now
  FROM age_groups ag
  GROUP BY ag.age_group
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

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION public.get_age_distribution(TIMESTAMPTZ, TIMESTAMPTZ, INT) TO public;
GRANT EXECUTE ON FUNCTION public.get_age_distribution(TIMESTAMPTZ, TIMESTAMPTZ, INT) TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_gender_distribution(TIMESTAMPTZ, TIMESTAMPTZ) TO public;
GRANT EXECUTE ON FUNCTION public.get_gender_distribution(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_purchase_behavior_by_age(TIMESTAMPTZ, TIMESTAMPTZ) TO public;
GRANT EXECUTE ON FUNCTION public.get_purchase_behavior_by_age(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
