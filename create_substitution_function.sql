-- SQL function to get top product substitutions
-- This is for future use when you track actual substitutions in your database

-- First, create a substitutions table to track when products are substituted
CREATE TABLE IF NOT EXISTS public.substitutions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES transactions(id),
  original_product_id UUID REFERENCES products(id),
  substitute_product_id UUID REFERENCES products(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the function to get top substitutions
CREATE OR REPLACE FUNCTION public.get_top_substitutions(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  limit_n INT DEFAULT 10
)
RETURNS TABLE(
  original_product TEXT,
  substitute_product TEXT,
  count BIGINT,
  reasons TEXT
) 
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p_orig.name AS original_product,
    p_sub.name AS substitute_product,
    COUNT(*)::BIGINT AS count,
    STRING_AGG(DISTINCT s.reason, ', ') AS reasons
  FROM substitutions s
  JOIN products p_orig ON p_orig.id = s.original_product_id
  JOIN products p_sub ON p_sub.id = s.substitute_product_id
  JOIN transactions t ON t.id = s.transaction_id
  WHERE t.created_at BETWEEN start_date AND end_date
  GROUP BY p_orig.name, p_sub.name
  ORDER BY count DESC
  LIMIT limit_n;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_top_substitutions TO anon, authenticated;

-- Create RLS policy for substitutions table
ALTER TABLE public.substitutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read substitutions"
  ON public.substitutions
  FOR SELECT
  USING (true);

-- Sample data insertion (remove this in production)
-- This shows how substitutions would be tracked
/*
INSERT INTO substitutions (transaction_id, original_product_id, substitute_product_id, reason)
SELECT 
  t.id,
  p1.id,
  p2.id,
  CASE 
    WHEN RANDOM() < 0.3 THEN 'Out of stock'
    WHEN RANDOM() < 0.6 THEN 'Price preference'
    WHEN RANDOM() < 0.8 THEN 'Customer request'
    ELSE 'Brand loyalty'
  END
FROM transactions t
CROSS JOIN LATERAL (
  SELECT id FROM products ORDER BY RANDOM() LIMIT 1
) p1
CROSS JOIN LATERAL (
  SELECT id FROM products WHERE id != p1.id ORDER BY RANDOM() LIMIT 1
) p2
WHERE RANDOM() < 0.1 -- Only 10% of transactions have substitutions
LIMIT 100;
*/