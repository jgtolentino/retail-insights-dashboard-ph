-- Create brand_analytics view for Product Insights page
-- This view aggregates brand performance metrics

CREATE OR REPLACE VIEW brand_analytics AS
SELECT 
    b.id as brand_id,
    b.name as brand_name,
    COALESCE(ti.category, 'Uncategorized') as category,
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
    CASE 
        WHEN (SELECT SUM(quantity * price) FROM transaction_items) > 0 
        THEN (SUM(ti.quantity * ti.price) / (SELECT SUM(quantity * price) FROM transaction_items)) * 100
        ELSE 0
    END as market_share
FROM brands b
LEFT JOIN transaction_items ti ON ti.brand_id = b.id
GROUP BY b.id, b.name, ti.category;

-- Grant access to the view
GRANT SELECT ON brand_analytics TO anon;
GRANT SELECT ON brand_analytics TO authenticated;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_transaction_items_brand_id ON transaction_items(brand_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_category ON transaction_items(category);

-- Also create a simpler version without joins for testing
CREATE OR REPLACE VIEW brand_summary AS
SELECT 
    b.id,
    b.name,
    b.category,
    COUNT(ti.id) as item_count,
    SUM(ti.quantity) as total_quantity_sold
FROM brands b
LEFT JOIN transaction_items ti ON ti.brand_id = b.id
GROUP BY b.id, b.name, b.category;

-- Grant access
GRANT SELECT ON brand_summary TO anon;
GRANT SELECT ON brand_summary TO authenticated;