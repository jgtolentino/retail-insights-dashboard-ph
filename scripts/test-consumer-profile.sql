-- Test the get_consumer_profile function to see what it returns
-- Run this in your Supabase SQL Editor

-- Test with default parameters (last 30 days)
SELECT get_consumer_profile();

-- Test with specific date range
SELECT get_consumer_profile(
  NOW() - INTERVAL '30 days',
  NOW()
);

-- Check if transactions table has gender data
SELECT 
  customer_gender,
  COUNT(*) as count,
  ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 1) as percentage
FROM transactions
WHERE customer_gender IS NOT NULL
  AND customer_gender != ''
GROUP BY customer_gender
ORDER BY customer_gender;

-- Alternative: Create a simple gender distribution function
CREATE OR REPLACE FUNCTION get_gender_distribution(
  p_start timestamptz DEFAULT NOW() - INTERVAL '30 days',
  p_end timestamptz DEFAULT NOW()
)
RETURNS TABLE (
  gender text,
  count bigint,
  percentage numeric
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH gender_counts AS (
    SELECT 
      customer_gender as gender,
      COUNT(*) as count
    FROM transactions
    WHERE created_at BETWEEN p_start AND p_end
      AND customer_gender IS NOT NULL
      AND customer_gender != ''
    GROUP BY customer_gender
  ),
  total AS (
    SELECT SUM(count) as total_count
    FROM gender_counts
  )
  SELECT 
    gc.gender,
    gc.count,
    ROUND((gc.count::numeric / t.total_count * 100), 1) as percentage
  FROM gender_counts gc
  CROSS JOIN total t
  ORDER BY gc.gender;
$$;

-- Test the new function
SELECT * FROM get_gender_distribution();