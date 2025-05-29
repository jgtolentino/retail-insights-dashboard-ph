-- Migration: Materialized Views for Dashboard Performance
-- Version: 002
-- Date: 2024-01-29
-- Description: Creates materialized views for real-time dashboard analytics

BEGIN;

-- 1. Dashboard KPIs Materialized View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_dashboard_kpis AS
WITH hourly_stats AS (
    SELECT 
        date_trunc('hour', created_at) as hour,
        store_id,
        COUNT(*) as transaction_count,
        SUM(total_amount) as revenue,
        COUNT(DISTINCT customer_id) as unique_customers,
        AVG(total_amount) as avg_transaction,
        COUNT(DISTINCT DATE(created_at)) as active_days
    FROM transactions
    WHERE created_at > CURRENT_DATE - INTERVAL '30 days'
    GROUP BY 1, 2
),
daily_stats AS (
    SELECT 
        date_trunc('day', created_at) as day,
        store_id,
        COUNT(*) as daily_transactions,
        SUM(total_amount) as daily_revenue
    FROM transactions
    WHERE created_at > CURRENT_DATE - INTERVAL '30 days'
    GROUP BY 1, 2
)
SELECT 
    h.hour,
    h.store_id,
    h.transaction_count,
    h.revenue,
    h.unique_customers,
    h.avg_transaction,
    h.revenue / NULLIF(h.transaction_count, 0) as revenue_per_transaction,
    d.daily_transactions,
    d.daily_revenue,
    -- Growth metrics
    LAG(h.revenue, 24) OVER (PARTITION BY h.store_id ORDER BY h.hour) as revenue_24h_ago,
    LAG(h.revenue, 168) OVER (PARTITION BY h.store_id ORDER BY h.hour) as revenue_7d_ago
FROM hourly_stats h
LEFT JOIN daily_stats d ON DATE(h.hour) = d.day AND h.store_id = d.store_id;

CREATE UNIQUE INDEX idx_mv_dashboard_kpis ON mv_dashboard_kpis (hour, store_id);
CREATE INDEX idx_mv_dashboard_kpis_store ON mv_dashboard_kpis (store_id, hour DESC);

-- 2. Brand Performance Materialized View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_brand_performance AS
WITH brand_metrics AS (
    SELECT 
        b.id as brand_id,
        b.name as brand_name,
        b.category as brand_category,
        DATE(t.created_at) as date,
        COUNT(DISTINCT t.id) as transaction_count,
        COUNT(DISTINCT t.customer_id) as unique_customers,
        SUM(ti.quantity) as units_sold,
        SUM(ti.subtotal) as revenue,
        AVG(ti.unit_price) as avg_price,
        COUNT(DISTINCT p.id) as product_variety
    FROM brands b
    JOIN products p ON p.brand_id = b.id
    JOIN transaction_items ti ON ti.product_id = p.id
    JOIN transactions t ON t.id = ti.transaction_id
    WHERE t.created_at > CURRENT_DATE - INTERVAL '90 days'
    GROUP BY 1, 2, 3, 4
),
brand_rank AS (
    SELECT 
        *,
        RANK() OVER (PARTITION BY date ORDER BY revenue DESC) as daily_rank,
        SUM(revenue) OVER (PARTITION BY brand_id ORDER BY date) as cumulative_revenue
    FROM brand_metrics
)
SELECT 
    *,
    CASE 
        WHEN daily_rank <= 5 THEN 'Top 5'
        WHEN daily_rank <= 10 THEN 'Top 10'
        ELSE 'Other'
    END as performance_tier
FROM brand_rank;

CREATE UNIQUE INDEX idx_mv_brand_performance ON mv_brand_performance (brand_id, date);
CREATE INDEX idx_mv_brand_performance_date ON mv_brand_performance (date, revenue DESC);
CREATE INDEX idx_mv_brand_performance_category ON mv_brand_performance (brand_category, date);

