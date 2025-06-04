-- FINAL CORRECTED SQL - All transaction_date references fixed to created_at
-- Sprint 4 Migration + Customers Table Creation

-- STEP 1: Add Sprint 4 columns to transactions
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS checkout_time TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS request_type VARCHAR(50) DEFAULT 'branded',
ADD COLUMN IF NOT EXISTS transcription_text TEXT,
ADD COLUMN IF NOT EXISTS suggestion_accepted BOOLEAN DEFAULT FALSE;

-- STEP 2: Update 18,000 transactions with Sprint 4 data (FIXED: created_at not transaction_date)
UPDATE transactions 
SET 
  payment_method = CASE 
    WHEN random() < 0.4 THEN 'cash'
    WHEN random() < 0.3 THEN 'gcash'
    WHEN random() < 0.2 THEN 'maya'
    ELSE 'credit'
  END,
  checkout_time = created_at + (random() * INTERVAL '12 hours'),
  request_type = CASE 
    WHEN random() < 0.6 THEN 'branded'
    WHEN random() < 0.3 THEN 'unbranded'
    ELSE 'pointing'
  END,
  suggestion_accepted = random() < 0.7,
  checkout_seconds = 20 + (random() * 180)::INTEGER
WHERE payment_method IS NULL;

-- STEP 3: Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  customer_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  region TEXT NOT NULL,
  city TEXT,
  barangay TEXT,
  loyalty_tier TEXT DEFAULT 'regular',
  total_spent DECIMAL(10,2) DEFAULT 0,
  visit_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 4: Insert sample customers
INSERT INTO customers (customer_id, name, age, gender, region, city, loyalty_tier, total_spent, visit_count) VALUES
('CUST001', 'Maria Santos', 28, 'Female', 'NCR', 'Manila', 'gold', 15000.00, 45),
('CUST002', 'Juan dela Cruz', 35, 'Male', 'Region IV-A', 'Cavite', 'silver', 8500.00, 23),
('CUST003', 'Ana Garcia', 24, 'Female', 'Region VII', 'Cebu', 'regular', 3200.00, 12),
('CUST004', 'Carlos Rodriguez', 42, 'Male', 'NCR', 'Quezon City', 'platinum', 25000.00, 78),
('CUST005', 'Lisa Fernandez', 31, 'Female', 'Region IV-A', 'Laguna', 'gold', 12000.00, 34);

-- STEP 5: Enable security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read customers" ON customers FOR SELECT TO authenticated USING (true);
GRANT SELECT ON customers TO authenticated;