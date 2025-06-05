-- ===================================================================
-- RLS Policies and Performance Optimizations
-- ===================================================================

-- Enable RLS on all tables
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_behaviors ENABLE ROW LEVEL SECURITY;
ALTER TABLE substitutions ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow full access to authenticated users" ON transactions
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow full access to authenticated users" ON transaction_items
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow full access to authenticated users" ON products
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow full access to authenticated users" ON brands
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow full access to authenticated users" ON stores
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow full access to authenticated users" ON request_behaviors
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow full access to authenticated users" ON substitutions
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Optimize sequences
SELECT setval('transactions_id_seq', (SELECT MAX(id) FROM transactions));
SELECT setval('transaction_items_id_seq', (SELECT MAX(id) FROM transaction_items));
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
SELECT setval('brands_id_seq', (SELECT MAX(id) FROM brands));
SELECT setval('stores_id_seq', (SELECT MAX(id) FROM stores));
SELECT setval('request_behaviors_id_seq', (SELECT MAX(id) FROM request_behaviors));
SELECT setval('substitutions_id_seq', (SELECT MAX(id) FROM substitutions));

-- Add additional indexes for common queries
CREATE INDEX IF NOT EXISTS idx_transactions_checkout_time ON transactions(checkout_time);
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_stores_region_id ON stores(region_id);

-- Analyze tables for better query planning
ANALYZE transactions;
ANALYZE transaction_items;
ANALYZE products;
ANALYZE brands;
ANALYZE stores;
ANALYZE request_behaviors;
ANALYZE substitutions; 