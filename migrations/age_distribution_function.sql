-- Age Distribution RPC Function for Consumer Demographics
-- Creates age buckets and returns customer counts

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

-- Also create a gender distribution function for Sprint 3
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