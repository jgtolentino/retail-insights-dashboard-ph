-- Create execute_sql RPC function for Databricks AI Genie
-- This allows the AI Genie to execute generated SQL queries safely

CREATE OR REPLACE FUNCTION execute_sql(sql_query text)
RETURNS TABLE(result json)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rec record;
    results json[] := '{}';
BEGIN
    -- Security check: only allow SELECT statements
    IF lower(trim(sql_query)) NOT LIKE 'select%' THEN
        RAISE EXCEPTION 'Only SELECT statements are allowed';
    END IF;
    
    -- Additional security: prevent certain operations
    IF sql_query ~* '\b(drop|delete|update|insert|create|alter|truncate)\b' THEN
        RAISE EXCEPTION 'DDL and DML operations are not allowed';
    END IF;
    
    -- Execute the query and return results as JSON
    FOR rec IN EXECUTE sql_query LOOP
        results := array_append(results, row_to_json(rec));
    END LOOP;
    
    -- Return results
    RETURN QUERY SELECT json_agg(r) as result FROM unnest(results) r;
    
EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'Query execution failed: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION execute_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION execute_sql(text) TO anon;

-- Create a simpler version that returns JSONB array directly
CREATE OR REPLACE FUNCTION execute_sql_simple(sql_query text)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_json JSONB;
BEGIN
    -- Security check: only allow SELECT statements
    IF lower(trim(sql_query)) NOT LIKE 'select%' THEN
        RAISE EXCEPTION 'Only SELECT statements are allowed';
    END IF;
    
    -- Additional security: prevent certain operations
    IF sql_query ~* '\b(drop|delete|update|insert|create|alter|truncate)\b' THEN
        RAISE EXCEPTION 'DDL and DML operations are not allowed';
    END IF;
    
    -- Execute the query and return results as JSONB array
    EXECUTE format('SELECT COALESCE(json_agg(t), ''[]''::json) FROM (%s) t', sql_query) INTO result_json;
    
    RETURN result_json;
    
EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'Query execution failed: %', SQLERRM;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION execute_sql_simple(text) TO authenticated;
GRANT EXECUTE ON FUNCTION execute_sql_simple(text) TO anon;