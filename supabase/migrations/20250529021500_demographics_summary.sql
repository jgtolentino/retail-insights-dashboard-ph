-- Create demographics summary functions following the user's specification
-- This will provide age group and gender percentages for the dashboard

-- 1.1: Create an RPC to compute age-group % breakdown
CREATE OR REPLACE FUNCTION get_demographics_summary(
  p_start_date DATE,
  p_end_date   DATE
)
RETURNS TABLE(
  age_bracket TEXT,
  pct         NUMERIC
) LANGUAGE sql AS $$
  SELECT
    CASE
      WHEN customer_age BETWEEN 18 AND 29 THEN '18-29'
      WHEN customer_age BETWEEN 30 AND 44 THEN '30-44'
      WHEN customer_age BETWEEN 45 AND 59 THEN '45-59'
      ELSE '60+'
    END AS age_bracket,
    ROUND(
      100.0 * COUNT(*)::NUMERIC
      / NULLIF(SUM(COUNT(*)) OVER (), 0)
    , 0) AS pct
  FROM transactions
  WHERE created_at::date BETWEEN p_start_date AND p_end_date
    AND customer_age IS NOT NULL
  GROUP BY age_bracket
  ORDER BY age_bracket;
$$;

-- 1.2: A second RPC for gender split
CREATE OR REPLACE FUNCTION get_gender_summary(
  p_start_date DATE,
  p_end_date   DATE
)
RETURNS TABLE(
  gender TEXT,
  pct    NUMERIC
) LANGUAGE sql AS $$
  SELECT
    CASE 
      WHEN LOWER(customer_gender) = 'male' THEN 'Male'
      WHEN LOWER(customer_gender) = 'female' THEN 'Female'
      ELSE 'Other'
    END AS gender,
    ROUND(
      100.0 * COUNT(*)::NUMERIC
      / NULLIF(SUM(COUNT(*)) OVER (), 0)
    , 0) AS pct
  FROM transactions
  WHERE created_at::date BETWEEN p_start_date AND p_end_date
    AND customer_gender IS NOT NULL
  GROUP BY gender
  ORDER BY gender;
$$;