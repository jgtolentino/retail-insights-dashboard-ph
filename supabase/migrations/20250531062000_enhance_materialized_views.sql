-- ===================================================================
-- Enhanced Materialized View Management
-- ===================================================================

-- Create refresh log tables
CREATE TABLE IF NOT EXISTS refresh_log (
  id SERIAL PRIMARY KEY,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'running',
  error_message TEXT,
  error_detail TEXT
);

CREATE TABLE IF NOT EXISTS refresh_log_details (
  id SERIAL PRIMARY KEY,
  refresh_log_id INTEGER REFERENCES refresh_log(id),
  view_name TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  rows_affected INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_errors (
  id SERIAL PRIMARY KEY,
  error_message TEXT NOT NULL,
  error_detail TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced refresh function with error handling and logging
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
DECLARE
  v_start_time timestamp;
  v_view_name text;
  v_refresh_log_id integer;
  v_rows_affected integer;
BEGIN
  -- Start refresh log
  INSERT INTO refresh_log (started_at, status)
  VALUES (NOW(), 'running')
  RETURNING id INTO v_refresh_log_id;
  
  -- Refresh each view with timing and error handling
  FOR v_view_name IN 
    SELECT matviewname 
    FROM pg_matviews 
    WHERE schemaname = 'public'
    ORDER BY matviewname
  LOOP
    BEGIN
      v_start_time := clock_timestamp();
      
      -- Get row count before refresh
      EXECUTE format('SELECT COUNT(*) FROM %I', v_view_name) INTO v_rows_affected;
      
      -- Refresh the view
      EXECUTE format('REFRESH MATERIALIZED VIEW CONCURRENTLY %I', v_view_name);
      
      -- Log successful refresh
      INSERT INTO refresh_log_details (
        refresh_log_id,
        view_name,
        duration_ms,
        rows_affected
      )
      VALUES (
        v_refresh_log_id,
        v_view_name,
        EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time)) * 1000,
        v_rows_affected
      );
      
    EXCEPTION WHEN OTHERS THEN
      -- Log error
      INSERT INTO refresh_errors (error_message, error_detail)
      VALUES (
        format('Error refreshing %I: %s', v_view_name, SQLERRM),
        SQLSTATE
      );
      
      -- Update refresh log with error
      UPDATE refresh_log 
      SET 
        status = 'error',
        error_message = SQLERRM,
        error_detail = SQLSTATE
      WHERE id = v_refresh_log_id;
      
      RAISE;
    END;
  END LOOP;
  
  -- Update completion
  UPDATE refresh_log 
  SET 
    completed_at = NOW(),
    status = 'completed'
  WHERE id = v_refresh_log_id;
  
EXCEPTION WHEN OTHERS THEN
  -- Log error
  INSERT INTO refresh_errors (error_message, error_detail)
  VALUES (SQLERRM, SQLSTATE);
  
  -- Update refresh log with error
  UPDATE refresh_log 
  SET 
    completed_at = NOW(),
    status = 'error',
    error_message = SQLERRM,
    error_detail = SQLSTATE
  WHERE id = v_refresh_log_id;
  
  RAISE;
END;
$$ LANGUAGE plpgsql;

-- Create function to get refresh status
CREATE OR REPLACE FUNCTION get_refresh_status()
RETURNS TABLE (
  view_name text,
  last_refresh timestamp with time zone,
  duration_ms integer,
  rows_affected integer,
  status text
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_refresh AS (
    SELECT DISTINCT ON (view_name)
      view_name,
      rl.started_at as last_refresh,
      rld.duration_ms,
      rld.rows_affected,
      rl.status
    FROM refresh_log_details rld
    JOIN refresh_log rl ON rld.refresh_log_id = rl.id
    ORDER BY view_name, rl.started_at DESC
  )
  SELECT * FROM latest_refresh
  ORDER BY last_refresh DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to monitor refresh performance
CREATE OR REPLACE FUNCTION get_refresh_performance()
RETURNS TABLE (
  view_name text,
  avg_duration_ms numeric,
  max_duration_ms integer,
  avg_rows_affected numeric,
  refresh_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    view_name,
    AVG(duration_ms)::numeric as avg_duration_ms,
    MAX(duration_ms)::integer as max_duration_ms,
    AVG(rows_affected)::numeric as avg_rows_affected,
    COUNT(*)::bigint as refresh_count
  FROM refresh_log_details
  WHERE created_at > NOW() - INTERVAL '7 days'
  GROUP BY view_name
  ORDER BY avg_duration_ms DESC;
END;
$$ LANGUAGE plpgsql;

-- Update cron schedule to use enhanced refresh
SELECT cron.schedule(
  'refresh-materialized-views',
  '0 0 * * *',  -- every day at midnight
  $$SELECT refresh_materialized_views()$$
); 