-- 3. Customer Segments Materialized View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_customer_segments AS
WITH customer_metrics AS (
    SELECT 
        customer_id,
        customer_age,
        customer_gender,
        customer_location,
        COUNT(*) as transaction_count,
        SUM(total_amount) as total_spent,
        AVG(total_amount) as avg_transaction_value,
        MIN(created_at) as first_purchase,
        MAX(created_at) as last_purchase,
        COUNT(DISTINCT DATE(created_at)) as active_days,
        COUNT(DISTINCT EXTRACT(MONTH FROM created_at)) as active_months
    FROM transactions
    WHERE customer_id IS NOT NULL
    GROUP BY 1, 2, 3, 4
),
customer_rfm AS (
    SELECT 
        *,
        -- Recency score (days since last purchase)
        EXTRACT(DAY FROM NOW() - last_purchase) as recency_days,
        -- Frequency score
        CASE 
            WHEN transaction_count >= 20 THEN 5
            WHEN transaction_count >= 15 THEN 4
            WHEN transaction_count >= 10 THEN 3
            WHEN transaction_count >= 5 THEN 2
            ELSE 1
        END as frequency_score,
        -- Monetary score
        CASE 
            WHEN total_spent >= 10000 THEN 5
            WHEN total_spent >= 5000 THEN 4
            WHEN total_spent >= 2500 THEN 3
            WHEN total_spent >= 1000 THEN 2
            ELSE 1
        END as monetary_score,
        -- Age group
        CASE 
            WHEN customer_age BETWEEN 18 AND 29 THEN '18-29'
            WHEN customer_age BETWEEN 30 AND 44 THEN '30-44'
            WHEN customer_age BETWEEN 45 AND 59 THEN '45-59'
            WHEN customer_age >= 60 THEN '60+'
            ELSE 'Unknown'
        END as age_group
    FROM customer_metrics
)
SELECT 
    *,
    -- RFM segment
    CASE 
        WHEN recency_days <= 7 AND frequency_score >= 4 AND monetary_score >= 4 THEN 'Champions'
        WHEN recency_days <= 14 AND frequency_score >= 3 AND monetary_score >= 3 THEN 'Loyal Customers'
        WHEN recency_days <= 30 AND monetary_score >= 4 THEN 'Big Spenders'
        WHEN recency_days <= 30 AND frequency_score >= 3 THEN 'Frequent Buyers'
        WHEN recency_days > 60 AND frequency_score >= 3 THEN 'At Risk'
        WHEN recency_days > 90 THEN 'Lost'
        ELSE 'Regular'
    END as customer_segment,
    -- Lifetime value prediction (simple model)
    (total_spent / NULLIF(EXTRACT(DAY FROM NOW() - first_purchase), 0)) * 365 as predicted_annual_value
FROM customer_rfm;

CREATE UNIQUE INDEX idx_mv_customer_segments ON mv_customer_segments (customer_id);
CREATE INDEX idx_mv_customer_segments_segment ON mv_customer_segments (customer_segment);
CREATE INDEX idx_mv_customer_segments_value ON mv_customer_segments (total_spent DESC);

-- 4. Product Substitution Patterns View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_product_substitutions AS
WITH product_pairs AS (
    SELECT 
        ti1.product_id as product_1,
        ti2.product_id as product_2,
        COUNT(*) as co_occurrence_count,
        COUNT(DISTINCT ti1.transaction_id) as transaction_count
    FROM transaction_items ti1
    JOIN transaction_items ti2 ON ti1.transaction_id = ti2.transaction_id
    WHERE ti1.product_id < ti2.product_id -- Avoid duplicates
    GROUP BY 1, 2
    HAVING COUNT(*) >= 5 -- Minimum support
),
product_info AS (
    SELECT 
        pp.*,
        p1.name as product_1_name,
        p1.category as product_1_category,
        p2.name as product_2_name,
        p2.category as product_2_category,
        b1.name as brand_1_name,
        b2.name as brand_2_name
    FROM product_pairs pp
    JOIN products p1 ON pp.product_1 = p1.id
    JOIN products p2 ON pp.product_2 = p2.id
    JOIN brands b1 ON p1.brand_id = b1.id
    JOIN brands b2 ON p2.brand_id = b2.id
)
SELECT 
    *,
    -- Confidence score
    ROUND(100.0 * co_occurrence_count / NULLIF(transaction_count, 0), 2) as confidence_percentage,
    -- Same category substitution
    CASE 
        WHEN product_1_category = product_2_category THEN TRUE
        ELSE FALSE
    END as same_category,
    -- Cross-brand substitution
    CASE 
        WHEN brand_1_name != brand_2_name THEN TRUE
        ELSE FALSE
    END as cross_brand
