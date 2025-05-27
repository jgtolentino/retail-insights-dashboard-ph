-- Fix RLS Policies for Retail Insights Dashboard
-- This script will drop existing policies and create new ones to ensure proper access

-- First, drop any existing policies that might be conflicting
DROP POLICY IF EXISTS "Allow public read access to brands" ON brands;
DROP POLICY IF EXISTS "Allow public read access to products" ON products;
DROP POLICY IF EXISTS "Allow public read access to stores" ON stores;
DROP POLICY IF EXISTS "Allow public read access to transactions" ON transactions;
DROP POLICY IF EXISTS "Allow public read access to transaction_items" ON transaction_items;

-- Enable RLS on all tables
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read access for dashboard
-- These policies allow both authenticated and anonymous users to read data

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

-- Grant necessary permissions to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- Grant execute permission on the RPC function
GRANT EXECUTE ON FUNCTION public.get_daily_trends(TIMESTAMPTZ, TIMESTAMPTZ) TO anon, authenticated;

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- Test the RPC function
SELECT * FROM get_daily_trends('2025-03-01'::timestamptz, '2025-05-30'::timestamptz) LIMIT 3;
