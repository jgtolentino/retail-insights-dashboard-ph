-- Insert data - Run this AFTER creating tables

-- TBWA Brands
INSERT INTO brands (name, category, is_tbwa_client) VALUES
  ('Alaska Milk Corporation', 'Dairy', true),
  ('Oishi', 'Snacks', true),
  ('Peerless', 'Household', true),
  ('Del Monte Philippines', 'Grocery', true),
  ('JTI', 'Cigarettes', true);

-- Competitor Brands
INSERT INTO brands (name, category, is_tbwa_client) VALUES
  ('Bear Brand', 'Dairy', false),
  ('Jack n Jill', 'Snacks', false),
  ('Tide', 'Household', false);

-- Stores
INSERT INTO stores (name, location, region) VALUES
  ('SM Megamall', 'Ortigas, Mandaluyong', 'Metro Manila'),
  ('Robinsons Galleria', 'Ortigas, Quezon City', 'Metro Manila'),
  ('Ayala Center Cebu', 'Cebu Business Park', 'Cebu');

-- Get brand IDs and insert products
INSERT INTO products (brand_id, name, sku, price)
SELECT 
  b.id,
  b.name || ' Product 1',
  b.name || '-001',
  CASE 
    WHEN b.category = 'Dairy' THEN 55.00
    WHEN b.category = 'Snacks' THEN 25.00
    WHEN b.category = 'Cigarettes' THEN 200.00
    ELSE 35.00
  END
FROM brands b;

-- Create some sample transactions
DO $$
DECLARE
  store_rec RECORD;
  trans_id UUID;
  product_rec RECORD;
BEGIN
  -- For each store, create 10 transactions
  FOR store_rec IN SELECT id FROM stores LOOP
    FOR i IN 1..10 LOOP
      -- Create transaction
      INSERT INTO transactions (store_id, transaction_date, total_amount, items_count)
      VALUES (store_rec.id, CURRENT_DATE - (i % 7), 0, 0)
      RETURNING id INTO trans_id;
      
      -- Add 2 random products
      FOR product_rec IN 
        SELECT id, price FROM products ORDER BY RANDOM() LIMIT 2
      LOOP
        INSERT INTO transaction_items (transaction_id, product_id, quantity, price)
        VALUES (trans_id, product_rec.id, 1 + (RANDOM() * 2)::INT, product_rec.price);
      END LOOP;
      
      -- Update totals
      UPDATE transactions 
      SET 
        total_amount = (SELECT SUM(subtotal) FROM transaction_items WHERE transaction_id = trans_id),
        items_count = (SELECT SUM(quantity) FROM transaction_items WHERE transaction_id = trans_id)
      WHERE id = trans_id;
    END LOOP;
  END LOOP;
END $$;

SELECT 'Data inserted successfully!' as status;