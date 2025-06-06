-- Fix all missing database views based on your ACTUAL schema
-- Run this in Supabase SQL Editor

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
    0 as market_share
FROM brands b
LEFT JOIN transaction_items ti ON ti.brand_id = b.id
GROUP BY b.id, b.name, b.category, ti.category;

-- 2. Create customer analytics view  
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

-- 3. Create basket analytics view
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

-- 4. Create substitution analytics view (using substitutions table)
CREATE OR REPLACE VIEW substitution_analytics AS
SELECT 
    s.id,
    s.original_product_id as original_sku_id,
    s.suggested_product_id as suggested_sku_id,
    s.accepted,
    s.reason,
    s.transaction_id,
    p1.name as original_product,
    p2.name as suggested_product,
    b1.name as original_brand,
    b2.name as suggested_brand
FROM substitutions s
LEFT JOIN products p1 ON p1.id = s.original_product_id
LEFT JOIN products p2 ON p2.id = s.suggested_product_id
LEFT JOIN brands b1 ON b1.id = p1.brand_id
LEFT JOIN brands b2 ON b2.id = p2.brand_id;

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

-- 6. Create product performance view (for Product Insights)
CREATE OR REPLACE VIEW product_performance AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    b.name as brand_name,
    p.category,
    COUNT(DISTINCT ti.transaction_id) as transaction_count,
    COALESCE(SUM(ti.quantity), 0) as units_sold,
    COALESCE(SUM(ti.quantity * ti.price), 0) as total_revenue
FROM products p
LEFT JOIN brands b ON b.id = p.brand_id
LEFT JOIN transaction_items ti ON ti.product_id = p.id
GROUP BY p.id, p.name, b.name, p.category;

-- 7. Grant permissions to all views
GRANT SELECT ON brand_analytics TO anon;
GRANT SELECT ON customer_analytics TO anon;
GRANT SELECT ON basket_analytics TO anon;
GRANT SELECT ON substitution_analytics TO anon;
GRANT SELECT ON daily_trends TO anon;
GRANT SELECT ON product_performance TO anon;

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transaction_items_brand_category ON transaction_items(brand_id, category);
CREATE INDEX IF NOT EXISTS idx_transaction_items_product_id ON transaction_items(product_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_customer_age ON transactions(customer_age);
CREATE INDEX IF NOT EXISTS idx_substitutions_transaction ON substitutions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'All views created successfully with correct schema!';
    RAISE NOTICE 'Tables found: brands, products, transactions, transaction_items, stores, customers, substitutions';
END $$;