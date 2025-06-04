-- Create missing customers table
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  customer_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  region TEXT NOT NULL,
  city TEXT,
  barangay TEXT,
  loyalty_tier TEXT DEFAULT 'regular' CHECK (loyalty_tier IN ('regular', 'silver', 'gold', 'platinum')),
  total_spent DECIMAL(10,2) DEFAULT 0,
  visit_count INTEGER DEFAULT 1,
  last_visit TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_region ON customers(region);
CREATE INDEX IF NOT EXISTS idx_customers_gender ON customers(gender);
CREATE INDEX IF NOT EXISTS idx_customers_loyalty_tier ON customers(loyalty_tier);
CREATE INDEX IF NOT EXISTS idx_customers_age ON customers(age);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Allow authenticated read customers" ON customers
  FOR SELECT TO authenticated USING (true);

-- Grant permissions
GRANT SELECT ON customers TO authenticated;

-- Insert sample customer data
INSERT INTO customers (customer_id, name, age, gender, region, city, barangay, loyalty_tier, total_spent, visit_count) VALUES
('CUST001', 'Maria Santos', 28, 'Female', 'NCR', 'Manila', 'Ermita', 'gold', 15000.00, 45),
('CUST002', 'Juan dela Cruz', 35, 'Male', 'Region IV-A', 'Cavite', 'Tagaytay', 'silver', 8500.00, 23),
('CUST003', 'Ana Garcia', 24, 'Female', 'Region VII', 'Cebu', 'Lahug', 'regular', 3200.00, 12),
('CUST004', 'Carlos Rodriguez', 42, 'Male', 'NCR', 'Quezon City', 'Diliman', 'platinum', 25000.00, 78),
('CUST005', 'Lisa Fernandez', 31, 'Female', 'Region IV-A', 'Laguna', 'Los Baños', 'gold', 12000.00, 34),
('CUST006', 'Miguel Reyes', 29, 'Male', 'Region VII', 'Cebu', 'Banilad', 'silver', 6800.00, 19),
('CUST007', 'Sofia Castillo', 26, 'Female', 'NCR', 'Makati', 'Poblacion', 'gold', 14500.00, 41),
('CUST008', 'Diego Martinez', 33, 'Male', 'Region IV-A', 'Batangas', 'Lipa', 'regular', 4100.00, 15),
('CUST009', 'Carmen Lopez', 37, 'Female', 'Region VII', 'Cebu', 'Mabolo', 'platinum', 22000.00, 65),
('CUST010', 'Roberto Gonzales', 45, 'Male', 'NCR', 'Pasig', 'Ortigas', 'silver', 9200.00, 28);

-- Add more customers to reach good sample size
INSERT INTO customers (customer_id, name, age, gender, region, city, barangay, loyalty_tier, total_spent, visit_count)
SELECT 
  'CUST' || LPAD((generate_series(11, 100))::TEXT, 3, '0'),
  CASE 
    WHEN random() < 0.5 THEN 'Customer ' || generate_series(11, 100)
    ELSE 'Shopper ' || generate_series(11, 100)
  END,
  18 + (random() * 50)::INTEGER,
  CASE 
    WHEN random() < 0.52 THEN 'Female'
    ELSE 'Male'
  END,
  CASE 
    WHEN random() < 0.4 THEN 'NCR'
    WHEN random() < 0.7 THEN 'Region IV-A'
    ELSE 'Region VII'
  END,
  CASE 
    WHEN random() < 0.3 THEN 'Manila'
    WHEN random() < 0.6 THEN 'Cebu'
    ELSE 'Cavite'
  END,
  'Barangay ' || (1 + (random() * 20)::INTEGER),
  CASE 
    WHEN random() < 0.5 THEN 'regular'
    WHEN random() < 0.3 THEN 'silver'
    WHEN random() < 0.15 THEN 'gold'
    ELSE 'platinum'
  END,
  (1000 + random() * 30000)::DECIMAL(10,2),
  (1 + random() * 100)::INTEGER
FROM generate_series(11, 100);

RAISE NOTICE 'Created customers table with % records', (SELECT COUNT(*) FROM customers);