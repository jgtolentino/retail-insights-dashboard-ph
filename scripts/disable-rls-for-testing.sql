-- IMPORTANT: This script disables RLS for testing purposes only
-- Run this in your Supabase SQL Editor
-- Remember to re-enable RLS for production!

-- Disable RLS on all tables temporarily
ALTER TABLE brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE skus DISABLE ROW LEVEL SECURITY;
ALTER TABLE substitution_events DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- To re-enable RLS (for production):
-- ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE skus ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE substitution_events ENABLE ROW LEVEL SECURITY;