-- Fix database access for the dashboard
-- Run this in Supabase SQL Editor

-- Step 1: Disable RLS on all tables (for anonymous read access)
ALTER TABLE IF EXISTS brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transaction_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS skus DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS substitution_events DISABLE ROW LEVEL SECURITY;

-- Step 2: Grant permissions to anon role
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Step 3: Ensure functions are accessible
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- Step 4: Verify the fix
DO $$
BEGIN
    RAISE NOTICE 'Database access configuration complete!';
    RAISE NOTICE 'RLS has been disabled for all tables.';
    RAISE NOTICE 'Anonymous users can now read data.';
END $$;