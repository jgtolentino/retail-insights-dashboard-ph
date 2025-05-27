-- Sprint 3: Consumer Insights SQL Functions
-- Age Distribution and Gender Distribution for Demographics Dashboard

-- Age Distribution RPC Function
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
$$ LANGUAGE plpgsql STABLE;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_age_distribution(TIMESTAMPTZ, TIMESTAMPTZ, INT) TO public;

-- Gender Distribution RPC Function
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
    COALESCE(customer_gender, 'Unknown') AS gender,
    COUNT(*)::BIGINT AS customer_count,
    SUM(amount)::NUMERIC AS total_revenue
  FROM public.transactions
  WHERE created_at BETWEEN start_date AND end_date
  GROUP BY customer_gender
  ORDER BY customer_count DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_gender_distribution(TIMESTAMPTZ, TIMESTAMPTZ) TO public;

-- Purchase Behavior Analysis Function
CREATE OR REPLACE FUNCTION public.get_purchase_behavior_by_age(
  start_date TIMESTAMPTZ,
  end_date   TIMESTAMPTZ
)
RETURNS TABLE(
  age_group      TEXT,
  avg_transaction_value NUMERIC,
  purchase_frequency    NUMERIC,
  preferred_categories  TEXT[]
) AS $$
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
      amount,
      customer_age
    FROM public.transactions t
    WHERE customer_age IS NOT NULL
      AND created_at BETWEEN start_date AND end_date
  )
  SELECT 
    ag.age_group,
    AVG(ag.amount)::NUMERIC as avg_transaction_value,
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
$$ LANGUAGE plpgsql STABLE;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_purchase_behavior_by_age(TIMESTAMPTZ, TIMESTAMPTZ) TO public;