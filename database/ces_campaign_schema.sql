-- CES Campaign Analytics Schema for Azure PostgreSQL
-- Multi-tenant campaign performance data with Row Level Security

-- =====================================
-- Bronze Layer: Raw Campaign Events
-- =====================================

CREATE TABLE IF NOT EXISTS campaign_events (
    id                  SERIAL PRIMARY KEY,
    tenant_id           INTEGER NOT NULL,
    campaign_id         VARCHAR(255) NOT NULL,
    event_time          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    event_type          VARCHAR(50),          -- 'impression', 'click', 'conversion', etc.
    channel             VARCHAR(50),          -- 'facebook', 'tiktok', 'x', 'google', etc.
    creative_id         VARCHAR(255),
    spend               DECIMAL(10,2) DEFAULT 0,
    impressions         BIGINT DEFAULT 0,
    clicks              BIGINT DEFAULT 0,
    conversions         BIGINT DEFAULT 0,
    raw_payload         JSONB,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaign_events_tenant_id ON campaign_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaign_events_campaign_id ON campaign_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_events_channel ON campaign_events(channel);
CREATE INDEX IF NOT EXISTS idx_campaign_events_event_time ON campaign_events(event_time);
CREATE INDEX IF NOT EXISTS idx_campaign_events_event_type ON campaign_events(event_type);

-- =====================================
-- Silver Layer: Daily Campaign Metrics
-- =====================================

CREATE TABLE IF NOT EXISTS campaign_metrics_daily (
    id                  SERIAL PRIMARY KEY,
    tenant_id           INTEGER NOT NULL,
    campaign_id         VARCHAR(255) NOT NULL,
    event_date          DATE NOT NULL,
    channel             VARCHAR(50) NOT NULL,
    spend               DECIMAL(10,2) DEFAULT 0,
    impressions         BIGINT DEFAULT 0,
    clicks              BIGINT DEFAULT 0,
    conversions         BIGINT DEFAULT 0,
    ces_score           DECIMAL(10,2) DEFAULT 0,      -- (conversions / impressions) * 1000
    ctr                 DECIMAL(5,4) DEFAULT 0,       -- Click-through rate
    cpc                 DECIMAL(10,2) DEFAULT 0,      -- Cost-per-click
    conversion_rate     DECIMAL(5,4) DEFAULT 0,       -- Conversion rate
    cost_per_conversion DECIMAL(10,2) DEFAULT 0,      -- Cost per conversion
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, campaign_id, event_date, channel)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_tenant_id ON campaign_metrics_daily(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_campaign_id ON campaign_metrics_daily(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_date ON campaign_metrics_daily(event_date);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_channel ON campaign_metrics_daily(channel);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_ces_score ON campaign_metrics_daily(ces_score);

-- =====================================
-- Gold Layer: Campaign Performance Summary
-- =====================================

CREATE TABLE IF NOT EXISTS campaign_performance (
    id                  SERIAL PRIMARY KEY,
    tenant_id           INTEGER NOT NULL,
    campaign_id         VARCHAR(255) NOT NULL,
    campaign_name       VARCHAR(500),
    channel             VARCHAR(50) NOT NULL,
    status              VARCHAR(20) DEFAULT 'active', -- 'active', 'paused', 'completed'
    total_spend         DECIMAL(12,2) DEFAULT 0,
    total_impressions   BIGINT DEFAULT 0,
    total_clicks        BIGINT DEFAULT 0,
    total_conversions   BIGINT DEFAULT 0,
    avg_ces_score       DECIMAL(10,2) DEFAULT 0,
    avg_ctr             DECIMAL(5,4) DEFAULT 0,
    avg_cpc             DECIMAL(10,2) DEFAULT 0,
    avg_conversion_rate DECIMAL(5,4) DEFAULT 0,
    start_date          DATE,
    end_date            DATE,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, campaign_id, channel)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaign_performance_tenant_id ON campaign_performance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaign_performance_campaign_id ON campaign_performance(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_performance_channel ON campaign_performance(channel);
CREATE INDEX IF NOT EXISTS idx_campaign_performance_ces_score ON campaign_performance(avg_ces_score);
CREATE INDEX IF NOT EXISTS idx_campaign_performance_status ON campaign_performance(status);

-- =====================================
-- Row Level Security (RLS) Policies
-- =====================================

-- Enable RLS on all campaign tables
ALTER TABLE campaign_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_metrics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_performance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenant isolation
CREATE POLICY tenant_isolation_campaign_events ON campaign_events
    USING (tenant_id = COALESCE(current_setting('app.current_tenant_id', true), '0')::INT);

CREATE POLICY tenant_isolation_campaign_metrics ON campaign_metrics_daily
    USING (tenant_id = COALESCE(current_setting('app.current_tenant_id', true), '0')::INT);

CREATE POLICY tenant_isolation_campaign_performance ON campaign_performance
    USING (tenant_id = COALESCE(current_setting('app.current_tenant_id', true), '0')::INT);

-- =====================================
-- Helper Functions for CES Analytics
-- =====================================

-- Function to calculate CES score
CREATE OR REPLACE FUNCTION calculate_ces_score(conversions BIGINT, impressions BIGINT)
RETURNS DECIMAL(10,2) AS $$
BEGIN
    IF impressions IS NULL OR impressions = 0 THEN
        RETURN 0;
    END IF;
    RETURN ROUND((conversions::DECIMAL / impressions::DECIMAL) * 1000, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to refresh daily campaign metrics
CREATE OR REPLACE FUNCTION refresh_campaign_metrics_daily(target_date DATE DEFAULT CURRENT_DATE)
RETURNS TEXT AS $$
DECLARE
    result_text TEXT;
BEGIN
    -- Delete existing metrics for the target date
    DELETE FROM campaign_metrics_daily WHERE event_date = target_date;
    
    -- Insert aggregated daily metrics
    INSERT INTO campaign_metrics_daily (
        tenant_id, campaign_id, event_date, channel, 
        spend, impressions, clicks, conversions,
        ces_score, ctr, cpc, conversion_rate, cost_per_conversion
    )
    SELECT 
        tenant_id,
        campaign_id,
        target_date as event_date,
        channel,
        SUM(spend) as spend,
        SUM(impressions) as impressions,
        SUM(clicks) as clicks,
        SUM(conversions) as conversions,
        calculate_ces_score(SUM(conversions), SUM(impressions)) as ces_score,
        CASE 
            WHEN SUM(impressions) > 0 THEN ROUND((SUM(clicks)::DECIMAL / SUM(impressions)::DECIMAL) * 100, 4)
            ELSE 0 
        END as ctr,
        CASE 
            WHEN SUM(clicks) > 0 THEN ROUND(SUM(spend) / SUM(clicks), 2)
            ELSE 0 
        END as cpc,
        CASE 
            WHEN SUM(clicks) > 0 THEN ROUND((SUM(conversions)::DECIMAL / SUM(clicks)::DECIMAL) * 100, 4)
            ELSE 0 
        END as conversion_rate,
        CASE 
            WHEN SUM(conversions) > 0 THEN ROUND(SUM(spend) / SUM(conversions), 2)
            ELSE 0 
        END as cost_per_conversion
    FROM campaign_events
    WHERE DATE(event_time) = target_date
      AND event_type IN ('impression', 'click', 'conversion')
    GROUP BY tenant_id, campaign_id, channel;
    
    GET DIAGNOSTICS result_text = ROW_COUNT;
    RETURN 'Refreshed ' || result_text || ' daily metrics for ' || target_date;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh campaign performance summary
CREATE OR REPLACE FUNCTION refresh_campaign_performance()
RETURNS TEXT AS $$
DECLARE
    result_text TEXT;
BEGIN
    -- Clear existing performance data
    TRUNCATE campaign_performance;
    
    -- Insert aggregated performance data
    INSERT INTO campaign_performance (
        tenant_id, campaign_id, channel,
        total_spend, total_impressions, total_clicks, total_conversions,
        avg_ces_score, avg_ctr, avg_cpc, avg_conversion_rate,
        start_date, end_date
    )
    SELECT 
        tenant_id,
        campaign_id,
        channel,
        SUM(spend) as total_spend,
        SUM(impressions) as total_impressions,
        SUM(clicks) as total_clicks,
        SUM(conversions) as total_conversions,
        AVG(ces_score) as avg_ces_score,
        AVG(ctr) as avg_ctr,
        AVG(cpc) as avg_cpc,
        AVG(conversion_rate) as avg_conversion_rate,
        MIN(event_date) as start_date,
        MAX(event_date) as end_date
    FROM campaign_metrics_daily
    GROUP BY tenant_id, campaign_id, channel;
    
    GET DIAGNOSTICS result_text = ROW_COUNT;
    RETURN 'Refreshed ' || result_text || ' campaign performance summaries';
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- Sample Data for Testing (Multi-tenant)
-- =====================================

-- Insert sample data for CES tenant
INSERT INTO campaign_events (tenant_id, campaign_id, event_time, event_type, channel, spend, impressions, clicks, conversions) VALUES
-- CES Tenant (tenant_id = 1)
(1, 'CES_TikTok_Holiday_2024', '2024-12-01 10:00:00', 'impression', 'tiktok', 100.00, 10000, 0, 0),
(1, 'CES_TikTok_Holiday_2024', '2024-12-01 10:00:00', 'click', 'tiktok', 0, 0, 150, 0),
(1, 'CES_TikTok_Holiday_2024', '2024-12-01 10:00:00', 'conversion', 'tiktok', 0, 0, 0, 12),

(1, 'CES_Facebook_Q4_2024', '2024-12-01 11:00:00', 'impression', 'facebook', 150.00, 15000, 0, 0),
(1, 'CES_Facebook_Q4_2024', '2024-12-01 11:00:00', 'click', 'facebook', 0, 0, 200, 0),
(1, 'CES_Facebook_Q4_2024', '2024-12-01 11:00:00', 'conversion', 'facebook', 0, 0, 0, 18),

(1, 'CES_Google_Brand_2024', '2024-12-01 12:00:00', 'impression', 'google', 200.00, 8000, 0, 0),
(1, 'CES_Google_Brand_2024', '2024-12-01 12:00:00', 'click', 'google', 0, 0, 120, 0),
(1, 'CES_Google_Brand_2024', '2024-12-01 12:00:00', 'conversion', 'google', 0, 0, 0, 15),

-- Scout Tenant (tenant_id = 2) 
(2, 'Scout_TikTok_Launch_2024', '2024-12-01 10:00:00', 'impression', 'tiktok', 80.00, 12000, 0, 0),
(2, 'Scout_TikTok_Launch_2024', '2024-12-01 10:00:00', 'click', 'tiktok', 0, 0, 180, 0),
(2, 'Scout_TikTok_Launch_2024', '2024-12-01 10:00:00', 'conversion', 'tiktok', 0, 0, 0, 10),

(2, 'Scout_Meta_Reach_2024', '2024-12-01 11:00:00', 'impression', 'facebook', 120.00, 9000, 0, 0),
(2, 'Scout_Meta_Reach_2024', '2024-12-01 11:00:00', 'click', 'facebook', 0, 0, 135, 0),
(2, 'Scout_Meta_Reach_2024', '2024-12-01 11:00:00', 'conversion', 'facebook', 0, 0, 0, 8)
ON CONFLICT DO NOTHING;

-- Refresh metrics for sample data
SELECT refresh_campaign_metrics_daily(CURRENT_DATE);
SELECT refresh_campaign_performance();

-- =====================================
-- Test Queries for CES Analytics
-- =====================================

-- Test query to verify CES scores by tenant
-- Note: This will be filtered by RLS when app.current_tenant_id is set

COMMENT ON TABLE campaign_events IS 'Raw campaign events with tenant isolation via RLS';
COMMENT ON TABLE campaign_metrics_daily IS 'Daily aggregated campaign metrics with CES scoring';
COMMENT ON TABLE campaign_performance IS 'Campaign performance summaries for analytics dashboards';

COMMENT ON FUNCTION calculate_ces_score(BIGINT, BIGINT) IS 'Calculate CES Score: (conversions / impressions) * 1000';
COMMENT ON FUNCTION refresh_campaign_metrics_daily(DATE) IS 'Refresh daily campaign metrics from raw events';
COMMENT ON FUNCTION refresh_campaign_performance() IS 'Refresh campaign performance summaries from daily metrics';

-- Grant permissions (adjust as needed for your user roles)
-- GRANT SELECT, INSERT, UPDATE ON campaign_events TO campaign_analysts;
-- GRANT SELECT ON campaign_metrics_daily TO campaign_analysts;
-- GRANT SELECT ON campaign_performance TO campaign_analysts;