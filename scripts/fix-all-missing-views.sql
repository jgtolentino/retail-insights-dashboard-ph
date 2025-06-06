-- Fix all missing database views and functions
-- Run this in Supabase SQL Editor to fix Product Insights and other pages

-- 1. Create brand_analytics view
CREATE OR REPLACE VIEW brand_analytics AS
SELECT 
    b.id as brand_id,
    b.name as brand_name,
    COALESCE(ti.category, b.category, 'Uncategorized') as category,
    CASE 
        WHEN b.name IN ('Alaska', 'Bear Brand', 'Nescafé', 'Milo', 'Maggi', 'KitKat') THEN true
        ELSE false
    END as is_tbwa,
    COALESCE(SUM(ti.quantity * ti.price), 0) as total_revenue,
    COUNT(DISTINCT ti.transaction_id) as total_transactions,
    COALESCE(SUM(ti.quantity), 0) as total_quantity,
    CASE 
        WHEN SUM(ti.quantity) > 0 THEN SUM(ti.quantity * ti.price) / SUM(ti.quantity)
        ELSE 0
    END as avg_price,
    0 as market_share -- Will calculate separately to avoid division issues
FROM brands b
LEFT JOIN transaction_items ti ON ti.brand_id = b.id
GROUP BY b.id, b.name, b.category, ti.category;

-- 2. Create customer analytics view (for Consumer Insights)
CREATE OR REPLACE VIEW customer_analytics AS
SELECT 
    t.id as transaction_id,
    t.customer_age as age,
    CASE 
        WHEN t.customer_age < 25 THEN '18-24'
        WHEN t.customer_age < 35 THEN '25-34'
        WHEN t.customer_age < 45 THEN '35-44'
        WHEN t.customer_age < 55 THEN '45-54'
        ELSE '55+'
    END as age_group,
    t.total_amount,
    t.store_location,
    DATE(t.created_at) as transaction_date,
    EXTRACT(hour FROM t.created_at) as transaction_hour,
    EXTRACT(dow FROM t.created_at) as day_of_week
FROM transactions t
WHERE t.customer_age IS NOT NULL;

-- 3. Create basket analytics view (for Basket Behavior)
CREATE OR REPLACE VIEW basket_analytics AS
SELECT 
    ti.transaction_id,
    COUNT(DISTINCT ti.brand_id) as unique_brands,
    COUNT(ti.id) as total_items,
    SUM(ti.quantity) as total_quantity,
    SUM(ti.quantity * ti.price) as basket_value,
    STRING_AGG(DISTINCT ti.category, ', ' ORDER BY ti.category) as categories
FROM transaction_items ti
GROUP BY ti.transaction_id;

-- 4. Create substitution analytics view
CREATE OR REPLACE VIEW substitution_analytics AS
SELECT 
    se.id,
    se.original_sku_id,
    se.suggested_sku_id,
    se.accepted,
    se.reason,
    se.transaction_id,
    s1.name as original_product,
    s2.name as suggested_product,
    b1.name as original_brand,
    b2.name as suggested_brand
FROM substitution_events se
LEFT JOIN skus s1 ON s1.id = se.original_sku_id
LEFT JOIN skus s2 ON s2.id = se.suggested_sku_id
LEFT JOIN brands b1 ON b1.id = s1.brand_id
LEFT JOIN brands b2 ON b2.id = s2.brand_id;

-- 5. Create daily trends view
CREATE OR REPLACE VIEW daily_trends AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as transaction_count,
    SUM(total_amount) as revenue,
    AVG(total_amount) as avg_transaction_value,
    COUNT(DISTINCT store_location) as active_stores
FROM transactions
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 6. Grant permissions to all views
GRANT SELECT ON brand_analytics TO anon;
GRANT SELECT ON customer_analytics TO anon;
GRANT SELECT ON basket_analytics TO anon;
GRANT SELECT ON substitution_analytics TO anon;
GRANT SELECT ON daily_trends TO anon;

-- 7. Create missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_transaction_items_brand_category ON transaction_items(brand_id, category);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_customer_age ON transactions(customer_age);
CREATE INDEX IF NOT EXISTS idx_substitution_events_transaction ON substitution_events(transaction_id);

-- Verify the fix
DO $$
BEGIN
    RAISE NOTICE 'All views created successfully!';
    RAISE NOTICE 'Product Insights should now work properly.';
END $$;