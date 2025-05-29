-- Create the frequently_bought_together RPC function
CREATE OR REPLACE FUNCTION frequently_bought_together(p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  product1 TEXT,
  product2 TEXT,
  frequency INTEGER,
  confidence NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $
BEGIN
  RETURN QUERY
  WITH transaction_pairs AS (
    SELECT 
      ti1.transaction_id,
      p1.name as product1,
      p2.name as product2,
      COUNT(*) OVER (PARTITION BY p1.name, p2.name) as pair_count
    FROM transaction_items ti1
    JOIN transaction_items ti2 ON ti1.transaction_id = ti2.transaction_id 
      AND ti1.product_id < ti2.product_id
    JOIN products p1 ON ti1.product_id = p1.id
    JOIN products p2 ON ti2.product_id = p2.id
    JOIN transactions t ON ti1.transaction_id = t.id
    WHERE t.created_at >= CURRENT_DATE - INTERVAL '1 day' * p_days
  )
  SELECT 
    product1,
    product2,
    pair_count::INTEGER as frequency,
    ROUND(pair_count::NUMERIC / COUNT(*) OVER (PARTITION BY product1), 2) as confidence
  FROM transaction_pairs
  GROUP BY product1, product2, pair_count
  HAVING pair_count > 1
  ORDER BY pair_count DESC
  LIMIT 20;
END;
$;

-- Create optimized time series function
CREATE OR REPLACE FUNCTION get_time_series_data(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_interval TEXT DEFAULT 'day'
)
RETURNS TABLE (
  period TIMESTAMPTZ,
  transactions BIGINT,
  revenue NUMERIC,
  units BIGINT,
  unique_customers BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $
BEGIN
  RETURN QUERY
  SELECT
    date_trunc(p_interval, t.created_at) as period,
    COUNT(DISTINCT t.id) as transactions,
    SUM(t.total_amount) as revenue,
    SUM(ti.quantity) as units,
    COUNT(DISTINCT CONCAT(t.customer_age, '-', t.customer_gender)) as unique_customers
  FROM transactions t
  LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
  WHERE t.created_at BETWEEN p_start_date AND p_end_date
  GROUP BY date_trunc(p_interval, t.created_at)
  ORDER BY period;
END;
$;

-- Create total revenue function if it doesn't exist
CREATE OR REPLACE FUNCTION get_total_revenue_for_period(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $
BEGIN
  RETURN (
    SELECT COALESCE(SUM(total_amount), 0)
    FROM transactions
    WHERE created_at BETWEEN start_date AND end_date
  );
END;
$;