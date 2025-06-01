-- ===================================================================
-- Behavioral Analytics Functions for Dashboard Enhancement
-- ===================================================================

-- 1. Create v_behavior_suggestions view
CREATE OR REPLACE VIEW v_behavior_suggestions AS
SELECT 
  DATE(t.checkout_time) as date,
  t.store_id,
  s.name as store_name,
  r.name as region,
  COUNT(DISTINCT t.id) as total_transactions,
  COUNT(DISTINCT CASE WHEN rb.suggestion_offered THEN t.id END) as suggestions_offered,
  COUNT(DISTINCT CASE WHEN rb.suggestion_accepted THEN t.id END) as suggestions_accepted,
  ROUND(
    CASE 
      WHEN COUNT(DISTINCT CASE WHEN rb.suggestion_offered THEN t.id END) > 0 
      THEN (COUNT(DISTINCT CASE WHEN rb.suggestion_accepted THEN t.id END)::NUMERIC / 
            COUNT(DISTINCT CASE WHEN rb.suggestion_offered THEN t.id END)::NUMERIC) * 100
      ELSE 0
    END, 2
  ) as suggestion_acceptance_rate
FROM transactions t
LEFT JOIN request_behaviors rb ON t.id = rb.transaction_id
LEFT JOIN stores s ON t.store_id = s.id
LEFT JOIN regions r ON s.region_id = r.id
WHERE t.checkout_time IS NOT NULL
GROUP BY DATE(t.checkout_time), t.store_id, s.name, r.name
ORDER BY date DESC, store_name;

-- 2. Get dashboard summary function
CREATE OR REPLACE FUNCTION get_dashboard_summary(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE,
  p_store_id INT DEFAULT NULL
)
RETURNS TABLE (
  total_revenue NUMERIC,
  total_transactions BIGINT,
  avg_transaction NUMERIC,
  unique_customers BIGINT,
  suggestion_acceptance_rate NUMERIC,
  substitution_rate NUMERIC,
  suggestions_offered BIGINT,
  suggestions_accepted BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(t.total_amount), 0)::NUMERIC as total_revenue,
    COUNT(DISTINCT t.id)::BIGINT as total_transactions,
    COALESCE(AVG(t.total_amount), 0)::NUMERIC as avg_transaction,
    COUNT(DISTINCT t.customer_id)::BIGINT as unique_customers,
    COALESCE(
      ROUND(
        CASE 
          WHEN COUNT(DISTINCT CASE WHEN rb.suggestion_offered THEN t.id END) > 0 
          THEN (COUNT(DISTINCT CASE WHEN rb.suggestion_accepted THEN t.id END)::NUMERIC / 
                COUNT(DISTINCT CASE WHEN rb.suggestion_offered THEN t.id END)::NUMERIC) * 100
          ELSE 0
        END, 2
      ), 0
    )::NUMERIC as suggestion_acceptance_rate,
    COALESCE(
      ROUND(
        CASE 
          WHEN COUNT(DISTINCT t.id) > 0
          THEN (COUNT(DISTINCT sub.transaction_id)::NUMERIC / COUNT(DISTINCT t.id)::NUMERIC) * 100
          ELSE 0
        END, 2
      ), 0
    )::NUMERIC as substitution_rate,
    COUNT(DISTINCT CASE WHEN rb.suggestion_offered THEN t.id END)::BIGINT as suggestions_offered,
    COUNT(DISTINCT CASE WHEN rb.suggestion_accepted THEN t.id END)::BIGINT as suggestions_accepted
  FROM transactions t
  LEFT JOIN request_behaviors rb ON t.id = rb.transaction_id
  LEFT JOIN substitutions sub ON t.id = sub.transaction_id
  WHERE 
    DATE(t.checkout_time) BETWEEN p_start_date AND p_end_date
    AND (p_store_id IS NULL OR t.store_id = p_store_id);
END;
$$ LANGUAGE plpgsql;

