-- Create parameterized RPC function for daily trends
-- This function allows querying transaction data for any date range
-- and returns aggregated daily statistics

CREATE OR REPLACE FUNCTION public.get_daily_trends(
  start_date TIMESTAMPTZ,
  end_date   TIMESTAMPTZ
)
RETURNS TABLE(
  day            DATE,
  tx_count       BIGINT,
  daily_revenue  NUMERIC,
  avg_tx         NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(created_at)               AS day,
    COUNT(*)::BIGINT               AS tx_count,
    SUM(total_amount)::NUMERIC     AS daily_revenue,
    ROUND(AVG(total_amount), 2)::NUMERIC AS avg_tx
  FROM public.transactions
  WHERE created_at BETWEEN start_date AND end_date
  GROUP BY DATE(created_at)
  ORDER BY DATE(created_at);
END;
$$ LANGUAGE plpgsql STABLE;

-- Test query to verify the function works
-- Uncomment and run this after creating the function:
/*
SELECT * 
FROM get_daily_trends('2025-03-01'::timestamptz, '2025-05-30'::timestamptz)
LIMIT 5;
*/
