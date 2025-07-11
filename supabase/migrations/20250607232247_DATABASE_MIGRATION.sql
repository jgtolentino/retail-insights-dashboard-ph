-- DATABASE MIGRATION: Complete Dashboard Implementation
-- Run these commands in Supabase SQL Editor in order

-- ============================================================================
-- PHASE 1: SCHEMA UPDATES
-- ============================================================================

-- 1.1 Create customer_requests table for request behavior tracking
CREATE TABLE IF NOT EXISTS customer_requests (
  id SERIAL PRIMARY KEY,
  transaction_id INT REFERENCES transactions(id),
  request_type VARCHAR(20) CHECK (request_type IN ('branded', 'unbranded', 'volume')),
  request_mode VARCHAR(20) CHECK (request_mode IN ('pointing', 'verbal')),
  accepted_suggestion BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 Add checkout duration tracking to transactions
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS checkout_seconds INT DEFAULT NULL;

-- 1.3 Create system_logs table for monitoring
CREATE TABLE IF NOT EXISTS system_logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PHASE 2: MATERIALIZED VIEWS
-- ============================================================================

-- 2.1 Daily transaction trends with weekday/weekend analysis
DROP MATERIALIZED VIEW IF EXISTS v_txn_trends_daily;
CREATE MATERIALIZED VIEW v_txn_trends_daily AS
SELECT 
  date_trunc('day', created_at) as date,
  COUNT(*) as transaction_count,
  SUM(total_amount) as total_revenue,
  AVG(total_amount) as avg_basket_size,
  EXTRACT(dow FROM created_at) as day_of_week,
  CASE 
    WHEN EXTRACT(dow FROM created_at) IN (0,6) THEN 'weekend' 
    ELSE 'weekday' 
  END as day_type,
  store_id
FROM transactions
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY date_trunc('day', created_at), EXTRACT(dow FROM created_at), store_id;

-- 2.2 Basket composition analysis
DROP MATERIALIZED VIEW IF EXISTS v_basket_summary;
CREATE MATERIALIZED VIEW v_basket_summary AS
SELECT 
  p.id as product_id,
  p.name as product_name,
  b.name as brand_name,
  b.category,
  SUM(i.quantity) as total_quantity,
  COUNT(DISTINCT i.transaction_id) as transaction_count,
  AVG(i.quantity) as avg_quantity_per_txn,
  SUM(i.quantity * i.unit_price) as total_revenue
FROM transaction_items i
JOIN products p ON p.id = i.product_id
JOIN brands b ON b.id = p.brand_id
GROUP BY p.id, p.name, b.name, b.category;

-- 2.3 Consumer profile aggregation
DROP MATERIALIZED VIEW IF EXISTS v_consumer_profile;
CREATE MATERIALIZED VIEW v_consumer_profile AS
SELECT 
  age_bucket,
  gender,
  COUNT(*) as customer_count,
  AVG(total_spent) as avg_spending,
  COUNT(DISTINCT store_id) as stores_visited,
  AVG(transaction_count) as avg_transactions
FROM (
  SELECT 
    c.id,
    c.age,
    c.gender,
    CASE 
      WHEN c.age < 25 THEN '18-24'
      WHEN c.age < 35 THEN '25-34'
      WHEN c.age < 45 THEN '35-44'
      WHEN c.age < 55 THEN '45-54'
      ELSE '55+'
    END as age_bucket,
    SUM(t.total_amount) as total_spent,
    COUNT(t.id) as transaction_count,
    t.store_id
  FROM customers c
  JOIN transactions t ON t.customer_id = c.id
  WHERE t.created_at >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY c.id, c.age, c.gender, t.store_id
) customer_stats
GROUP BY age_bucket, gender;

-- ============================================================================
-- PHASE 3: NEW RPC FUNCTIONS
-- ============================================================================

-- 3.1 Hourly trends with KPI data
CREATE OR REPLACE FUNCTION get_hourly_trends(
  p_start  timestamptz,
  p_end    timestamptz,
  p_store  int[] default null
)
RETURNS TABLE(
  hr timestamptz, 
  txn_ct int, 
  peso numeric, 
  units int,
  avg_basket numeric,
  checkout_duration numeric
)
LANGUAGE sql 
SECURITY DEFINER AS $$
  SELECT 
    date_trunc('hour', t.created_at) as hr,
    count(*)::int as txn_ct,
    sum(t.total_amount) as peso,
    sum(i.quantity)::int as units,
    avg(t.total_amount) as avg_basket,
    avg(t.checkout_seconds) as checkout_duration
  FROM transactions t
  JOIN transaction_items i on i.transaction_id = t.id
  WHERE t.created_at between p_start and p_end
    AND (p_store is null or t.store_id = any(p_store))
  GROUP BY 1
  ORDER BY 1;
$$;

-- 3.2 Basket composition with category filtering
CREATE OR REPLACE FUNCTION get_basket_summary(
  p_cat varchar default null,
  p_n   int     default 10
)
RETURNS TABLE(
  product_name varchar, 
  brand_name varchar,
  category varchar,
  qty_sum bigint,
  revenue_sum numeric,
  txn_count bigint
)
LANGUAGE sql 
SECURITY DEFINER AS $$
  SELECT 
    p.name as product_name,
    b.name as brand_name,
    b.category,
    sum(i.quantity) as qty_sum,
    sum(i.quantity * i.unit_price) as revenue_sum,
    count(distinct i.transaction_id) as txn_count
  FROM transaction_items i
  JOIN products p on p.id = i.product_id
  JOIN brands b on b.id = p.brand_id
  WHERE (p_cat is null or b.category = p_cat)
  GROUP BY p.name, b.name, b.category
  ORDER BY sum(i.quantity) desc
  LIMIT p_n;
$$;

-- 3.3 Substitution flow analysis (requires substitutions table)
CREATE OR REPLACE FUNCTION get_substitution_flow()
RETURNS TABLE(
  orig varchar, 
  sub varchar, 
  cnt int,
  category varchar
)
LANGUAGE sql 
SECURITY DEFINER AS $$
  SELECT 
    po.name as orig,
    ps.name as sub,
    count(*)::int as cnt,
    bo.category
  FROM substitutions s
  JOIN products po on po.id = s.original_product_id
  JOIN products ps on ps.id = s.substitute_product_id
  JOIN brands bo on bo.id = po.brand_id
  WHERE s.created_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY po.name, ps.name, bo.category
  ORDER BY cnt desc
  LIMIT 50;
$$;

-- 3.4 Request behavior analytics
CREATE OR REPLACE FUNCTION get_request_behaviour(
  p_start timestamptz,
  p_end   timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql 
SECURITY DEFINER AS $$
DECLARE
  v_out jsonb;
BEGIN
  SELECT jsonb_build_object(
    'branded',  coalesce(sum((request_type='branded')::int), 0),
    'unbranded',coalesce(sum((request_type='unbranded')::int), 0),
    'volume',   coalesce(sum((request_type='volume')::int), 0),
    'pointing', coalesce(sum((request_mode='pointing')::int), 0),
    'verbal',   coalesce(sum((request_mode='verbal')::int), 0),
    'suggestion_accept', coalesce(sum((accepted_suggestion)::int), 0),
    'total_requests', coalesce(count(*), 0)
  )
  INTO v_out
  FROM customer_requests
  WHERE created_at between p_start and p_end;

  return coalesce(v_out, '{"total_requests": 0}'::jsonb);
END; 
$$;

-- 3.5 Enhanced consumer profile function
CREATE OR REPLACE FUNCTION get_consumer_profile(
  p_start timestamptz default null,
  p_end   timestamptz default null
)
RETURNS TABLE(
  age_bucket varchar,
  gender varchar,
  customer_count bigint,
  avg_spending numeric,
  total_transactions bigint
)
LANGUAGE sql
SECURITY DEFINER AS $$
  SELECT 
    CASE 
      WHEN c.age < 25 THEN '18-24'
      WHEN c.age < 35 THEN '25-34'
      WHEN c.age < 45 THEN '35-44'
      WHEN c.age < 55 THEN '45-54'
      ELSE '55+'
    END as age_bucket,
    c.gender,
    count(distinct c.id) as customer_count,
    avg(t.total_amount) as avg_spending,
    count(t.id) as total_transactions
  FROM customers c
  JOIN transactions t ON t.customer_id = c.id
  WHERE (p_start is null or t.created_at >= p_start)
    AND (p_end is null or t.created_at <= p_end)
  GROUP BY 
    CASE 
      WHEN c.age < 25 THEN '18-24'
      WHEN c.age < 35 THEN '25-34'
      WHEN c.age < 45 THEN '35-44'
      WHEN c.age < 55 THEN '45-54'
      ELSE '55+'
    END,
    c.gender
  ORDER BY age_bucket, gender;
$$;

-- ============================================================================
-- PHASE 4: PERFORMANCE INDEXES
-- ============================================================================

-- Essential indexes for query performance
CREATE INDEX IF NOT EXISTS idx_txn_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_txn_store ON transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_txn_customer ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_items_txn ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_items_product ON transaction_items(product_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_customers_age_gender ON customers(age, gender);
CREATE INDEX IF NOT EXISTS idx_req_created ON customer_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_req_type ON customer_requests(request_type);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_txn_created_store ON transactions(created_at, store_id);
CREATE INDEX IF NOT EXISTS idx_items_txn_product ON transaction_items(transaction_id, product_id);

-- ============================================================================
-- PHASE 5: AUTO-REFRESH SYSTEM
-- ============================================================================

-- 5.1 Materialized view refresh function
CREATE OR REPLACE FUNCTION sp_refresh_materialised_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
  -- Refresh views in dependency order
  REFRESH MATERIALIZED VIEW v_basket_summary;
  REFRESH MATERIALIZED VIEW v_consumer_profile;
  REFRESH MATERIALIZED VIEW v_txn_trends_daily;
  
  -- Log the refresh
  INSERT INTO system_logs (action, details) 
  VALUES ('materialized_views_refreshed', jsonb_build_object('timestamp', now()));
  
  -- Clean up old logs (keep last 1000 entries)
  DELETE FROM system_logs 
  WHERE id NOT IN (
    SELECT id FROM system_logs 
    ORDER BY created_at DESC 
    LIMIT 1000
  );
  
EXCEPTION 
  WHEN OTHERS THEN
    -- Log the error
    INSERT INTO system_logs (action, details) 
    VALUES ('materialized_view_refresh_error', jsonb_build_object(
      'error', SQLERRM,
      'timestamp', now()
    ));
    RAISE;
END;
$$;

-- 5.2 Set up cron job for auto-refresh (every 30 minutes)
-- Note: This requires the pg_cron extension to be enabled in Supabase
-- SELECT cron.schedule('refresh-dashboard-views', '*/30 * * * *', 'SELECT sp_refresh_materialised_views();');

-- ============================================================================
-- PHASE 6: SAMPLE DATA SEEDING (Optional - for testing)
-- ============================================================================

-- Insert sample customer requests data
INSERT INTO customer_requests (transaction_id, request_type, request_mode, accepted_suggestion)
SELECT 
  t.id,
  (ARRAY['branded', 'unbranded', 'volume'])[floor(random() * 3 + 1)],
  (ARRAY['pointing', 'verbal'])[floor(random() * 2 + 1)],
  random() > 0.3
FROM transactions t
WHERE t.created_at >= CURRENT_DATE - INTERVAL '30 days'
  AND random() > 0.7  -- Only 30% of transactions have request data
LIMIT 1000;

-- Update some transactions with checkout duration
UPDATE transactions 
SET checkout_seconds = floor(random() * 300 + 30)  -- 30 seconds to 5 minutes
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
  AND random() > 0.5;

-- ============================================================================
-- PHASE 7: VERIFICATION QUERIES
-- ============================================================================

-- Verify the migration completed successfully
DO $$
BEGIN
  -- Check if all tables exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_requests') THEN
    RAISE EXCEPTION 'customer_requests table not created';
  END IF;
  
  -- Check if materialized views exist
  IF NOT EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'v_basket_summary') THEN
    RAISE EXCEPTION 'v_basket_summary materialized view not created';
  END IF;
  
  -- Check if functions exist
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_hourly_trends') THEN
    RAISE EXCEPTION 'get_hourly_trends function not created';
  END IF;
  
  -- Log successful migration
  INSERT INTO system_logs (action, details)
  VALUES ('database_migration_completed', jsonb_build_object(
    'timestamp', now(),
    'version', '1.0.0'
  ));
  
  RAISE NOTICE 'Migration completed successfully!';
END;
$$;

-- Display summary of what was created
SELECT 'Database Migration Summary' as status;
SELECT 'Tables created: customer_requests, system_logs' as tables;
SELECT 'Materialized views: v_txn_trends_daily, v_basket_summary, v_consumer_profile' as views;
SELECT 'RPC functions: get_hourly_trends, get_basket_summary, get_substitution_flow, get_request_behaviour, get_consumer_profile' as functions;
SELECT 'Indexes: 8 performance indexes created' as indexes;
SELECT 'Auto-refresh: sp_refresh_materialised_views() function ready' as automation;