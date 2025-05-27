-- Enhanced seed data with more FMCG brands and Philippine regions

-- First, clear existing data
TRUNCATE TABLE transaction_items CASCADE;
TRUNCATE TABLE transactions CASCADE;
TRUNCATE TABLE stores CASCADE;
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE brands CASCADE;

-- Insert enhanced brands (more FMCG focused)
INSERT INTO brands (name, is_tbwa_client) VALUES
-- TBWA Clients
('Procter & Gamble', true),
('Nestle', true),
('Philip Morris', true),
('San Miguel Corporation', true),
('Globe Telecom', true),
('Smart Communications', true),
('Alaska Milk', true),
('Del Monte', true),

-- Major Competitors
('Unilever', false),
('Coca-Cola', false),
('PepsiCo', false),
('Colgate-Palmolive', false),
('Universal Robina Corp', false),
('Monde Nissin', false),
('Liwayway', false),
('Japan Tobacco', false),
('Rebisco', false),
('Zest-O', false),
('Mega Sardines', false),
('CDO Foodsphere', false),
('Century Pacific', false),
('Purefoods', false),
('Magnolia', false),
('Jack n Jill', false);

-- Insert products with parent company association
INSERT INTO products (name, brand_id, price, category) 
SELECT 
  p.name,
  b.id,
  p.price,
  p.category
FROM brands b
CROSS JOIN LATERAL (
  VALUES 
    -- P&G Products
    ('Safeguard Soap', 35.00, 'Personal Care'),
    ('Tide Powder 1kg', 145.00, 'Household'),
    ('Ariel Liquid 900ml', 165.00, 'Household'),
    ('Head & Shoulders Shampoo', 179.00, 'Personal Care'),
    ('Pantene Conditioner', 185.00, 'Personal Care'),
    
    -- Nestle Products
    ('Nescafe 3in1 Twin Pack', 14.00, 'Beverages'),
    ('Milo 300g', 135.00, 'Beverages'),
    ('Bear Brand Adult Plus', 165.00, 'Dairy'),
    ('Maggi Savor 130ml', 38.00, 'Condiments'),
    ('KitKat 2 Finger', 25.00, 'Snacks'),
    
    -- Unilever Products
    ('Knorr Sinigang Mix', 22.00, 'Condiments'),
    ('Surf Powder 60g', 12.00, 'Household'),
    ('Dove Soap 135g', 65.00, 'Personal Care'),
    ('Closeup Toothpaste', 89.00, 'Personal Care'),
    ('Rexona Deo Spray', 145.00, 'Personal Care'),
    
    -- Local Favorites
    ('Lucky Me Pancit Canton', 15.00, 'Food'),
    ('Chippy BBQ', 28.00, 'Snacks'),
    ('C2 Green Tea 500ml', 35.00, 'Beverages'),
    ('Great Taste White', 12.00, 'Beverages'),
    ('Argentina Corned Beef', 42.00, 'Food'),
    ('555 Tuna Flakes', 38.00, 'Food'),
    ('Young Town Sardines', 22.00, 'Food'),
    
    -- Cigarettes (for realism)
    ('Marlboro Red', 165.00, 'Tobacco'),
    ('Philip Morris Blue', 155.00, 'Tobacco'),
    ('Fortune Menthol', 145.00, 'Tobacco'),
    ('Mighty Red', 85.00, 'Tobacco'),
    ('Hope Luxury', 95.00, 'Tobacco')
) AS p(name, price, category)
WHERE 
  (b.name = 'Procter & Gamble' AND p.category IN ('Personal Care', 'Household')) OR
  (b.name = 'Nestle' AND p.category IN ('Beverages', 'Dairy', 'Condiments', 'Snacks')) OR
  (b.name = 'Unilever' AND p.category IN ('Personal Care', 'Household', 'Condiments')) OR
  (b.name = 'Philip Morris' AND p.name LIKE '%Marlboro%' OR p.name LIKE '%Philip Morris%' OR p.name LIKE '%Fortune%') OR
  (b.name = 'Japan Tobacco' AND p.name LIKE '%Mighty%' OR p.name LIKE '%Hope%') OR
  (b.name = 'Universal Robina Corp' AND p.name IN ('C2 Green Tea 500ml', 'Great Taste White')) OR
  (b.name = 'Monde Nissin' AND p.name = 'Lucky Me Pancit Canton') OR
  (b.name = 'Jack n Jill' AND p.name = 'Chippy BBQ') OR
  (b.name = 'Century Pacific' AND p.name IN ('Argentina Corned Beef', '555 Tuna Flakes')) OR
  (b.name = 'Mega Sardines' AND p.name = 'Young Town Sardines') OR
  (b.name = 'Alaska Milk' AND p.name = 'Bear Brand Adult Plus') OR
  (b.name = 'Del Monte' AND p.name = 'Del Monte Ketchup');

