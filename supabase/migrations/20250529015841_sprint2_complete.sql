-- Sprint 2: Complete SQL Setup
-- This creates all tables and data needed for Product Mix & SKU Analysis

-- Create substitutions table if not exists
CREATE TABLE IF NOT EXISTS substitutions (
    id SERIAL PRIMARY KEY,
    original_product_id INTEGER NOT NULL,
    substitute_product_id INTEGER NOT NULL,
    substitution_date TIMESTAMP NOT NULL DEFAULT NOW(),
    reason TEXT,
    store_location TEXT,
    customer_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (original_product_id) REFERENCES products(id),
    FOREIGN KEY (substitute_product_id) REFERENCES products(id)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_substitutions_date ON substitutions(substitution_date);
CREATE INDEX IF NOT EXISTS idx_substitutions_products ON substitutions(original_product_id, substitute_product_id);

-- Enable RLS
ALTER TABLE substitutions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Enable read access for all users" ON substitutions
    FOR SELECT USING (true);

-- Insert sample substitution data (500 records)
INSERT INTO substitutions (original_product_id, substitute_product_id, substitution_date, reason, store_location)
SELECT 
    p1.id as original_product_id,
    p2.id as substitute_product_id,
    NOW() - (random() * INTERVAL '30 days') as substitution_date,
    CASE floor(random() * 5)::int
        WHEN 0 THEN 'Out of stock'
        WHEN 1 THEN 'Price preference'
        WHEN 2 THEN 'Brand preference'
        WHEN 3 THEN 'Promotion'
        ELSE 'Customer request'
    END as reason,
    CASE floor(random() * 5)::int
        WHEN 0 THEN 'Makati'
        WHEN 1 THEN 'Quezon City'
        WHEN 2 THEN 'Cebu'
        WHEN 3 THEN 'Davao'
        ELSE 'Manila'
    END as store_location
FROM products p1
CROSS JOIN products p2
WHERE p1.id != p2.id
  AND p1.brand_id = p2.brand_id  -- Same brand substitutions
  AND random() < 0.1  -- 10% chance
LIMIT 500
ON CONFLICT DO NOTHING;

-- Create function for frequently bought together analysis
CREATE OR REPLACE FUNCTION get_frequently_bought_together(
    p_start_date TIMESTAMP DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMP DEFAULT NOW(),
    p_min_support INTEGER DEFAULT 5
)
RETURNS TABLE (
    product1_id INTEGER,
    product1_name TEXT,
    product2_id INTEGER,
    product2_name TEXT,
    frequency INTEGER,
    confidence NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH transaction_pairs AS (
        SELECT DISTINCT
            t1.transaction_id,
            t1.product_id as product1_id,
            t2.product_id as product2_id
        FROM transaction_items t1
        JOIN transaction_items t2 ON t1.transaction_id = t2.transaction_id
        JOIN transactions t ON t1.transaction_id = t.id
        WHERE t1.product_id < t2.product_id
          AND t.created_at BETWEEN p_start_date AND p_end_date
    ),
    pair_counts AS (
        SELECT 
            product1_id,
            product2_id,
            COUNT(*) as pair_count
        FROM transaction_pairs
        GROUP BY product1_id, product2_id
        HAVING COUNT(*) >= p_min_support
    )
    SELECT 
        pc.product1_id,
        p1.name as product1_name,
        pc.product2_id,
        p2.name as product2_name,
        pc.pair_count as frequency,
        ROUND(pc.pair_count::numeric / COUNT(DISTINCT ti.transaction_id) * 100, 2) as confidence
    FROM pair_counts pc
    JOIN products p1 ON pc.product1_id = p1.id
    JOIN products p2 ON pc.product2_id = p2.id
    LEFT JOIN transaction_items ti ON ti.product_id = pc.product1_id
    GROUP BY pc.product1_id, p1.name, pc.product2_id, p2.name, pc.pair_count
    ORDER BY frequency DESC, confidence DESC
    LIMIT 50;
END;
$$;

-- Create function for product substitution analysis
CREATE OR REPLACE FUNCTION get_product_substitutions(
    p_start_date TIMESTAMP DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMP DEFAULT NOW()
)
RETURNS TABLE (
    original_product TEXT,
    substitute_product TEXT,
    substitution_count INTEGER,
    primary_reason TEXT,
    revenue_impact NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p1.name as original_product,
        p2.name as substitute_product,
        COUNT(*)::INTEGER as substitution_count,
        MODE() WITHIN GROUP (ORDER BY s.reason) as primary_reason,
        ROUND(SUM(ti.price * ti.quantity), 2) as revenue_impact
    FROM substitutions s
    JOIN products p1 ON s.original_product_id = p1.id
    JOIN products p2 ON s.substitute_product_id = p2.id
    LEFT JOIN transaction_items ti ON ti.product_id = s.substitute_product_id
        AND ti.created_at BETWEEN s.substitution_date - INTERVAL '1 hour' 
        AND s.substitution_date + INTERVAL '1 hour'
    WHERE s.substitution_date BETWEEN p_start_date AND p_end_date
    GROUP BY p1.name, p2.name
    ORDER BY substitution_count DESC
    LIMIT 20;
END;
$$;

-- Verify setup
SELECT 
    'Tables created' as status,
    COUNT(*) as substitution_records
FROM substitutions;

SELECT 
    'Functions created' as status,
    COUNT(*) as function_count
FROM pg_proc
WHERE proname IN ('get_frequently_bought_together', 'get_product_substitutions');