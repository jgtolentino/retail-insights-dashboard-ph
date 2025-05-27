-- Easy Import: 2000 Transactions for Supabase
-- Just copy and paste this entire file into Supabase SQL Editor

-- Step 1: Clear existing transactions (keeps your brands and products)
TRUNCATE TABLE transaction_items CASCADE;
TRUNCATE TABLE transactions CASCADE;

-- Step 2: Generate 2000 transactions directly in the database
WITH date_range AS (
  -- Generate dates from Jan 1 to May 31, 2025
  SELECT generate_series(
    '2025-01-01'::date,
    '2025-05-31'::date,
    '1 day'::interval
  )::date AS transaction_date
),
daily_transactions AS (
  -- Create ~13 transactions per day (2000 total / 151 days)
  SELECT 
    transaction_date,
    generate_series(1, 
      CASE 
        WHEN EXTRACT(dow FROM transaction_date) IN (0,6) THEN 15  -- More on weekends
        ELSE 13  -- Regular weekdays
      END
    ) AS daily_num
  FROM date_range
),
all_transactions AS (
  -- Generate transaction details
  SELECT 
    gen_random_uuid() AS id,
    transaction_date + (interval '1 hour' * (6 + floor(random() * 16)))::time AS created_at,
    transaction_date,
    0::decimal AS total_amount,  -- Will be updated
    0 AS items_count  -- Will be updated
  FROM daily_transactions
  LIMIT 2000  -- Ensure exactly 2000
)
-- Insert transactions
INSERT INTO transactions (id, created_at, transaction_date, total_amount, items_count)
SELECT * FROM all_transactions;

-- Step 3: Generate transaction items
WITH all_products AS (
  SELECT id, price FROM products
),
transaction_items_data AS (
  SELECT 
    gen_random_uuid() AS id,
    t.id AS transaction_id,
    p.id AS product_id,
    FLOOR(random() * 3 + 1)::int AS quantity,
    p.price,
    0::decimal AS subtotal  -- Will be calculated
  FROM transactions t
  -- Each transaction gets 1-5 random products
  CROSS JOIN LATERAL (
    SELECT * FROM all_products 
    ORDER BY random() 
    LIMIT FLOOR(random() * 4 + 1)::int
  ) p
  WHERE t.created_at >= '2025-01-01'
)
INSERT INTO transaction_items (id, transaction_id, product_id, quantity, price, subtotal)
SELECT 
  id,
  transaction_id,
  product_id,
  quantity,
  price,
  price * quantity AS subtotal
FROM transaction_items_data;

-- Step 4: Update transaction totals
UPDATE transactions t
SET 
  total_amount = sub.total,
  items_count = sub.count
FROM (
  SELECT 
    transaction_id,
    SUM(subtotal) AS total,
    SUM(quantity) AS count
  FROM transaction_items
  GROUP BY transaction_id
) sub
WHERE t.id = sub.transaction_id;

-- Step 5: Verify the import
SELECT 
  'Import Complete!' AS status,
  COUNT(DISTINCT t.id) AS total_transactions,
  COUNT(ti.id) AS total_items,
  TO_CHAR(MIN(t.created_at), 'Mon DD, YYYY') AS first_transaction,
  TO_CHAR(MAX(t.created_at), 'Mon DD, YYYY') AS last_transaction,
  TO_CHAR(SUM(t.total_amount), '₱999,999,999.99') AS total_revenue
FROM transactions t
LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
WHERE t.created_at >= '2025-01-01';

-- Step 6: Show brand performance
SELECT 
  b.name AS brand,
  COUNT(DISTINCT ti.transaction_id) AS transactions,
  SUM(ti.quantity) AS units_sold,
  TO_CHAR(SUM(ti.subtotal), '₱999,999.99') AS revenue
FROM brands b
JOIN products p ON b.id = p.brand_id
JOIN transaction_items ti ON p.id = ti.product_id
JOIN transactions t ON ti.transaction_id = t.id
WHERE t.created_at >= '2025-01-01'
GROUP BY b.id, b.name
ORDER BY SUM(ti.subtotal) DESC;