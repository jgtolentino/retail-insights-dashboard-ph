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