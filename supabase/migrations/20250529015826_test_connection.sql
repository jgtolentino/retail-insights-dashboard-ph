-- Test Supabase CLI Connection
-- This script tests if you can run SQL via CLI

-- Show current database
SELECT current_database() as database_name;

-- Show current user
SELECT current_user as user_name;

-- List tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name
LIMIT 10;

-- Test creating a temporary table
CREATE TEMP TABLE test_cli_connection (
    id SERIAL PRIMARY KEY,
    message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert test data
INSERT INTO test_cli_connection (message) 
VALUES ('Supabase CLI is working!');

-- Query it
SELECT * FROM test_cli_connection;

-- Note: TEMP tables are automatically dropped when session ends