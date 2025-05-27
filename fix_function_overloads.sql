-- Fix Consumer Insights Function Overloads
-- This script removes duplicate function signatures to resolve ambiguity

-- 1. Drop the versions that take plain TIMESTAMP (without time zone)
DROP FUNCTION IF EXISTS public.get_age_distribution(
  start_date TIMESTAMP,
  end_date   TIMESTAMP,
  bucket_size INT
);

DROP FUNCTION IF EXISTS public.get_gender_distribution(
  start_date TIMESTAMP,
  end_date   TIMESTAMP
);

-- 2. Also drop any TEXT parameter versions
DROP FUNCTION IF EXISTS public.get_age_distribution(TEXT, TEXT, INT);
DROP FUNCTION IF EXISTS public.get_age_distribution(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_gender_distribution(TEXT, TEXT);

-- 3. Verify only the TIMESTAMPTZ versions remain
SELECT 
    routine_name,
    string_agg(
        parameter_name || ' ' || data_type,
        ', ' ORDER BY ordinal_position
    ) as parameters
FROM information_schema.parameters 
WHERE specific_schema = 'public' 
AND specific_name IN (
    SELECT specific_name 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name IN ('get_age_distribution', 'get_gender_distribution')
)
GROUP BY routine_name, specific_name
ORDER BY routine_name;

-- 4. Test the remaining functions
SELECT 'Testing Age Distribution Function (should work now):' as test_name;
SELECT * FROM public.get_age_distribution(
    '2025-01-01'::TIMESTAMPTZ, 
    '2025-12-31'::TIMESTAMPTZ, 
    10
) LIMIT 3;

SELECT 'Testing Gender Distribution Function (should work now):' as test_name;
SELECT * FROM public.get_gender_distribution(
    '2025-01-01'::TIMESTAMPTZ, 
    '2025-12-31'::TIMESTAMPTZ
) LIMIT 3;
