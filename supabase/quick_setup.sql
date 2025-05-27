-- Quick setup - Run this first to create tables
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create minimal tables
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100),
  is_tbwa_client BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID REFERENCES brands(id),
  name VARCHAR(300) NOT NULL,
  sku VARCHAR(100),
  price DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  location VARCHAR(200),
  region VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id),
  transaction_date DATE NOT NULL,
  total_amount DECIMAL(12, 2),
  items_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transaction_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * price) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public read" ON brands FOR SELECT USING (true);
CREATE POLICY "Public read" ON products FOR SELECT USING (true);
CREATE POLICY "Public read" ON stores FOR SELECT USING (true);
CREATE POLICY "Public read" ON transactions FOR SELECT USING (true);
CREATE POLICY "Public read" ON transaction_items FOR SELECT USING (true);