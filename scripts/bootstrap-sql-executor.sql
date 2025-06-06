-- Bootstrap SQL Executor for Automated Script Running
-- Run this ONCE in Supabase SQL Editor to enable automated SQL execution

-- Create the exec_sql function that allows automated script execution
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS JSON AS $$
BEGIN
  -- Execute the provided SQL query
  EXECUTE sql_query;
  
  -- Return success response
  RETURN json_build_object(
    'success', true, 
    'message', 'Query executed successfully',
    'timestamp', NOW()
  );
EXCEPTION WHEN OTHERS THEN
  -- Return error details if something goes wrong
  RETURN json_build_object(
    'success', false, 
    'error', SQLERRM,
    'error_code', SQLSTATE,
    'timestamp', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO authenticated;

-- Create a migration tracking table to prevent duplicate executions
CREATE TABLE IF NOT EXISTS sql_migrations (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) UNIQUE NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  checksum VARCHAR(64),
  success BOOLEAN DEFAULT true,
  error_message TEXT
);

-- Grant permissions on migrations table
GRANT ALL ON TABLE sql_migrations TO anon;
GRANT ALL ON TABLE sql_migrations TO authenticated;
GRANT USAGE ON SEQUENCE sql_migrations_id_seq TO anon;
GRANT USAGE ON SEQUENCE sql_migrations_id_seq TO authenticated;

-- Create function to check if migration was already executed
CREATE OR REPLACE FUNCTION migration_executed(migration_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM sql_migrations 
    WHERE filename = migration_name AND success = true
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION migration_executed(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION migration_executed(TEXT) TO authenticated;

-- Create function to record migration execution
CREATE OR REPLACE FUNCTION record_migration(
  migration_name TEXT,
  migration_checksum TEXT DEFAULT NULL,
  migration_success BOOLEAN DEFAULT true,
  migration_error TEXT DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
  INSERT INTO sql_migrations (filename, checksum, success, error_message)
  VALUES (migration_name, migration_checksum, migration_success, migration_error)
  ON CONFLICT (filename) DO UPDATE SET
    executed_at = NOW(),
    checksum = EXCLUDED.checksum,
    success = EXCLUDED.success,
    error_message = EXCLUDED.error_message;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Migration recorded successfully'
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION record_migration(TEXT, TEXT, BOOLEAN, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION record_migration(TEXT, TEXT, BOOLEAN, TEXT) TO authenticated;

-- Create function to get migration status
CREATE OR REPLACE FUNCTION get_migration_status()
RETURNS TABLE (
  filename VARCHAR(255),
  executed_at TIMESTAMP WITH TIME ZONE,
  success BOOLEAN,
  error_message TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.filename,
    m.executed_at,
    m.success,
    m.error_message
  FROM sql_migrations m
  ORDER BY m.executed_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_migration_status() TO anon;
GRANT EXECUTE ON FUNCTION get_migration_status() TO authenticated;

-- Success message
SELECT json_build_object(
  'status', 'success',
  'message', 'SQL Executor bootstrap completed successfully!',
  'functions_created', ARRAY[
    'exec_sql(TEXT)',
    'migration_executed(TEXT)', 
    'record_migration(TEXT, TEXT, BOOLEAN, TEXT)',
    'get_migration_status()'
  ],
  'table_created', 'sql_migrations',
  'next_step', 'You can now use automated SQL execution with: npm run sql <filename>'
) as bootstrap_result;