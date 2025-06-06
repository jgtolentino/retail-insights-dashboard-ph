-- Disable RLS on tables that still have it enabled
-- Run this after the views script

ALTER TABLE customer_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE device_health DISABLE ROW LEVEL SECURITY;
ALTER TABLE devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE edge_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_detections DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE substitutions DISABLE ROW LEVEL SECURITY;

-- Verify all RLS is disabled
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;