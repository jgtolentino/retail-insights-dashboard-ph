-- Seed data for retail insights dashboard
-- Run this in Supabase SQL editor

-- Clear existing data (optional - comment out if you want to keep existing data)
-- TRUNCATE TABLE transaction_items CASCADE;
-- TRUNCATE TABLE transactions CASCADE;
-- TRUNCATE TABLE products CASCADE;
-- TRUNCATE TABLE brands CASCADE;

-- Insert more brands if they don't exist
INSERT INTO brands (name, is_tbwa_client, category) 
SELECT * FROM (VALUES
  ('Alaska', false, 'Dairy'),
  ('Bear Brand', false, 'Dairy'),
  ('Champion', false, 'Detergent'),
  ('Fortune', false, 'Cigarettes'),
  ('Hope', false, 'Cigarettes'),
  ('Marlboro', false, 'Cigarettes'),
  ('More', false, 'Cigarettes'),
  ('Philip Morris', false, 'Cigarettes'),
  ('Nescafe', false, 'Coffee'),
  ('Milo', false, 'Beverages'),
  ('Lucky Me', false, 'Noodles'),
  ('Purefoods', false, 'Meat'),
  ('San Miguel', false, 'Beer'),
  ('Tanduay', false, 'Liquor'),
  ('Emperador', false, 'Liquor')
) AS t(name, is_tbwa_client, category)
WHERE NOT EXISTS (
  SELECT 1 FROM brands WHERE brands.name = t.name
);

-- Get brand IDs for product insertion
WITH brand_ids AS (
  SELECT id, name FROM brands
)
-- Insert products for each brand
INSERT INTO products (name, brand_id, price, sku)
SELECT 
  b.name || ' - ' || p.product_variant,
  b.id,
  p.price,
  UPPER(LEFT(b.name, 3)) || '-' || p.sku_suffix
FROM brand_ids b
CROSS JOIN (VALUES
  ('Regular Pack', 85.00, '001'),
  ('Value Pack', 150.00, '002'),
  ('Premium', 220.00, '003')
) AS p(product_variant, price, sku_suffix)
WHERE NOT EXISTS (
  SELECT 1 FROM products WHERE products.brand_id = b.id
);

-- Generate sample transactions for the last 30 days
WITH date_series AS (
  SELECT generate_series(
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE,
    INTERVAL '1 hour'
  ) AS transaction_time
),
filtered_dates AS (
  -- Only business hours (6 AM to 10 PM)
  SELECT transaction_time 
  FROM date_series 
  WHERE EXTRACT(hour FROM transaction_time) BETWEEN 6 AND 22
),
transaction_data AS (
  SELECT 
    gen_random_uuid() AS id,
    transaction_time AS transaction_date,
    transaction_time AS created_at,
    ROUND((RANDOM() * 2000 + 100)::numeric, 2) AS total_amount,
    FLOOR(RANDOM() * 10 + 1)::int AS items_count
  FROM filtered_dates
  -- Create 5-15 transactions per hour
  CROSS JOIN generate_series(1, FLOOR(RANDOM() * 10 + 5)::int)
)
INSERT INTO transactions (id, transaction_date, created_at, total_amount, items_count)
SELECT * FROM transaction_data;

-- Generate transaction items
WITH recent_transactions AS (
  SELECT id FROM transactions 
  WHERE transaction_date >= CURRENT_DATE - INTERVAL '30 days'
),
all_products AS (
  SELECT id, price FROM products
),
item_data AS (
  SELECT DISTINCT
    gen_random_uuid() AS id,
    t.id AS transaction_id,
    p.id AS product_id,
    FLOOR(RANDOM() * 3 + 1)::int AS quantity,
    p.price,
    ROUND((p.price * FLOOR(RANDOM() * 3 + 1))::numeric, 2) AS subtotal,
    NOW() AS created_at
  FROM recent_transactions t
  -- Each transaction has 1-5 different products
  CROSS JOIN LATERAL (
    SELECT * FROM all_products 
    ORDER BY RANDOM() 
    LIMIT FLOOR(RANDOM() * 4 + 1)::int
  ) p
)
INSERT INTO transaction_items (id, transaction_id, product_id, quantity, price, subtotal, created_at)
SELECT * FROM item_data;

-- Update transaction totals to match items
UPDATE transactions t
SET total_amount = (
  SELECT COALESCE(SUM(ti.subtotal), 0)
  FROM transaction_items ti
  WHERE ti.transaction_id = t.id
),
items_count = (
  SELECT COALESCE(SUM(ti.quantity), 0)
  FROM transaction_items ti
  WHERE ti.transaction_id = t.id
)
WHERE t.transaction_date >= CURRENT_DATE - INTERVAL '30 days';

-- Verify the data
SELECT 
  'Brands' as table_name, COUNT(*) as count FROM brands
UNION ALL
SELECT 
  'Products', COUNT(*) FROM products
UNION ALL
SELECT 
  'Transactions (30 days)', COUNT(*) 
  FROM transactions 
  WHERE transaction_date >= CURRENT_DATE - INTERVAL '30 days'
UNION ALL
SELECT 
  'Transaction Items', COUNT(*) FROM transaction_items;

-- Check brand performance
SELECT 
  b.name AS brand_name,
  COUNT(DISTINCT ti.transaction_id) AS transactions,
  SUM(ti.quantity) AS units_sold,
  SUM(ti.subtotal) AS total_revenue
FROM brands b
JOIN products p ON b.id = p.brand_id
JOIN transaction_items ti ON p.id = ti.product_id
JOIN transactions t ON ti.transaction_id = t.id
WHERE t.transaction_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY b.id, b.name
ORDER BY total_revenue DESC;