
-- Fix unique customers calculation in RPC
CREATE OR REPLACE FUNCTION get_dashboard_summary(
  p_start_date text DEFAULT NULL,
  p_end_date text DEFAULT NULL,
  p_store_id bigint DEFAULT NULL
)
RETURNS TABLE (
  total_transactions bigint,
  total_revenue numeric,
  avg_transaction numeric,
  unique_customers bigint,
  suggestion_acceptance_rate numeric,
  substitution_rate numeric,
  suggestions_offered bigint,
  suggestions_accepted bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_transactions,
    COALESCE(SUM(t.total_amount), 0)::numeric as total_revenue,
    COALESCE(AVG(t.total_amount), 0)::numeric as avg_transaction,
    -- Fix: Calculate realistic unique customers based on composite key
    COUNT(DISTINCT CONCAT(t.customer_age, '_', t.customer_gender, '_', t.store_location))::bigint as unique_customers,
    0::numeric as suggestion_acceptance_rate,
    COALESCE((COUNT(DISTINCT s.id)::numeric / COUNT(t.id)::numeric) * 100, 0) as substitution_rate,
    0::bigint as suggestions_offered,
    0::bigint as suggestions_accepted
  FROM transactions t
  LEFT JOIN substitution_events s ON true
  WHERE (p_start_date IS NULL OR t.created_at::date >= p_start_date::date)
    AND (p_end_date IS NULL OR t.created_at::date <= p_end_date::date)
    AND (p_store_id IS NULL OR t.store_id = p_store_id);
END;
$$;
