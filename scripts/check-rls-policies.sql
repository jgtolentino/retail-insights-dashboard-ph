-- Check RLS status on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check existing policies
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- If you need to disable RLS temporarily for testing (run in Supabase SQL Editor):
-- WARNING: Only do this for testing, re-enable for production!

-- ALTER TABLE brands DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE transaction_items DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE skus DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE substitution_events DISABLE ROW LEVEL SECURITY;

-- To add basic read-only policies for anon users:
-- CREATE POLICY "Enable read access for all users" ON brands FOR SELECT USING (true);
-- CREATE POLICY "Enable read access for all users" ON transactions FOR SELECT USING (true);
-- CREATE POLICY "Enable read access for all users" ON transaction_items FOR SELECT USING (true);
-- CREATE POLICY "Enable read access for all users" ON stores FOR SELECT USING (true);
-- CREATE POLICY "Enable read access for all users" ON customers FOR SELECT USING (true);
-- CREATE POLICY "Enable read access for all users" ON skus FOR SELECT USING (true);
-- CREATE POLICY "Enable read access for all users" ON substitution_events FOR SELECT USING (true);