FROM product_info
ORDER BY co_occurrence_count DESC;

CREATE INDEX idx_mv_product_substitutions_p1 ON mv_product_substitutions (product_1);
CREATE INDEX idx_mv_product_substitutions_p2 ON mv_product_substitutions (product_2);
CREATE INDEX idx_mv_product_substitutions_conf ON mv_product_substitutions (confidence_percentage DESC);

-- 5. Time Series Metrics View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_time_series_metrics AS
WITH time_slots AS (
    SELECT 
        date_trunc('hour', created_at) as hour,
        EXTRACT(HOUR FROM created_at) as hour_of_day,
        EXTRACT(DOW FROM created_at) as day_of_week,
        CASE 
            WHEN EXTRACT(DOW FROM created_at) IN (0, 6) THEN 'Weekend'
            ELSE 'Weekday'
        END as day_type,
        COUNT(*) as transaction_count,
        SUM(total_amount) as revenue,
        AVG(total_amount) as avg_transaction,
        COUNT(DISTINCT customer_id) as unique_customers
    FROM transactions
    WHERE created_at > CURRENT_DATE - INTERVAL '30 days'
    GROUP BY 1, 2, 3
),
hourly_patterns AS (
    SELECT 
        hour_of_day,
        day_type,
        AVG(transaction_count) as avg_transactions,
        AVG(revenue) as avg_revenue,
        STDDEV(transaction_count) as transaction_stddev,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY transaction_count) as median_transactions
    FROM time_slots
    GROUP BY 1, 2
)
SELECT 
    ts.*,
    hp.avg_transactions as typical_transactions,
    hp.avg_revenue as typical_revenue,
    -- Anomaly detection
    CASE 
        WHEN ts.transaction_count > hp.avg_transactions + (2 * hp.transaction_stddev) THEN 'High'
        WHEN ts.transaction_count < hp.avg_transactions - (2 * hp.transaction_stddev) THEN 'Low'
        ELSE 'Normal'
    END as traffic_anomaly
FROM time_slots ts
JOIN hourly_patterns hp ON ts.hour_of_day = hp.hour_of_day AND ts.day_type = hp.day_type;

CREATE INDEX idx_mv_time_series_hour ON mv_time_series_metrics (hour DESC);
CREATE INDEX idx_mv_time_series_patterns ON mv_time_series_metrics (hour_of_day, day_type);

-- 6. Create refresh function
CREATE OR REPLACE FUNCTION refresh_dashboard_views() 
RETURNS void AS $$
BEGIN
    -- Refresh in dependency order
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_kpis;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_brand_performance;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_customer_segments;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_substitutions;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_time_series_metrics;
    
    -- Log refresh
    INSERT INTO data_quality_metrics (metric_date, table_name, total_records)
    VALUES 
        (CURRENT_DATE, 'mv_dashboard_kpis', (SELECT COUNT(*) FROM mv_dashboard_kpis)),
        (CURRENT_DATE, 'mv_brand_performance', (SELECT COUNT(*) FROM mv_brand_performance)),
        (CURRENT_DATE, 'mv_customer_segments', (SELECT COUNT(*) FROM mv_customer_segments))
    ON CONFLICT (metric_date, table_name) DO UPDATE
    SET total_records = EXCLUDED.total_records;
END;
$$ LANGUAGE plpgsql;

-- 7. Grant permissions
GRANT SELECT ON mv_dashboard_kpis TO authenticated;
GRANT SELECT ON mv_brand_performance TO authenticated;
GRANT SELECT ON mv_customer_segments TO authenticated;
GRANT SELECT ON mv_product_substitutions TO authenticated;
GRANT SELECT ON mv_time_series_metrics TO authenticated;

COMMIT;

-- Schedule automatic refresh (requires pg_cron extension)
-- SELECT cron.schedule('refresh-dashboard-views', '*/5 * * * *', 'SELECT refresh_dashboard_views()');

-- Manual refresh command
-- SELECT refresh_dashboard_views();