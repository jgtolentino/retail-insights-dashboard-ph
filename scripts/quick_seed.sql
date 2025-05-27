-- Quick seed with fixed UUIDs for testing
-- Run this in Supabase SQL Editor for immediate results

-- Insert test brands with fixed UUIDs
INSERT INTO brands (id, name, is_tbwa_client, category) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Alaska', false, 'Dairy'),
  ('22222222-2222-2222-2222-222222222222', 'Bear Brand', false, 'Dairy'),
  ('33333333-3333-3333-3333-333333333333', 'Champion', false, 'Detergent'),
  ('44444444-4444-4444-4444-444444444444', 'Fortune', false, 'Cigarettes'),
  ('55555555-5555-5555-5555-555555555555', 'Hope', false, 'Cigarettes'),
  ('66666666-6666-6666-6666-666666666666', 'Marlboro', false, 'Cigarettes'),
  ('77777777-7777-7777-7777-777777777777', 'More', false, 'Cigarettes'),
  ('88888888-8888-8888-8888-888888888888', 'Philip Morris', false, 'Cigarettes')
ON CONFLICT (id) DO NOTHING;

-- Insert products with fixed UUIDs
INSERT INTO products (id, name, brand_id, price) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Alaska Evap', '11111111-1111-1111-1111-111111111111', 45.00),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Bear Brand Milk', '22222222-2222-2222-2222-222222222222', 52.00),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Champion Detergent', '33333333-3333-3333-3333-333333333333', 87.00),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Fortune Cigarettes', '44444444-4444-4444-4444-444444444444', 150.00),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Hope Cigarettes', '55555555-5555-5555-5555-555555555555', 145.00),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Marlboro Red', '66666666-6666-6666-6666-666666666666', 170.00),
  ('gggggggg-gggg-gggg-gggg-gggggggggggg', 'More Cigarettes', '77777777-7777-7777-7777-777777777777', 155.00),
  ('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 'Philip Morris', '88888888-8888-8888-8888-888888888888', 165.00)
ON CONFLICT (id) DO NOTHING;

-- Generate 100 test transactions for today
INSERT INTO transactions (id, transaction_date, total_amount, items_count)
SELECT 
  gen_random_uuid(),
  NOW() - (INTERVAL '1 hour' * generate_series),
  ROUND((RANDOM() * 500 + 100)::numeric, 2),
  FLOOR(RANDOM() * 5 + 1)::int
FROM generate_series(1, 100);

-- Generate items for each transaction
INSERT INTO transaction_items (transaction_id, product_id, quantity, price, subtotal)
SELECT 
  t.id,
  p.id,
  FLOOR(RANDOM() * 3 + 1)::int,
  p.price,
  p.price * FLOOR(RANDOM() * 3 + 1)::int
FROM transactions t
CROSS JOIN LATERAL (
  SELECT * FROM products ORDER BY RANDOM() LIMIT 3
) p
WHERE t.created_at >= NOW() - INTERVAL '1 day';

-- Update totals
UPDATE transactions t
SET 
  total_amount = sub.total,
  items_count = sub.count
FROM (
  SELECT 
    transaction_id,
    SUM(subtotal) as total,
    SUM(quantity) as count
  FROM transaction_items
  GROUP BY transaction_id
) sub
WHERE t.id = sub.transaction_id;