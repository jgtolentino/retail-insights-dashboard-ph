-- Function to get purchase patterns by time (hourly)
CREATE OR REPLACE FUNCTION get_purchase_patterns_by_time(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS TABLE (
  hour_of_day INTEGER,
  transaction_count BIGINT,
  avg_amount NUMERIC,
  total_revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH hourly_patterns AS (
    SELECT 
      EXTRACT(HOUR FROM t.created_at)::INTEGER as hour_bucket,
      COUNT(t.id) as txn_count,
      AVG(t.total_amount) as avg_txn_amount,
      SUM(t.total_amount) as total_rev
    FROM transactions t
    WHERE t.created_at >= start_date 
      AND t.created_at <= end_date
      AND t.total_amount IS NOT NULL
    GROUP BY EXTRACT(HOUR FROM t.created_at)
  ),
  all_hours AS (
    SELECT generate_series(0, 23) as hour_val
  )
  SELECT 
    ah.hour_val as hour_of_day,
    COALESCE(hp.txn_count, 0)::BIGINT as transaction_count,
    ROUND(COALESCE(hp.avg_txn_amount, 0), 2) as avg_amount,
    ROUND(COALESCE(hp.total_rev, 0), 2) as total_revenue
  FROM all_hours ah
  LEFT JOIN hourly_patterns hp ON ah.hour_val = hp.hour_bucket
  ORDER BY ah.hour_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;