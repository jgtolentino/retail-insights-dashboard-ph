-- Seed data for retail analytics dashboard
-- This creates realistic sample data for testing

-- First, get brand IDs
WITH brand_ids AS (
  SELECT id, name, is_tbwa_client FROM brands
)

-- Insert products for each brand
INSERT INTO products (brand_id, name, sku, price)
SELECT 
  b.id,
  CASE 
    WHEN b.name = 'Alaska Milk Corporation' THEN 
      CASE (ROW_NUMBER() OVER (PARTITION BY b.id))
        WHEN 1 THEN 'Alaska Evaporated Milk 370ml'
        WHEN 2 THEN 'Alaska Condensada 300ml'
        WHEN 3 THEN 'Alaska Powdered Milk 900g'
      END
    WHEN b.name = 'Oishi' THEN
      CASE (ROW_NUMBER() OVER (PARTITION BY b.id))
        WHEN 1 THEN 'Oishi Prawn Crackers Original'
        WHEN 2 THEN 'Oishi Pillows Choco'
        WHEN 3 THEN 'Oishi Smart C+ Apple'
      END
    WHEN b.name = 'Peerless' THEN
      CASE (ROW_NUMBER() OVER (PARTITION BY b.id))
        WHEN 1 THEN 'Champion Detergent Bar 350g'
        WHEN 2 THEN 'Champion Liquid Detergent 1L'
        WHEN 3 THEN 'Pride Dishwashing Liquid 250ml'
      END
    WHEN b.name = 'Del Monte Philippines' THEN
      CASE (ROW_NUMBER() OVER (PARTITION BY b.id))
        WHEN 1 THEN 'Del Monte Tomato Ketchup 320g'
        WHEN 2 THEN 'Del Monte Pineapple Juice 1L'
        WHEN 3 THEN 'Del Monte Spaghetti Sauce 500g'
      END
    WHEN b.name = 'JTI' THEN
      CASE (ROW_NUMBER() OVER (PARTITION BY b.id))
        WHEN 1 THEN 'Winston Red Pack'
        WHEN 2 THEN 'Camel Blue Pack'
        WHEN 3 THEN 'Mevius Original Pack'
      END
    WHEN b.name = 'Bear Brand' THEN
      CASE (ROW_NUMBER() OVER (PARTITION BY b.id))
        WHEN 1 THEN 'Bear Brand Adult Plus 1kg'
        WHEN 2 THEN 'Bear Brand Swak Pack 33g'
      END
    WHEN b.name = 'Jack n Jill' THEN
      CASE (ROW_NUMBER() OVER (PARTITION BY b.id))
        WHEN 1 THEN 'Chippy BBQ 110g'
        WHEN 2 THEN 'Nova Multigrain Chips'
      END
    ELSE b.name || ' Product'
  END,
  b.name || '-' || LPAD((ROW_NUMBER() OVER (PARTITION BY b.id))::TEXT, 3, '0'),
  CASE 
    WHEN b.name LIKE '%Milk%' OR b.name = 'Bear Brand' THEN 45 + (RANDOM() * 30)::INT
    WHEN b.name LIKE '%Snacks%' OR b.name = 'Oishi' OR b.name = 'Jack n Jill' THEN 15 + (RANDOM() * 20)::INT
    WHEN b.name = 'JTI' OR b.name = 'Philip Morris' THEN 180 + (RANDOM() * 50)::INT
    ELSE 25 + (RANDOM() * 50)::INT
  END
FROM brand_ids b
CROSS JOIN generate_series(1, 3) AS product_num
WHERE product_num <= 3;

-- Generate transactions for the last 30 days
DO $$
DECLARE
  store_rec RECORD;
  trans_date DATE;
  trans_id UUID;
  product_rec RECORD;
  num_items INT;
BEGIN
  -- For each store
  FOR store_rec IN SELECT id FROM stores LOOP
    -- For each day in the last 30 days
    FOR trans_date IN SELECT generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, '1 day'::INTERVAL)::DATE LOOP
      -- Create 5-15 transactions per day per store
      FOR i IN 1..(5 + (RANDOM() * 10)::INT) LOOP
        -- Create transaction
        INSERT INTO transactions (store_id, transaction_date, total_amount, items_count)
        VALUES (store_rec.id, trans_date, 0, 0)
        RETURNING id INTO trans_id;
        
        -- Add 1-5 items per transaction
        num_items := 1 + (RANDOM() * 4)::INT;
        
        -- Add random products to transaction
        FOR product_rec IN 
          SELECT id, price FROM products 
          ORDER BY RANDOM() 
          LIMIT num_items
        LOOP
          INSERT INTO transaction_items (transaction_id, product_id, quantity, price)
          VALUES (
            trans_id, 
            product_rec.id, 
            1 + (RANDOM() * 3)::INT,
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