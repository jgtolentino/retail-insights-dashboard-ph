-- Function to get location distribution data
CREATE OR REPLACE FUNCTION get_location_distribution(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS TABLE (
  location_name TEXT,
  customer_count BIGINT,
  transaction_count BIGINT,
  total_revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH location_stats AS (
    SELECT 
      COALESCE(c.location, 'Unknown') as location_name,
      COUNT(DISTINCT c.id) as unique_customers,
      COUNT(t.id) as total_transactions,
      COALESCE(SUM(t.total_amount), 0) as revenue
    FROM transactions t
    LEFT JOIN customers c ON t.customer_id = c.id
    WHERE t.created_at >= start_date 
      AND t.created_at <= end_date
    GROUP BY COALESCE(c.location, 'Unknown')
  )
  SELECT 
    ls.location_name,
    ls.unique_customers::BIGINT as customer_count,
    ls.total_transactions::BIGINT as transaction_count,
    ROUND(ls.revenue, 2) as total_revenue
  FROM location_stats ls
  ORDER BY ls.revenue DESC, ls.total_transactions DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;