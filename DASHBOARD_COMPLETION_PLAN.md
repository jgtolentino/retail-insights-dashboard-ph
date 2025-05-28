# Dashboard Completion Plan - Live Implementation Guide

## Current Status vs Dashboard Spec - Gap Analysis

### ✅ What We Have (4 RPC Functions)

| Current RPC                    | What it feeds                      | Dashboard block                     |
| ------------------------------ | ---------------------------------- | ----------------------------------- |
| `get_daily_trends`             | Txn count / ₱ by day               | **1 Transaction Trends**            |
| `get_age_distribution`         | Age histogram                      | **4 Consumer Profiling**            |
| `get_gender_distribution`      | Gender histogram                   | **4 Consumer Profiling**            |
| `get_purchase_behavior_by_age` | Age-segmented brand/category share | **2 Product-Mix** & **4 Profiling** |

### ❌ What's Missing

Everything else in the dashboard brief:
- Request type analysis
- Suggestion acceptance tracking  
- Substitution Sankey diagrams
- Advanced KPI cards
- AI recommendation panel
- Hour-of-day granularity
- Multi-SKU combo stats

## 🏗️ Implementation Plan

### Phase 1: Database Schema Updates

#### 1.1 New Tables
```sql
-- Customer request tracking
CREATE TABLE customer_requests (
  id SERIAL PRIMARY KEY,
  transaction_id INT REFERENCES transactions(id),
  request_type VARCHAR(20) CHECK (request_type IN ('branded', 'unbranded', 'volume')),
  request_mode VARCHAR(20) CHECK (request_mode IN ('pointing', 'verbal')),
  accepted_suggestion BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add checkout duration to transactions
ALTER TABLE transactions 
ADD COLUMN checkout_seconds INT DEFAULT NULL;
```

#### 1.2 Materialized Views
```sql
-- Daily transaction trends view
CREATE MATERIALIZED VIEW v_txn_trends_daily AS
SELECT 
  date_trunc('day', created_at) as date,
  COUNT(*) as transaction_count,
  SUM(total_amount) as total_revenue,
  AVG(total_amount) as avg_basket_size,
  EXTRACT(dow FROM created_at) as day_of_week,
  CASE WHEN EXTRACT(dow FROM created_at) IN (0,6) THEN 'weekend' ELSE 'weekday' END as day_type
FROM transactions
GROUP BY date_trunc('day', created_at), EXTRACT(dow FROM created_at);

-- Basket composition summary
CREATE MATERIALIZED VIEW v_basket_summary AS
SELECT 
  p.name as product_name,
  b.name as brand_name,
  b.category,
  SUM(i.quantity) as total_quantity,
  COUNT(DISTINCT i.transaction_id) as transaction_count,
  AVG(i.quantity) as avg_quantity_per_txn
FROM transaction_items i
JOIN products p ON p.id = i.product_id
JOIN brands b ON b.id = p.brand_id
GROUP BY p.id, p.name, b.name, b.category;

-- Consumer profile aggregation
CREATE MATERIALIZED VIEW v_consumer_profile AS
SELECT 
  age_bucket,
  gender,
  COUNT(*) as customer_count,
  AVG(total_spent) as avg_spending,
  COUNT(DISTINCT store_id) as stores_visited
FROM (
  SELECT 
    c.id,
    c.age,
    c.gender,
    CASE 
      WHEN c.age < 25 THEN '18-24'
      WHEN c.age < 35 THEN '25-34'
      WHEN c.age < 45 THEN '35-44'
      WHEN c.age < 55 THEN '45-54'
      ELSE '55+'
    END as age_bucket,
    SUM(t.total_amount) as total_spent,
    t.store_id
  FROM customers c
  JOIN transactions t ON t.customer_id = c.id
  GROUP BY c.id, c.age, c.gender, t.store_id
) customer_stats
GROUP BY age_bucket, gender;
```

#### 1.3 Auto-refresh Stored Procedure
```sql
-- Refresh materialized views every 30 minutes
CREATE OR REPLACE FUNCTION sp_refresh_materialised_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW v_txn_trends_daily;
  REFRESH MATERIALIZED VIEW v_basket_summary;
  REFRESH MATERIALIZED VIEW v_consumer_profile;
  
  -- Log refresh time
  INSERT INTO system_logs (action, created_at) 
  VALUES ('materialized_views_refreshed', NOW());
END;
$$;

-- Set up cron job (run in Supabase SQL editor)
SELECT cron.schedule('refresh-views', '*/30 * * * *', 'SELECT sp_refresh_materialised_views();');
```

### Phase 2: New RPC Functions

#### 2.1 Hour-level Trends + KPI Cards
```sql
create or replace function get_hourly_trends(
  p_start  timestamptz,
  p_end    timestamptz,
  p_store  int[] default null
)
returns table(hr timestamptz, txn_ct int, peso numeric, units int)
language sql security definer as $$
  select date_trunc('hour', t.created_at) as hr,
         count(*)                         as txn_ct,
         sum(t.total_amount)              as peso,
         sum(i.quantity)                  as units
  from   transactions t
  join   transaction_items i on i.transaction_id = t.id
  where  t.created_at between p_start and p_end
         and (p_store is null or t.store_id = any(p_store))
  group  by 1
  order  by 1;
$$;
```

