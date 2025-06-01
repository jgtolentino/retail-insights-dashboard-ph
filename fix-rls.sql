-- Quick fix for Row Level Security blocking data access
-- Run this in Supabase SQL Editor if your dashboard shows 0 records

-- Disable RLS on all main tables
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items DISABLE ROW LEVEL SECURITY;

-- Verify the data is accessible
SELECT 
  COUNT(*) as total_transactions,
  SUM(total_amount) as total_revenue,
  AVG(total_amount) as avg_transaction,
  MIN(transaction_date) as earliest_date,
  MAX(transaction_date) as latest_date
FROM transactions;

-- Check a few sample records
SELECT 
  id, 
  total_amount, 
  transaction_date,
  customer_id,
  store_id
FROM transactions 
ORDER BY transaction_date DESC 
LIMIT 5;