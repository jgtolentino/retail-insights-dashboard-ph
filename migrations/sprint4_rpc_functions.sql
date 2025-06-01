-- ===================================================================
-- Sprint 4: Advanced Analytics RPC Functions
-- ===================================================================

-- 1. Get substitution patterns analysis
CREATE OR REPLACE FUNCTION get_substitution_patterns(
  start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  original_brand VARCHAR,
  substitute_brand VARCHAR,
  original_product VARCHAR,
  substitute_product VARCHAR,
  substitution_count BIGINT,
  acceptance_rate NUMERIC,
  avg_price_diff NUMERIC
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    op.brand as original_brand,
    sp.brand as substitute_brand,
    op.name as original_product,
    sp.name as substitute_product,
    COUNT(*) as substitution_count,
    AVG(s.acceptance_rate)::NUMERIC(4,2) as acceptance_rate,
    AVG(sp.price - op.price)::NUMERIC(10,2) as avg_price_diff
  FROM substitutions s
  JOIN products op ON s.original_product_id = op.id
  JOIN products sp ON s.substituted_product_id = sp.id
  JOIN transactions t ON s.transaction_id = t.id
  WHERE t.checkout_time BETWEEN start_date AND end_date
  GROUP BY op.brand, sp.brand, op.name, sp.name
  HAVING COUNT(*) >= 3 -- Only show patterns with 3+ occurrences
  ORDER BY substitution_count DESC, acceptance_rate DESC;
END;
$ LANGUAGE plpgsql;

-- 2. Get request behavior analytics
CREATE OR REPLACE FUNCTION get_request_behavior_stats(
  start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  request_type VARCHAR,
  total_count BIGINT,
  avg_checkout_seconds NUMERIC,
  suggestion_acceptance_rate NUMERIC,
  avg_clarifications NUMERIC,
  gesture_usage_rate NUMERIC
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    t.request_type,
    COUNT(*) as total_count,
    AVG(t.checkout_seconds)::NUMERIC(6,2) as avg_checkout_seconds,
    AVG(CASE WHEN t.suggestion_accepted THEN 1 ELSE 0 END)::NUMERIC(4,2) as suggestion_acceptance_rate,
    AVG(COALESCE(rb.clarification_count, 0))::NUMERIC(4,2) as avg_clarifications,
    AVG(CASE WHEN rb.gesture_used THEN 1 ELSE 0 END)::NUMERIC(4,2) as gesture_usage_rate
  FROM transactions t
  LEFT JOIN request_behaviors rb ON t.id = rb.transaction_id
  WHERE t.checkout_time BETWEEN start_date AND end_date
  GROUP BY t.request_type
  ORDER BY total_count DESC;
END;
$ LANGUAGE plpgsql;

-- 3. Get checkout duration analysis with detailed breakdown
CREATE OR REPLACE FUNCTION get_checkout_duration_analysis(
  start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  duration_range VARCHAR,
  transaction_count BIGINT,
  percentage NUMERIC,
  avg_amount NUMERIC,
  top_payment_method VARCHAR
) AS $
BEGIN
  RETURN QUERY
  WITH duration_buckets AS (
    SELECT 
      CASE 
        WHEN checkout_seconds < 30 THEN '0-30s'
        WHEN checkout_seconds < 60 THEN '30-60s'
        WHEN checkout_seconds < 120 THEN '1-2min'
        WHEN checkout_seconds < 300 THEN '2-5min'
        ELSE '5min+'
      END as duration_range,
      COUNT(*) as count,
      AVG(total_amount) as avg_amount,
      MODE() WITHIN GROUP (ORDER BY payment_method) as top_payment_method
    FROM transactions
    WHERE checkout_time BETWEEN start_date AND end_date
    GROUP BY 1
  )
  SELECT 
    duration_range,
    count as transaction_count,
    (count * 100.0 / SUM(count) OVER ())::NUMERIC(5,2) as percentage,
    avg_amount::NUMERIC(10,2),
    top_payment_method
  FROM duration_buckets
  ORDER BY 
    CASE duration_range
      WHEN '0-30s' THEN 1
      WHEN '30-60s' THEN 2
      WHEN '1-2min' THEN 3
      WHEN '2-5min' THEN 4
      ELSE 5
    END;
END;
$ LANGUAGE plpgsql;

-- 4. Get payment method performance analysis
CREATE OR REPLACE FUNCTION get_payment_method_analysis(
  start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  payment_method VARCHAR,
  transaction_count BIGINT,
  total_revenue NUMERIC,
  avg_transaction_value NUMERIC,
  avg_checkout_time NUMERIC,
  market_share NUMERIC
) AS $
BEGIN
  RETURN QUERY
  WITH payment_stats AS (
    SELECT 
      payment_method,
      COUNT(*) as transaction_count,
      SUM(total_amount) as total_revenue,
      AVG(total_amount) as avg_transaction_value,
      AVG(checkout_seconds) as avg_checkout_time
    FROM transactions
    WHERE checkout_time BETWEEN start_date AND end_date
    GROUP BY payment_method
  )
  SELECT 
    payment_method,
    transaction_count,
    total_revenue::NUMERIC(12,2),
    avg_transaction_value::NUMERIC(10,2),
    avg_checkout_time::NUMERIC(6,2),
    (transaction_count * 100.0 / SUM(transaction_count) OVER ())::NUMERIC(5,2) as market_share
  FROM payment_stats
  ORDER BY transaction_count DESC;
END;
$ LANGUAGE plpgsql;

-- 5. Get NLP insights from transcriptions
CREATE OR REPLACE FUNCTION get_transcription_insights(
  start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  common_phrase VARCHAR,
  frequency BIGINT,
  request_type VARCHAR,
  avg_checkout_time NUMERIC,
  sentiment_score NUMERIC
) AS $
BEGIN
  RETURN QUERY
  WITH phrase_analysis AS (
    SELECT 
      CASE 
        WHEN transcription_text ILIKE '%may % ba kayo%' THEN 'Standard Product Request'
        WHEN transcription_text ILIKE '%wala po%' THEN 'Out of Stock Response'
        WHEN transcription_text ILIKE '%anong brand%' THEN 'Brand Clarification'
        WHEN transcription_text ILIKE '%*points*%' THEN 'Gesture-Based Request'
        WHEN transcription_text ILIKE '%kahit ano%' THEN 'No Brand Preference'
        WHEN transcription_text ILIKE '%receipt%' THEN 'Receipt Request'
        ELSE 'Other Interaction'
      END as phrase_category,
      request_type,
      checkout_seconds,
      CASE 
        WHEN transcription_text ILIKE '%salamat%' OR transcription_text ILIKE '%thank%' THEN 0.8
        WHEN transcription_text ILIKE '%wala%' OR transcription_text ILIKE '%hindi%' THEN 0.3
        ELSE 0.6
      END as sentiment_score
    FROM transactions
    WHERE checkout_time BETWEEN start_date AND end_date
      AND transcription_text IS NOT NULL
  )
  SELECT 
    phrase_category as common_phrase,
    COUNT(*) as frequency,
    MODE() WITHIN GROUP (ORDER BY request_type) as request_type,
    AVG(checkout_seconds)::NUMERIC(6,2) as avg_checkout_time,
    AVG(sentiment_score)::NUMERIC(3,2) as sentiment_score
  FROM phrase_analysis
  GROUP BY phrase_category
  HAVING COUNT(*) >= 5
  ORDER BY frequency DESC;
END;
$ LANGUAGE plpgsql;

-- 6. Get daily trends with enhanced metrics
CREATE OR REPLACE FUNCTION get_daily_trends_enhanced(
  start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  date DATE,
  total_transactions BIGINT,
  total_revenue NUMERIC,
  avg_checkout_time NUMERIC,
  top_request_type VARCHAR,
  substitution_rate NUMERIC,
  digital_payment_rate NUMERIC
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    DATE(t.checkout_time) as date,
    COUNT(*) as total_transactions,
    SUM(t.total_amount)::NUMERIC(12,2) as total_revenue,
    AVG(t.checkout_seconds)::NUMERIC(6,2) as avg_checkout_time,
    MODE() WITHIN GROUP (ORDER BY t.request_type) as top_request_type,
    (COUNT(s.id) * 100.0 / COUNT(*))::NUMERIC(5,2) as substitution_rate,
    (SUM(CASE WHEN t.payment_method IN ('gcash', 'maya', 'credit') THEN 1 ELSE 0 END) * 100.0 / COUNT(*))::NUMERIC(5,2) as digital_payment_rate
  FROM transactions t
  LEFT JOIN substitutions s ON t.id = s.transaction_id
  WHERE t.checkout_time BETWEEN start_date AND end_date
  GROUP BY DATE(t.checkout_time)
  ORDER BY date DESC;
END;
$ LANGUAGE plpgsql;

-- 7. Get top brands with substitution impact
CREATE OR REPLACE FUNCTION get_top_brands_with_substitution_impact(
  start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMPTZ DEFAULT NOW(),
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  brand VARCHAR,
  total_sales NUMERIC,
  transaction_count BIGINT,
  times_substituted_away BIGINT,
  times_substituted_to BIGINT,
  net_substitution_impact BIGINT,
  substitution_vulnerability NUMERIC
) AS $
BEGIN
  RETURN QUERY
  WITH brand_sales AS (
    SELECT 
      p.brand,
      SUM(ti.quantity * ti.unit_price) as total_sales,
      COUNT(DISTINCT t.id) as transaction_count
    FROM transactions t
    JOIN transaction_items ti ON t.id = ti.transaction_id
    JOIN products p ON ti.product_id = p.id
    WHERE t.checkout_time BETWEEN start_date AND end_date
    GROUP BY p.brand
  ),
  substitution_stats AS (
    SELECT 
      op.brand as original_brand,
      COUNT(*) as substituted_away
    FROM substitutions s
    JOIN products op ON s.original_product_id = op.id
    JOIN transactions t ON s.transaction_id = t.id
    WHERE t.checkout_time BETWEEN start_date AND end_date
    GROUP BY op.brand
  ),
  substitution_gains AS (
    SELECT 
      sp.brand as substitute_brand,
      COUNT(*) as substituted_to
    FROM substitutions s
    JOIN products sp ON s.substituted_product_id = sp.id
    JOIN transactions t ON s.transaction_id = t.id
    WHERE t.checkout_time BETWEEN start_date AND end_date
    GROUP BY sp.brand
  )
  SELECT 
    bs.brand,
    bs.total_sales::NUMERIC(12,2),
    bs.transaction_count,
    COALESCE(ss.substituted_away, 0) as times_substituted_away,
    COALESCE(sg.substituted_to, 0) as times_substituted_to,
    (COALESCE(sg.substituted_to, 0) - COALESCE(ss.substituted_away, 0)) as net_substitution_impact,
    (COALESCE(ss.substituted_away, 0) * 100.0 / NULLIF(bs.transaction_count, 0))::NUMERIC(5,2) as substitution_vulnerability
  FROM brand_sales bs
  LEFT JOIN substitution_stats ss ON bs.brand = ss.original_brand
  LEFT JOIN substitution_gains sg ON bs.brand = sg.substitute_brand
  ORDER BY bs.total_sales DESC
  LIMIT limit_count;
END;
$ LANGUAGE plpgsql;

-- Grant permissions for all new functions
GRANT EXECUTE ON FUNCTION get_substitution_patterns(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION get_request_behavior_stats(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION get_checkout_duration_analysis(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION get_payment_method_analysis(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION get_transcription_insights(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_trends_enhanced(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_brands_with_substitution_impact(TIMESTAMPTZ, TIMESTAMPTZ, INTEGER) TO authenticated;

-- Success message
DO $
BEGIN
  RAISE NOTICE 'Sprint 4 RPC functions created successfully!';
  RAISE NOTICE 'Created 7 advanced analytics functions for substitution patterns, request behaviors, and enhanced insights.';
END;
$;