-- List all user-defined functions in the public schema
-- Run this in the Supabase SQL editor to see all your RPC functions

SELECT
  p.proname AS function_name,
  pg_catalog.pg_get_function_arguments(p.oid) AS arguments,
  t.typname AS return_type,
  CASE 
    WHEN p.prosrc LIKE '%json%' THEN 'JSON'
    WHEN p.prosrc LIKE '%TABLE%' THEN 'TABLE'
    ELSE 'OTHER'
  END AS output_type,
  LENGTH(p.prosrc) AS source_length,
  obj_description(p.oid, 'pg_proc') AS description
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
JOIN pg_catalog.pg_type t ON t.oid = p.prorettype
WHERE n.nspname = 'public'
  AND p.prokind = 'f'   -- only normal functions (not aggregates/triggers)
ORDER BY p.proname;

-- Alternative query to see functions with their full source
/*
SELECT
  p.proname AS function_name,
  pg_catalog.pg_get_function_arguments(p.oid) AS arguments,
  t.typname AS return_type,
  p.prosrc AS source
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
JOIN pg_catalog.pg_type t ON t.oid = p.prorettype
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
ORDER BY p.proname;
*/