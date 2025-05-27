-- Add sample customer demographic data to existing transactions
-- This will populate the customer_age and customer_gender fields

UPDATE transactions 
SET 
  customer_age = (CASE 
    WHEN random() < 0.15 THEN floor(random() * 7 + 18)::int  -- 18-24 (15%)
    WHEN random() < 0.40 THEN floor(random() * 10 + 25)::int -- 25-34 (25%) 
    WHEN random() < 0.65 THEN floor(random() * 10 + 35)::int -- 35-44 (25%)
    WHEN random() < 0.85 THEN floor(random() * 10 + 45)::int -- 45-54 (20%)
    ELSE floor(random() * 15 + 55)::int                      -- 55-69 (15%)
  END),
  customer_gender = (CASE 
    WHEN random() < 0.52 THEN 'Female'   -- 52%
    WHEN random() < 0.98 THEN 'Male'     -- 46% 
    ELSE 'Unknown'                       -- 2%
  END),
  amount = COALESCE(amount, total_amount) -- Ensure amount field is populated
WHERE customer_age IS NULL OR customer_gender IS NULL;

-- Verify the update
SELECT 
  'Age Distribution' as metric,
  COUNT(*) as total_records,
  COUNT(customer_age) as records_with_age,
  COUNT(customer_gender) as records_with_gender
FROM transactions

UNION ALL

SELECT 
  'Sample Data' as metric,
  COUNT(*) as total_records,
  MIN(customer_age) as min_age,
  MAX(customer_age) as max_age
FROM transactions
WHERE customer_age IS NOT NULL;

-- Test our functions with the new data
SELECT 'Age Distribution Test' as test, * FROM get_age_distribution('2025-04-30T00:00:00Z', '2025-05-30T23:59:59Z', 10);
SELECT 'Gender Distribution Test' as test, * FROM get_gender_distribution('2025-04-30T00:00:00Z', '2025-05-30T23:59:59Z');