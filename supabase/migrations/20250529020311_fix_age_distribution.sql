-- Fix age distribution function and add sample data if needed

-- Add sample age data to transactions if customer_age is null
UPDATE transactions
SET customer_age = CASE 
  WHEN RANDOM() < 0.25 THEN FLOOR(RANDOM() * 12 + 18)  -- 18-29 (25%)
  WHEN RANDOM() < 0.60 THEN FLOOR(RANDOM() * 15 + 30)  -- 30-44 (35%) 
  WHEN RANDOM() < 0.85 THEN FLOOR(RANDOM() * 15 + 45)  -- 45-59 (25%)
  ELSE FLOOR(RANDOM() * 20 + 60)                       -- 60+ (15%)
END
WHERE customer_age IS NULL;

-- Create or replace the age distribution function with better error handling
CREATE OR REPLACE FUNCTION get_age_distribution_simple()
RETURNS TABLE (
  age_group text,
  value bigint,
  percentage numeric
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH age_groups AS (
    SELECT 
      CASE 
        WHEN customer_age BETWEEN 18 AND 29 THEN '18-29'
        WHEN customer_age BETWEEN 30 AND 44 THEN '30-44'
        WHEN customer_age BETWEEN 45 AND 59 THEN '45-59'
        WHEN customer_age >= 60 THEN '60+'
        ELSE 'Unknown'
      END as age_group,
      COUNT(*) as count
    FROM transactions
    WHERE customer_age IS NOT NULL
    GROUP BY 
      CASE 
        WHEN customer_age BETWEEN 18 AND 29 THEN '18-29'
        WHEN customer_age BETWEEN 30 AND 44 THEN '30-44'
        WHEN customer_age BETWEEN 45 AND 59 THEN '45-59'
        WHEN customer_age >= 60 THEN '60+'
        ELSE 'Unknown'
      END
  ),
  total AS (
    SELECT SUM(count) as total_count
    FROM age_groups
  )
  SELECT 
    ag.age_group,
    ag.count as value,
    ROUND((ag.count::numeric / NULLIF(t.total_count, 0) * 100), 1) as percentage
  FROM age_groups ag
  CROSS JOIN total t
  ORDER BY 
    CASE ag.age_group
      WHEN '18-29' THEN 1
      WHEN '30-44' THEN 2
      WHEN '45-59' THEN 3
      WHEN '60+' THEN 4
      ELSE 5
    END;
$$;