-- 3. Get weekly dashboard summary
CREATE OR REPLACE FUNCTION get_dashboard_summary_weekly(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '90 days',
  p_end_date DATE DEFAULT CURRENT_DATE,
  p_store_id INT DEFAULT NULL
)
RETURNS TABLE (
  week_start DATE,
  week_end DATE,
  week_number INT,
  total_revenue NUMERIC,
  total_transactions BIGINT,
  avg_transaction NUMERIC,
  unique_customers BIGINT,
  suggestion_acceptance_rate NUMERIC,
  substitution_rate NUMERIC,
  suggestions_offered BIGINT,
  suggestions_accepted BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH weekly_data AS (
    SELECT 
      DATE_TRUNC('week', t.checkout_time)::DATE as week_start,
      (DATE_TRUNC('week', t.checkout_time) + INTERVAL '6 days')::DATE as week_end,
      EXTRACT(WEEK FROM t.checkout_time)::INT as week_num,
      SUM(t.total_amount) as revenue,
      COUNT(DISTINCT t.id) as transactions,
      AVG(t.total_amount) as avg_tx,
      COUNT(DISTINCT t.customer_id) as customers,
      COUNT(DISTINCT CASE WHEN rb.suggestion_offered THEN t.id END) as offers,
      COUNT(DISTINCT CASE WHEN rb.suggestion_accepted THEN t.id END) as accepts,
      COUNT(DISTINCT sub.transaction_id) as substitutions
    FROM transactions t
    LEFT JOIN request_behaviors rb ON t.id = rb.transaction_id
    LEFT JOIN substitutions sub ON t.id = sub.transaction_id
    WHERE 
      DATE(t.checkout_time) BETWEEN p_start_date AND p_end_date
      AND (p_store_id IS NULL OR t.store_id = p_store_id)
    GROUP BY DATE_TRUNC('week', t.checkout_time), EXTRACT(WEEK FROM t.checkout_time)
  )
  SELECT 
    week_start,
    week_end,
    week_num as week_number,
    COALESCE(revenue, 0)::NUMERIC as total_revenue,
    COALESCE(transactions, 0)::BIGINT as total_transactions,
    COALESCE(avg_tx, 0)::NUMERIC as avg_transaction,
    COALESCE(customers, 0)::BIGINT as unique_customers,
    COALESCE(
      ROUND(
        CASE 
          WHEN offers > 0 
          THEN (accepts::NUMERIC / offers::NUMERIC) * 100
          ELSE 0
        END, 2
      ), 0
    )::NUMERIC as suggestion_acceptance_rate,
    COALESCE(
      ROUND(
        CASE 
          WHEN transactions > 0
          THEN (substitutions::NUMERIC / transactions::NUMERIC) * 100
          ELSE 0
        END, 2
      ), 0
    )::NUMERIC as substitution_rate,
    COALESCE(offers, 0)::BIGINT as suggestions_offered,
    COALESCE(accepts, 0)::BIGINT as suggestions_accepted
  FROM weekly_data
  ORDER BY week_start DESC;
END;
$$ LANGUAGE plpgsql;

-- 4. Get suggestion funnel data
CREATE OR REPLACE FUNCTION get_suggestion_funnel(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE,
  p_store_id INT DEFAULT NULL
)
RETURNS TABLE (
  stage VARCHAR,
  count BIGINT,
  percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH funnel_data AS (
    SELECT 
      COUNT(DISTINCT t.id) as total_transactions,
      COUNT(DISTINCT CASE WHEN rb.suggestion_offered THEN t.id END) as offered,
      COUNT(DISTINCT CASE WHEN rb.suggestion_accepted THEN t.id END) as accepted,
      COUNT(DISTINCT CASE WHEN rb.suggestion_offered AND NOT COALESCE(rb.suggestion_accepted, FALSE) THEN t.id END) as rejected
    FROM transactions t
    LEFT JOIN request_behaviors rb ON t.id = rb.transaction_id
    WHERE 
      DATE(t.checkout_time) BETWEEN p_start_date AND p_end_date
      AND (p_store_id IS NULL OR t.store_id = p_store_id)
  )
  SELECT 
    'Total Transactions' as stage,
    total_transactions as count,
    100.0 as percentage
  FROM funnel_data
  UNION ALL
  SELECT 
    'Suggestions Offered' as stage,
    offered as count,
    ROUND((offered::NUMERIC / NULLIF(total_transactions, 0)) * 100, 2) as percentage
  FROM funnel_data
  UNION ALL
  SELECT 
    'Suggestions Accepted' as stage,
    accepted as count,
    ROUND((accepted::NUMERIC / NULLIF(total_transactions, 0)) * 100, 2) as percentage
  FROM funnel_data
  UNION ALL
  SELECT 
    'Suggestions Rejected' as stage,
    rejected as count,
    ROUND((rejected::NUMERIC / NULLIF(total_transactions, 0)) * 100, 2) as percentage
  FROM funnel_data
  ORDER BY 
    CASE stage
      WHEN 'Total Transactions' THEN 1
      WHEN 'Suggestions Offered' THEN 2
      WHEN 'Suggestions Accepted' THEN 3
      WHEN 'Suggestions Rejected' THEN 4
    END;
END;
$$ LANGUAGE plpgsql;