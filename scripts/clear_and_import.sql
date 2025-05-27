-- Step 1: Clear existing data
TRUNCATE transaction_items CASCADE;
TRUNCATE transactions CASCADE;

-- Step 2: Generate exactly 2000 transactions with realistic data
WITH date_range AS (
  SELECT generate_series(
    '2025-01-01'::date,
    '2025-05-31'::date,
    '1 day'::interval
  )::date AS transaction_date
),
daily_transactions AS (
  SELECT 
    transaction_date,
    generate_series(1, 
      CASE 
        WHEN EXTRACT(dow FROM transaction_date) IN (0,6) THEN 15
        ELSE 13
      END
    ) AS daily_num
  FROM date_range
),
all_transactions AS (
  SELECT 
    gen_random_uuid() AS id,
    transaction_date + (interval '1 hour' * (6 + floor(random() * 16)))::time AS created_at,
    transaction_date,
    0::decimal AS total_amount,
    0 AS items_count
  FROM daily_transactions
  LIMIT 2000
)
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
    0::decimal AS subtotal
  FROM transactions t
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

-- Step 5: Verify the data
SELECT 
  'Import Summary' AS status,
  COUNT(DISTINCT t.id) AS total_transactions,
  COUNT(ti.id) AS total_items,
  ROUND(SUM(t.total_amount)::numeric, 2) AS total_revenue,
  MIN(t.created_at)::date AS start_date,
  MAX(t.created_at)::date AS end_date
FROM transactions t
LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
WHERE t.created_at >= '2025-01-01';