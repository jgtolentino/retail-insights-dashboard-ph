-- Philippine Retail Analytics Schema
-- For TBWA brands vs competitors

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Brands table
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100),
  is_tbwa_client BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID REFERENCES brands(id),
  name VARCHAR(300) NOT NULL,
  sku VARCHAR(100),
  price DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stores table
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  location VARCHAR(200),
  region VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id),
  transaction_date DATE NOT NULL,
  total_amount DECIMAL(12, 2),
  items_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transaction Items table
CREATE TABLE IF NOT EXISTS transaction_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * price) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_store ON transactions(store_id);
CREATE INDEX idx_transaction_items_product ON transaction_items(product_id);
CREATE INDEX idx_brands_tbwa ON brands(is_tbwa_client);

-- Enable Row Level Security
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public read access" ON brands FOR SELECT USING (true);
CREATE POLICY "Public read access" ON products FOR SELECT USING (true);
CREATE POLICY "Public read access" ON stores FOR SELECT USING (true);
CREATE POLICY "Public read access" ON transactions FOR SELECT USING (true);
CREATE POLICY "Public read access" ON transaction_items FOR SELECT USING (true);

-- Insert sample data
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
  ('Tide', 'Household', false),
  ('Dole', 'Grocery', false),
  ('Philip Morris', 'Cigarettes', false);

-- Sample Stores
INSERT INTO stores (name, location, region) VALUES
  ('SM Megamall', 'Ortigas, Mandaluyong', 'Metro Manila'),
  ('Robinsons Galleria', 'Ortigas, Quezon City', 'Metro Manila'),
  ('Ayala Center Cebu', 'Cebu Business Park', 'Cebu'),
  ('SM City Davao', 'Davao City', 'Davao'),
  ('Puregold Pampanga', 'San Fernando', 'Pampanga');