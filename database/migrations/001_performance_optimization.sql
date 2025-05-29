-- Migration: Performance Optimization for Scout Dashboard
-- Version: 001
-- Date: 2024-01-29
-- Description: Implements partitioning, BRIN indexes, and performance optimizations

BEGIN;

-- 1. Create partitioned table structure
CREATE TABLE IF NOT EXISTS transactions_partitioned (
    LIKE transactions INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- 2. Create monthly partitions for 2024
DO $$
DECLARE
    start_date date := '2024-01-01';
    end_date date;
    partition_name text;
BEGIN
    FOR i IN 0..11 LOOP
        end_date := start_date + INTERVAL '1 month';
        partition_name := 'transactions_' || to_char(start_date, 'YYYY_MM');
        
        -- Check if partition exists
        IF NOT EXISTS (
            SELECT 1 FROM pg_class 
            WHERE relname = partition_name
        ) THEN
            EXECUTE format(
                'CREATE TABLE %I PARTITION OF transactions_partitioned 
                FOR VALUES FROM (%L) TO (%L)',
                partition_name,
                start_date,
                end_date
            );
            RAISE NOTICE 'Created partition: %', partition_name;
        END IF;
        
        start_date := end_date;
    END LOOP;
END$$;

-- 3. Create BRIN indexes for time-series optimization
CREATE INDEX IF NOT EXISTS idx_transactions_created_brin 
    ON transactions_partitioned USING BRIN (created_at) 
    WITH (pages_per_range = 128);

CREATE INDEX IF NOT EXISTS idx_transaction_items_created_brin 
    ON transaction_items USING BRIN (created_at) 
    WITH (pages_per_range = 128);

-- 4. Dashboard-specific compound indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_kpis 
    ON transactions_partitioned (store_id, created_at DESC) 
    INCLUDE (total_amount, customer_id)
    WHERE created_at > CURRENT_DATE - INTERVAL '90 days';

CREATE INDEX IF NOT EXISTS idx_brand_performance 
    ON transaction_items (product_id, created_at DESC) 
    INCLUDE (quantity, subtotal);

-- 5. Customer analytics indexes
CREATE INDEX IF NOT EXISTS idx_customer_analytics 
    ON transactions_partitioned (customer_id, created_at DESC) 
    INCLUDE (total_amount, customer_age, customer_gender)
    WHERE customer_id IS NOT NULL;

-- 6. Store performance index
CREATE INDEX IF NOT EXISTS idx_store_performance 
    ON transactions_partitioned (store_id, created_at) 
    INCLUDE (total_amount, payment_method);

-- 7. Create streaming watermarks table
CREATE TABLE IF NOT EXISTS streaming_watermarks (
    table_name TEXT PRIMARY KEY,
    last_processed_timestamp TIMESTAMPTZ NOT NULL,
    last_processed_id BIGINT,
    processing_lag_seconds INTEGER,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Add batch processing columns
ALTER TABLE transactions 
    ADD COLUMN IF NOT EXISTS batch_id UUID,
    ADD COLUMN IF NOT EXISTS is_processed BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

-- 9. Create processing queue index
CREATE INDEX IF NOT EXISTS idx_processing_queue 
    ON transactions (is_processed, batch_id) 
    WHERE NOT is_processed;

-- 10. Create data quality metrics table
CREATE TABLE IF NOT EXISTS data_quality_metrics (
    id BIGSERIAL PRIMARY KEY,
    metric_date DATE NOT NULL,
    table_name TEXT NOT NULL,
    total_records BIGINT,
    null_count JSONB,
    outlier_count JSONB,
    constraint_violations JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(metric_date, table_name)
);

-- 11. Create query performance log
CREATE TABLE IF NOT EXISTS query_performance_log (
    id BIGSERIAL PRIMARY KEY,
    query_fingerprint TEXT,
    execution_time_ms NUMERIC,
    rows_returned BIGINT,
    query_plan JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_query_performance_time 
    ON query_performance_log (created_at DESC);

-- 12. Update statistics for query planner
ANALYZE transactions;
ANALYZE transaction_items;
ANALYZE products;
ANALYZE brands;

-- 13. Create helper function for partition maintenance
CREATE OR REPLACE FUNCTION create_monthly_partition(
    table_name text,
    start_date date
) RETURNS void AS $$
DECLARE
    partition_name text;
    end_date date;
BEGIN
    partition_name := table_name || '_' || to_char(start_date, 'YYYY_MM');
    end_date := start_date + INTERVAL '1 month';
    
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF %I 
        FOR VALUES FROM (%L) TO (%L)',
        partition_name,
        table_name || '_partitioned',
        start_date,
        end_date
    );
END;
$$ LANGUAGE plpgsql;

-- 14. Create function to migrate data in batches
CREATE OR REPLACE FUNCTION migrate_to_partitioned_table(
    batch_size integer DEFAULT 10000
) RETURNS void AS $$
DECLARE
    rows_migrated integer := 0;
    total_rows integer;
BEGIN
    SELECT COUNT(*) INTO total_rows FROM transactions;
    
    WHILE rows_migrated < total_rows LOOP
        INSERT INTO transactions_partitioned
        SELECT * FROM transactions
        ORDER BY created_at
        LIMIT batch_size
        OFFSET rows_migrated
        ON CONFLICT DO NOTHING;
        
        rows_migrated := rows_migrated + batch_size;
        RAISE NOTICE 'Migrated % of % rows', rows_migrated, total_rows;
        
        -- Avoid long-running transaction
        PERFORM pg_sleep(0.1);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 15. Grant appropriate permissions
GRANT SELECT ON streaming_watermarks TO authenticated;
GRANT SELECT ON data_quality_metrics TO authenticated;
GRANT SELECT ON query_performance_log TO service_role;

COMMIT;

-- Post-migration steps (run separately):
-- 1. Run data migration: SELECT migrate_to_partitioned_table();
-- 2. Verify data: SELECT COUNT(*) FROM transactions_partitioned;
-- 3. Update application to use transactions_partitioned
-- 4. Drop old table: DROP TABLE transactions;