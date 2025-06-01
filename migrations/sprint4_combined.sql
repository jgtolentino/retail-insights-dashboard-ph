
-- =====================================
-- Migration: sprint4_schema_updates.sql
-- =====================================

-- ===================================================================
-- Sprint 4: Critical Schema Updates for Retail Insights Dashboard PH
-- ===================================================================

-- 1. Add missing columns to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS checkout_time TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS request_type VARCHAR(50) DEFAULT 'branded',
ADD COLUMN IF NOT EXISTS transcription_text TEXT,
ADD COLUMN IF NOT EXISTS suggestion_accepted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS checkout_seconds INTEGER DEFAULT 45;

-- Update existing transactions with realistic data
UPDATE transactions 
SET 
  payment_method = CASE 
    WHEN random() < 0.4 THEN 'cash'
    WHEN random() < 0.3 THEN 'gcash'
    WHEN random() < 0.2 THEN 'maya'
    ELSE 'credit'
  END,
  checkout_time = transaction_date + (random() * INTERVAL '12 hours'),
  request_type = CASE 
    WHEN random() < 0.6 THEN 'branded'
    WHEN random() < 0.3 THEN 'unbranded'
    ELSE 'pointing'
  END,
  suggestion_accepted = random() < 0.7,
  checkout_seconds = 20 + (random() * 180)::INTEGER
WHERE payment_method IS NULL;

-- 2. Create substitutions table for tracking product switches
CREATE TABLE IF NOT EXISTS substitutions (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
  original_product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  substituted_product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  reason VARCHAR(100) DEFAULT 'out_of_stock',
  acceptance_rate DECIMAL(3,2) DEFAULT 0.70,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create request_behaviors table for detailed tracking
CREATE TABLE IF NOT EXISTS request_behaviors (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
  behavior_type VARCHAR(50) NOT NULL, -- 'initial_request', 'clarification', 'substitution'
  product_mentioned VARCHAR(255),
  brand_mentioned VARCHAR(255),
  gesture_used BOOLEAN DEFAULT FALSE,
  clarification_count INTEGER DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Add performance indexes
CREATE INDEX IF NOT EXISTS idx_transactions_request_type ON transactions(request_type);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method ON transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_transactions_checkout_time ON transactions(checkout_time);
CREATE INDEX IF NOT EXISTS idx_substitutions_transaction_id ON substitutions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_substitutions_original_product ON substitutions(original_product_id);
CREATE INDEX IF NOT EXISTS idx_request_behaviors_transaction_id ON request_behaviors(transaction_id);
CREATE INDEX IF NOT EXISTS idx_request_behaviors_type ON request_behaviors(behavior_type);

-- 5. Generate sample substitution data
INSERT INTO substitutions (transaction_id, original_product_id, substituted_product_id, reason, acceptance_rate)
SELECT 
  t.id as transaction_id,
  p1.id as original_product_id,
  p2.id as substituted_product_id,
  CASE 
    WHEN random() < 0.5 THEN 'out_of_stock'
    WHEN random() < 0.3 THEN 'price_preference'
    ELSE 'brand_preference'
  END as reason,
  (0.5 + random() * 0.4)::DECIMAL(3,2) as acceptance_rate
FROM transactions t
CROSS JOIN LATERAL (
  SELECT id FROM products WHERE category = 'Beverages' ORDER BY random() LIMIT 1
) p1
CROSS JOIN LATERAL (
  SELECT id FROM products WHERE category = 'Beverages' AND id != p1.id ORDER BY random() LIMIT 1
) p2
WHERE random() < 0.15 -- 15% of transactions have substitutions
LIMIT 500;

-- 6. Generate sample request behavior data
INSERT INTO request_behaviors (transaction_id, behavior_type, product_mentioned, brand_mentioned, gesture_used, clarification_count)
SELECT 
  t.id as transaction_id,
  CASE 
    WHEN random() < 0.6 THEN 'initial_request'
    WHEN random() < 0.3 THEN 'clarification'
    ELSE 'substitution'
  END as behavior_type,
  p.name as product_mentioned,
  p.brand as brand_mentioned,
  random() < 0.2 as gesture_used,
  (random() * 3)::INTEGER as clarification_count
FROM transactions t
JOIN transaction_items ti ON t.id = ti.transaction_id
JOIN products p ON ti.product_id = p.id
WHERE random() < 0.8 -- 80% of transactions have behavior data
LIMIT 2000;

-- 7. Update transcription texts with realistic Filipino retail interactions
UPDATE transactions 
SET transcription_text = CASE 
  WHEN request_type = 'branded' THEN 
    'Customer: May ' || (SELECT name FROM products JOIN transaction_items ON products.id = transaction_items.product_id WHERE transaction_items.transaction_id = transactions.id LIMIT 1) || ' ba kayo? Store: Opo, meron po.'
  WHEN request_type = 'unbranded' THEN 
    'Customer: Yung softdrinks nyo. Store: Anong brand po gusto ninyo? Customer: Kahit ano.'
  WHEN request_type = 'pointing' THEN 
    'Customer: *points* Ito po. Store: Ah, ' || (SELECT name FROM products JOIN transaction_items ON products.id = transaction_items.product_id WHERE transaction_items.transaction_id = transactions.id LIMIT 1) || ' po ba?'
  ELSE 'Customer: Pwede po makakuha ng receipt? Store: Opo, eto po.'
END
WHERE transcription_text IS NULL;

-- 8. Create materialized view for faster analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_transaction_analytics AS
SELECT 
  DATE(t.transaction_date) as transaction_day,
  t.request_type,
  t.payment_method,
  COUNT(*) as transaction_count,
  AVG(t.checkout_seconds) as avg_checkout_time,
  AVG(CASE WHEN t.suggestion_accepted THEN 1 ELSE 0 END) as acceptance_rate,
  SUM(t.total_amount) as total_revenue,
  COUNT(DISTINCT t.customer_id) as unique_customers
FROM transactions t
GROUP BY transaction_day, t.request_type, t.payment_method;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_mv_analytics_day ON mv_transaction_analytics(transaction_day);

-- 9. Create function to refresh analytics view
CREATE OR REPLACE FUNCTION refresh_transaction_analytics()
RETURNS void AS $
BEGIN
  REFRESH MATERIALIZED VIEW mv_transaction_analytics;
END;
$ LANGUAGE plpgsql;

-- 10. Add RLS policies for new tables
ALTER TABLE substitutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_behaviors ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read substitutions
CREATE POLICY "Allow authenticated read substitutions" ON substitutions
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to read request behaviors
CREATE POLICY "Allow authenticated read request_behaviors" ON request_behaviors
  FOR SELECT TO authenticated USING (true);

-- 11. Grant necessary permissions
GRANT SELECT ON substitutions TO authenticated;
GRANT SELECT ON request_behaviors TO authenticated;
GRANT SELECT ON mv_transaction_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_transaction_analytics() TO authenticated;

-- Success message
DO $
BEGIN
  RAISE NOTICE 'Sprint 4 schema updates completed successfully!';
  RAISE NOTICE 'Added % transactions with enhanced data', (SELECT COUNT(*) FROM transactions WHERE payment_method IS NOT NULL);
  RAISE NOTICE 'Created % substitution records', (SELECT COUNT(*) FROM substitutions);
  RAISE NOTICE 'Created % request behavior records', (SELECT COUNT(*) FROM request_behaviors);
END;
$;


-- =====================================
-- Migration: sprint4_rpc_functions.sql
-- =====================================

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

