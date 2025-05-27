-- RLS Policies for Retail Insights Dashboard
-- Run these in your Supabase SQL Editor to allow public read access

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read access for dashboard
-- This allows anonymous users to read data for the dashboard

-- Brands table - allow public read
CREATE POLICY "Allow public read access to brands" ON brands
FOR SELECT USING (true);

-- Products table - allow public read
CREATE POLICY "Allow public read access to products" ON products
FOR SELECT USING (true);

-- Stores table - allow public read
CREATE POLICY "Allow public read access to stores" ON stores
FOR SELECT USING (true);

-- Transactions table - allow public read
CREATE POLICY "Allow public read access to transactions" ON transactions
FOR SELECT USING (true);

-- Transaction items table - allow public read
CREATE POLICY "Allow public read access to transaction_items" ON transaction_items
FOR SELECT USING (true);

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
