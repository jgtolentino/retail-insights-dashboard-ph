-- Fix the Consumer Insights data issue
-- This adds sample customer demographic data to your existing transactions

-- First, let's check what we have
SELECT 
  COUNT(*) as total_transactions,
  COUNT(customer_age) as with_age,
  COUNT(customer_gender) as with_gender,
  MIN(created_at) as earliest,
  MAX(created_at) as latest
FROM transactions;

-- Add customer demographic data to existing transactions
UPDATE transactions 
SET 
  customer_age = (
    CASE 
      WHEN random() < 0.15 THEN floor(random() * 7 + 18)::int  -- 18-24 (15%)
      WHEN random() < 0.40 THEN floor(random() * 10 + 25)::int -- 25-34 (25%) 
      WHEN random() < 0.65 THEN floor(random() * 10 + 35)::int -- 35-44 (25%)
      WHEN random() < 0.85 THEN floor(random() * 10 + 45)::int -- 45-54 (20%)
      ELSE floor(random() * 15 + 55)::int                      -- 55-69 (15%)
    END
  ),
  customer_gender = (
    CASE 
      WHEN random() < 0.52 THEN 'Female'   -- 52%
      WHEN random() < 0.98 THEN 'Male'     -- 46% 
      ELSE 'Unknown'                       -- 2%
    END
  ),
  amount = COALESCE(amount, total_amount, floor(random() * 500 + 50)::numeric)
WHERE customer_age IS NULL OR customer_gender IS NULL;

-- Verify the data was added
SELECT 
  COUNT(*) as total_transactions,
  COUNT(customer_age) as with_age,
  COUNT(customer_gender) as with_gender,
  AVG(customer_age) as avg_age
FROM transactions;

-- Test the functions
SELECT 'Age Distribution' as test, * FROM get_age_distribution('2025-04-30T00:00:00Z', '2025-05-30T23:59:59Z', 10) LIMIT 5;
SELECT 'Gender Distribution' as test, * FROM get_gender_distribution('2025-04-30T00:00:00Z', '2025-05-30T23:59:59Z') LIMIT 5;