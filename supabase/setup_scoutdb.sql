-- Complete setup for Scout Dashboard
-- Run this entire file in your Supabase SQL editor

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create tables
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100),
  is_tbwa_client BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID REFERENCES brands(id),
  name VARCHAR(300) NOT NULL,
  sku VARCHAR(100),
  price DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  location VARCHAR(200),
  region VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id),
  transaction_date DATE NOT NULL,
  total_amount DECIMAL(12, 2),
  items_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transaction_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * price) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_store ON transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_product ON transaction_items(product_id);
CREATE INDEX IF NOT EXISTS idx_brands_tbwa ON brands(is_tbwa_client);

-- 4. Enable Row Level Security
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

-- 5. Create policies for public read access
CREATE POLICY "Public read access" ON brands FOR SELECT USING (true);
CREATE POLICY "Public read access" ON products FOR SELECT USING (true);
CREATE POLICY "Public read access" ON stores FOR SELECT USING (true);
CREATE POLICY "Public read access" ON transactions FOR SELECT USING (true);
CREATE POLICY "Public read access" ON transaction_items FOR SELECT USING (true);

-- 6. Insert brands
INSERT INTO brands (name, category, is_tbwa_client) VALUES
  ('Alaska Milk Corporation', 'Dairy', true),
  ('Oishi', 'Snacks', true),
  ('Peerless', 'Household', true),
  ('Del Monte Philippines', 'Grocery', true),
  ('JTI', 'Cigarettes', true),
  ('Bear Brand', 'Dairy', false),
  ('Jack n Jill', 'Snacks', false),
  ('Tide', 'Household', false),
  ('Dole', 'Grocery', false),
  ('Philip Morris', 'Cigarettes', false)
ON CONFLICT DO NOTHING;

-- 7. Insert stores
INSERT INTO stores (name, location, region) VALUES
  ('SM Megamall', 'Ortigas, Mandaluyong', 'Metro Manila'),
  ('Robinsons Galleria', 'Ortigas, Quezon City', 'Metro Manila'),
  ('Ayala Center Cebu', 'Cebu Business Park', 'Cebu'),
  ('SM City Davao', 'Davao City', 'Davao'),
  ('Puregold Pampanga', 'San Fernando', 'Pampanga')
ON CONFLICT DO NOTHING;

-- 8. Insert products with proper brand relationships
INSERT INTO products (brand_id, name, sku, price)
SELECT 
  b.id,
  CASE 
    WHEN b.name = 'Alaska Milk Corporation' AND p.num = 1 THEN 'Alaska Evaporated Milk 370ml'
    WHEN b.name = 'Alaska Milk Corporation' AND p.num = 2 THEN 'Alaska Condensada 300ml'
    WHEN b.name = 'Alaska Milk Corporation' AND p.num = 3 THEN 'Alaska Powdered Milk 900g'
    WHEN b.name = 'Oishi' AND p.num = 1 THEN 'Oishi Prawn Crackers Original'
    WHEN b.name = 'Oishi' AND p.num = 2 THEN 'Oishi Pillows Choco'
    WHEN b.name = 'Oishi' AND p.num = 3 THEN 'Oishi Smart C+ Apple'
    WHEN b.name = 'Peerless' AND p.num = 1 THEN 'Champion Detergent Bar 350g'
    WHEN b.name = 'Peerless' AND p.num = 2 THEN 'Champion Liquid Detergent 1L'
    WHEN b.name = 'Peerless' AND p.num = 3 THEN 'Pride Dishwashing Liquid 250ml'
    WHEN b.name = 'Del Monte Philippines' AND p.num = 1 THEN 'Del Monte Tomato Ketchup 320g'
    WHEN b.name = 'Del Monte Philippines' AND p.num = 2 THEN 'Del Monte Pineapple Juice 1L'
    WHEN b.name = 'Del Monte Philippines' AND p.num = 3 THEN 'Del Monte Spaghetti Sauce 500g'
    WHEN b.name = 'JTI' AND p.num = 1 THEN 'Winston Red Pack'
    WHEN b.name = 'JTI' AND p.num = 2 THEN 'Camel Blue Pack'
    WHEN b.name = 'JTI' AND p.num = 3 THEN 'Mevius Original Pack'
    WHEN b.name = 'Bear Brand' AND p.num = 1 THEN 'Bear Brand Adult Plus 1kg'
    WHEN b.name = 'Bear Brand' AND p.num = 2 THEN 'Bear Brand Swak Pack 33g'
    WHEN b.name = 'Jack n Jill' AND p.num = 1 THEN 'Chippy BBQ 110g'
    WHEN b.name = 'Jack n Jill' AND p.num = 2 THEN 'Nova Multigrain Chips'
    WHEN b.name = 'Tide' AND p.num = 1 THEN 'Tide Powder 1kg'
    WHEN b.name = 'Dole' AND p.num = 1 THEN 'Dole Pineapple Chunks'
    WHEN b.name = 'Philip Morris' AND p.num = 1 THEN 'Marlboro Red Pack'
  END,
  b.name || '-' || LPAD(p.num::TEXT, 3, '0'),
  CASE 
    WHEN b.category = 'Dairy' THEN 45 + (RANDOM() * 30)::INT
    WHEN b.category = 'Snacks' THEN 15 + (RANDOM() * 20)::INT
    WHEN b.category = 'Cigarettes' THEN 180 + (RANDOM() * 50)::INT
    ELSE 25 + (RANDOM() * 50)::INT
  END
FROM brands b
CROSS JOIN generate_series(1, 3) AS p(num)
WHERE p.num <= CASE 
  WHEN b.name IN ('Bear Brand', 'Jack n Jill', 'Tide', 'Dole', 'Philip Morris') THEN 2
  ELSE 3
END
ON CONFLICT DO NOTHING;

-- 9. Generate sample transactions for the last 30 days
DO $$
DECLARE
  store_rec RECORD;
  trans_date DATE;
  trans_id UUID;
  product_rec RECORD;
  num_items INT;
  i INT;
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

-- 10. Verify data was created
SELECT 'Setup complete!' as status,
  (SELECT COUNT(*) FROM brands) as total_brands,
  (SELECT COUNT(*) FROM products) as total_products,
  (SELECT COUNT(*) FROM stores) as total_stores,
  (SELECT COUNT(*) FROM transactions) as total_transactions,
  (SELECT COUNT(*) FROM transaction_items) as total_items;