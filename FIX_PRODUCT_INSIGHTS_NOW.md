# 🚨 Fix Product Insights Errors

To fix the "404 brand_analytics" errors:

## Quick Fix (30 seconds)

1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/lcoxtanyckjzyxxcsjzz/sql
2. Copy the entire contents of: `/scripts/fix-all-missing-views.sql`
3. Paste and click **Run**
4. Refresh your dashboard

## What This Fixes

✅ Product Insights page - brand_analytics view
✅ Consumer Insights page - customer_analytics view  
✅ Basket Behavior page - basket_analytics view
✅ AI Recommendations - substitution_analytics view
✅ Trends Explorer - daily_trends view

## Why This Happened

The database migrations didn't run automatically. These views aggregate data from the raw tables to power the dashboard visualizations.

## Alternative Quick Command

If you just want Product Insights working:

```sql
CREATE OR REPLACE VIEW brand_analytics AS
SELECT
    b.id as brand_id,
    b.name as brand_name,
    COALESCE(b.category, 'Uncategorized') as category,
    false as is_tbwa,
    COUNT(ti.id) as total_transactions,
    COALESCE(SUM(ti.quantity * ti.price), 0) as total_revenue,
    COALESCE(SUM(ti.quantity), 0) as total_quantity,
    0 as avg_price,
    0 as market_share
FROM brands b
LEFT JOIN transaction_items ti ON ti.brand_id = b.id
GROUP BY b.id, b.name, b.category;

GRANT SELECT ON brand_analytics TO anon;
```