#### 2.2 Basket Composition & Top-N SKUs
```sql
create or replace function get_basket_summary(
  p_cat varchar default null,
  p_n   int     default 10
)
returns table(product_name varchar, qty_sum bigint)
language sql security definer as $$
  select p.name, sum(i.quantity)
  from   transaction_items i
  join   products p on p.id = i.product_id
  join   brands   b on b.id = p.brand_id
  where  (p_cat is null or b.category = p_cat)
  group  by p.name
  order  by sum(i.quantity) desc
  limit  p_n;
$$;
```

#### 2.3 Substitution Flows for Sankey Diagrams
```sql
create or replace function get_substitution_flow()
returns table(orig varchar, sub varchar, cnt int)
language sql security definer as $$
  select po.name as orig,
         ps.name as sub,
         count(*) as cnt
  from   substitutions s
  join   products po on po.id = s.original_product_id
  join   products ps on ps.id = s.substitute_product_id
  group  by po.name, ps.name
  order  by cnt desc;
$$;
```

#### 2.4 Request Behavior Analytics
```sql
create or replace function get_request_behaviour(
  p_start timestamptz,
  p_end   timestamptz
)
returns jsonb
language plpgsql security definer as $$
declare
  v_out jsonb;
begin
  select jsonb_build_object(
           'branded',  sum((request_type='branded')::int),
           'unbranded',sum((request_type='unbranded')::int),
           'volume',   sum((request_type='volume')::int),
           'pointing', sum((request_mode='pointing')::int),
           'verbal',   sum((request_mode='verbal')::int),
           'suggestion_accept', sum((accepted_suggestion)::int)
         )
  into   v_out
  from   customer_requests
  where  created_at between p_start and p_end;

  return v_out;
end; 
$$;
```

### Phase 3: Performance Indexing
```sql
-- Essential indexes for performance
CREATE INDEX IF NOT EXISTS idx_txn_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_txn_store ON transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_items_txn ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_subs_products ON substitutions(original_product_id, substitute_product_id);
CREATE INDEX IF NOT EXISTS idx_req_created ON customer_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_customers_age_gender ON customers(age, gender);
```

### Phase 4: Frontend Implementation

#### 4.1 New React Components Needed
```typescript
// src/components/charts/HourlyTrends.tsx
// src/components/charts/BasketHeatmap.tsx  
// src/components/charts/SubstitutionSankey.tsx
// src/components/charts/RequestBehaviorChart.tsx
// src/components/dashboard/KPICards.tsx
// src/components/dashboard/AIRecommendationPanel.tsx
```

#### 4.2 Update Service Layer
```typescript
// src/services/dashboard.ts - Add new functions:

export async function fetchHourlyTrends(startDate: Date, endDate: Date, storeIds?: number[]) {
  return await supabase.rpc('get_hourly_trends', {
    p_start: startDate.toISOString(),
    p_end: endDate.toISOString(),
    p_store: storeIds || null
  });
}

export async function fetchBasketSummary(category?: string, limit = 10) {
  return await supabase.rpc('get_basket_summary', {
    p_cat: category || null,
    p_n: limit
  });
}

export async function fetchSubstitutionFlow() {
  return await supabase.rpc('get_substitution_flow');
}

export async function fetchRequestBehavior(startDate: Date, endDate: Date) {
  return await supabase.rpc('get_request_behaviour', {
    p_start: startDate.toISOString(),
    p_end: endDate.toISOString()
  });
}
```

#### 4.3 Chart Integrations
| Dashboard Widget | Frontend Call | Library |
|------------------|---------------|---------|
| KPI Cards & Hourly Line | `fetchHourlyTrends()` | Recharts |
| Basket Heatmap | `fetchBasketSummary()` | D3.js heatmap |
| Substitution Sankey | `fetchSubstitutionFlow()` | D3-sankey |
| Behavior Analysis | `fetchRequestBehavior()` | Recharts pie/bar |

### Phase 5: Cleanup & Optimization

#### 5.1 Deprecate Old Functions
- Remove `get_purchase_behavior_by_age` once `get_basket_summary` is live
- Merge `get_age_distribution` & `get_gender_distribution` into single `get_consumer_profile`

#### 5.2 Migration Script
```sql
-- migration.sql
-- Run this to upgrade existing dashboard to full spec
\i schema_updates.sql
\i new_rpc_functions.sql  
\i create_indexes.sql
\i setup_cron_jobs.sql
```

## 📋 Implementation Checklist

### Database Tasks
- [ ] Create `customer_requests` table
- [ ] Add `checkout_seconds` column to transactions
- [ ] Create materialized views
- [ ] Add new RPC functions  
- [ ] Create performance indexes
- [ ] Set up auto-refresh cron job

### Frontend Tasks  
- [ ] Build hourly trends component
- [ ] Build basket heatmap component
- [ ] Build substitution Sankey component
- [ ] Build request behavior charts
- [ ] Build KPI cards component
- [ ] Build AI recommendation panel
- [ ] Update service layer with new RPCs
- [ ] Update existing charts to use materialized views

### Testing Tasks
- [ ] Test all new RPC functions
- [ ] Verify materialized view performance
- [ ] Load test with sample data
- [ ] Cross-browser testing
- [ ] Mobile responsiveness testing

## 🎯 Expected Outcome

Once complete, the dashboard will have:
- ✅ Real-time transaction trends (hourly granularity)
- ✅ Advanced consumer profiling with cross-tabs
- ✅ Product mix analysis with basket composition
- ✅ Substitution flow visualization  
- ✅ Customer request behavior analytics
- ✅ AI-powered recommendations
- ✅ Performance optimized with materialized views
- ✅ Auto-refreshing data pipeline

This transforms the current basic dashboard into a comprehensive retail analytics platform matching the original specification.