-- Insert stores across major Philippine regions
INSERT INTO stores (name, region, type) VALUES
-- Metro Manila
('7-Eleven Makati Ave', 'Metro Manila', 'Convenience'),
('Family Mart BGC', 'Metro Manila', 'Convenience'),
('SM Megamall Supermarket', 'Metro Manila', 'Supermarket'),
('Robinsons Ermita', 'Metro Manila', 'Supermarket'),
('Puregold Cubao', 'Metro Manila', 'Supermarket'),
('Mercury Drug Ortigas', 'Metro Manila', 'Pharmacy'),
('Ministop Pasig', 'Metro Manila', 'Convenience'),
('All Day Convenience QC', 'Metro Manila', 'Convenience'),

-- Luzon
('SM City Baguio', 'Cordillera', 'Supermarket'),
('Robinsons Lipa', 'Calabarzon', 'Supermarket'),
('Puregold Dagupan', 'Ilocos Region', 'Supermarket'),
('7-Eleven Subic', 'Central Luzon', 'Convenience'),
('Mercury Drug Tuguegarao', 'Cagayan Valley', 'Pharmacy'),
('Gaisano Legazpi', 'Bicol Region', 'Supermarket'),

-- Visayas
('Ayala Center Cebu', 'Central Visayas', 'Supermarket'),
('SM City Iloilo', 'Western Visayas', 'Supermarket'),
('Robinsons Tacloban', 'Eastern Visayas', 'Supermarket'),
('Gaisano Capital Ormoc', 'Eastern Visayas', 'Supermarket'),
('Metro Retail Bacolod', 'Western Visayas', 'Supermarket'),

-- Mindanao
('SM Lanang Davao', 'Davao Region', 'Supermarket'),
('Gaisano Mall GenSan', 'Soccsksargen', 'Supermarket'),
('Robinsons Cagayan de Oro', 'Northern Mindanao', 'Supermarket'),
('NCCC Mall Zamboanga', 'Zamboanga Peninsula', 'Supermarket'),
('Gaisano Butuan', 'Caraga', 'Supermarket');

-- Generate transactions with more realistic distribution
DO $$
DECLARE
  store_record RECORD;
  product_record RECORD;
  trans_id INTEGER;
  trans_date DATE;
  num_items INTEGER;
  i INTEGER;
  j INTEGER;
BEGIN
  -- Generate transactions for the last 30 days
  FOR i IN 0..29 LOOP
    trans_date := CURRENT_DATE - INTERVAL '1 day' * i;
    
    -- Generate 50-150 transactions per day per store
    FOR store_record IN SELECT * FROM stores LOOP
      FOR j IN 1..(50 + floor(random() * 100))::INTEGER LOOP
        -- Insert transaction
        INSERT INTO transactions (store_id, transaction_date, total_amount, items_count)
        VALUES (store_record.id, trans_date, 0, 0)
        RETURNING id INTO trans_id;
        
        -- Random number of items (1-8, weighted towards smaller baskets)
        num_items := CASE 
          WHEN random() < 0.4 THEN 1
          WHEN random() < 0.7 THEN 2 + floor(random() * 2)::INTEGER
          WHEN random() < 0.9 THEN 4 + floor(random() * 2)::INTEGER
          ELSE 6 + floor(random() * 3)::INTEGER
        END;
        
        -- Add items to transaction
        FOR product_record IN 
          SELECT * FROM products 
          ORDER BY 
            CASE 
              -- Higher probability for daily essentials
              WHEN category IN ('Food', 'Beverages', 'Personal Care') THEN random() * 0.3
              -- Medium probability for household items
              WHEN category = 'Household' THEN random() * 0.5
              -- Lower probability for tobacco
              WHEN category = 'Tobacco' THEN random() * 0.8
              ELSE random()
            END
          LIMIT num_items
        LOOP
          INSERT INTO transaction_items (transaction_id, product_id, quantity, unit_price, subtotal)
          VALUES (
            trans_id,
            product_record.id,
            CASE 
              WHEN product_record.category = 'Tobacco' THEN 1
              WHEN product_record.price < 50 THEN 1 + floor(random() * 3)::INTEGER
              ELSE 1 + floor(random() * 2)::INTEGER
            END,
            product_record.price,
            product_record.price * (
              CASE 
                WHEN product_record.category = 'Tobacco' THEN 1
                WHEN product_record.price < 50 THEN 1 + floor(random() * 3)::INTEGER
                ELSE 1 + floor(random() * 2)::INTEGER
              END
            )
          );
        END LOOP;
        
        -- Update transaction totals
        UPDATE transactions
        SET 
          total_amount = (SELECT COALESCE(SUM(subtotal), 0) FROM transaction_items WHERE transaction_id = trans_id),
          items_count = (SELECT COUNT(*) FROM transaction_items WHERE transaction_id = trans_id)
        WHERE id = trans_id;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;