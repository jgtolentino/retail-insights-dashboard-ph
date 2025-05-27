-- Fix the data to show more realistic retail analytics

-- First, let's add more products for each brand
INSERT INTO products (brand_id, name, sku, price)
SELECT 
  b.id,
  CASE 
    WHEN b.name = 'Alaska Milk Corporation' THEN 
      CASE p.num
        WHEN 2 THEN 'Alaska Condensada 300ml'
        WHEN 3 THEN 'Alaska Powdered Milk 900g'
        WHEN 4 THEN 'Alaska Fortified Milk 1L'
      END
    WHEN b.name = 'Oishi' THEN
      CASE p.num
        WHEN 2 THEN 'Oishi Pillows Choco'
        WHEN 3 THEN 'Oishi Smart C+ Apple'
        WHEN 4 THEN 'Oishi Potato Fries'
      END
    WHEN b.name = 'Peerless' THEN
      CASE p.num
        WHEN 2 THEN 'Champion Liquid Detergent 1L'
        WHEN 3 THEN 'Pride Dishwashing Liquid 250ml'
        WHEN 4 THEN 'Hana Shampoo 200ml'
      END
    WHEN b.name = 'Del Monte Philippines' THEN
      CASE p.num
        WHEN 2 THEN 'Del Monte Pineapple Juice 1L'
        WHEN 3 THEN 'Del Monte Spaghetti Sauce 500g'
        WHEN 4 THEN 'Del Monte Fruit Cocktail 850g'
      END
    WHEN b.name = 'Bear Brand' THEN
      CASE p.num
        WHEN 2 THEN 'Bear Brand Swak Pack 33g'
        WHEN 3 THEN 'Bear Brand Fortified 1.2kg'
      END
    WHEN b.name = 'Jack n Jill' THEN
      CASE p.num
        WHEN 2 THEN 'Nova Multigrain Chips'
        WHEN 3 THEN 'Piattos Cheese'
      END
  END,
  b.name || '-' || LPAD(p.num::TEXT, 3, '0'),
  CASE 
    WHEN b.category = 'Dairy' THEN 
      CASE p.num 
        WHEN 2 THEN 38.00
        WHEN 3 THEN 120.00
        WHEN 4 THEN 85.00
      END
    WHEN b.category = 'Snacks' THEN 
      CASE p.num
        WHEN 2 THEN 30.00
        WHEN 3 THEN 35.00
        WHEN 4 THEN 28.00
      END
    WHEN b.category = 'Household' THEN
      CASE p.num
        WHEN 2 THEN 95.00
        WHEN 3 THEN 32.00
        WHEN 4 THEN 45.00
      END
    WHEN b.category = 'Grocery' THEN
      CASE p.num
        WHEN 2 THEN 45.00
        WHEN 3 THEN 55.00
        WHEN 4 THEN 65.00
      END
    ELSE 35.00
  END
FROM brands b
CROSS JOIN generate_series(2, 4) AS p(num)
WHERE b.category != 'Cigarettes'  -- Skip cigarettes for additional products
  AND p.num <= CASE 
    WHEN b.name IN ('Bear Brand', 'Jack n Jill', 'Tide', 'Dole', 'Philip Morris') THEN 3
    ELSE 4
  END
ON CONFLICT DO NOTHING;

-- Delete existing transactions to start fresh
DELETE FROM transaction_items;
DELETE FROM transactions;

-- Generate more balanced transactions
DO $$
DECLARE
  store_rec RECORD;
  trans_id UUID;
  product_rec RECORD;
  trans_date DATE;
  num_trans INT;
  num_items INT;
BEGIN
  -- For each store
  FOR store_rec IN SELECT id FROM stores LOOP
    -- For last 30 days
    FOR day_offset IN 0..29 LOOP
      trans_date := CURRENT_DATE - day_offset;
      
      -- More transactions on weekends
      IF EXTRACT(DOW FROM trans_date) IN (0, 6) THEN
        num_trans := 15 + (RANDOM() * 10)::INT;
      ELSE
        num_trans := 10 + (RANDOM() * 8)::INT;
      END IF;
      
      -- Create transactions
      FOR j IN 1..num_trans LOOP
        INSERT INTO transactions (store_id, transaction_date, total_amount, items_count)
        VALUES (store_rec.id, trans_date, 0, 0)
        RETURNING id INTO trans_id;
        
        -- Number of items per transaction (typical basket size)
        num_items := 3 + (RANDOM() * 5)::INT;
        
        -- Add products with bias towards TBWA brands and non-cigarette products
        FOR product_rec IN 
          SELECT p.id, p.price, b.is_tbwa_client, b.category
          FROM products p
          JOIN brands b ON p.brand_id = b.id
          WHERE 
            -- Reduce cigarette purchases
            (b.category != 'Cigarettes' OR RANDOM() < 0.1)
            -- Favor TBWA brands slightly
            AND (NOT b.is_tbwa_client OR RANDOM() < 0.6)
          ORDER BY RANDOM() 
          LIMIT num_items
        LOOP
          INSERT INTO transaction_items (transaction_id, product_id, quantity, price)
          VALUES (
            trans_id, 
            product_rec.id, 
            CASE 
              WHEN product_rec.category = 'Snacks' THEN 2 + (RANDOM() * 3)::INT
              WHEN product_rec.category = 'Dairy' THEN 1 + (RANDOM() * 2)::INT
              ELSE 1 + (RANDOM() * 2)::INT
            END,
            product_rec.price
          );
        END LOOP;
        
        -- Update transaction totals
        UPDATE transactions 
        SET 
          total_amount = (SELECT SUM(subtotal) FROM transaction_items WHERE transaction_id = trans_id),
          items_count = (SELECT SUM(quantity) FROM transaction_items WHERE transaction_id = trans_id)
        WHERE id = trans_id;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- Verify the new data distribution
SELECT 
  b.name as brand,
  b.is_tbwa_client as is_tbwa,
  COUNT(DISTINCT ti.transaction_id) as transactions,
  SUM(ti.subtotal) as total_revenue
FROM brands b
JOIN products p ON b.id = p.brand_id
JOIN transaction_items ti ON p.id = ti.product_id
GROUP BY b.name, b.is_tbwa_client
ORDER BY total_revenue DESC;