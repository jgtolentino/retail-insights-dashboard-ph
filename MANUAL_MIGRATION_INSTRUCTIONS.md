# 🚀 Manual Migration Instructions

## Why Manual Migration is Needed

The Supabase instance doesn't have an `exec_sql` RPC function for executing arbitrary SQL, and the database password appears to be different than expected. However, we can apply the migration manually through the Supabase Dashboard.

## ✅ What's Already Working

These functions are already available and working:
- `get_dashboard_summary()` ✅ 
- `v_behavior_suggestions` view ✅

## 🔧 What Needs to be Added

These functions need to be created manually:
- `get_dashboard_summary_weekly()`
- `get_suggestion_funnel()`
- Missing fields in `request_behaviors` table

## 📋 Step-by-Step Instructions

### 1. Go to Supabase SQL Editor
Open: https://supabase.com/dashboard/project/lcoxtanyckjzyxxcsjzz/sql

### 2. Copy and Execute the Migration
Copy the entire contents of this file and paste it into the SQL Editor:

```
supabase/migrations/20250531055217_behavioral_analytics.sql
```

**Or use this direct link to the file:**
```
migrations/apply_all_behavioral_analytics.sql
```

### 3. Click "Run" to Execute

The migration will:
- Add missing fields to `request_behaviors` table
- Create the `v_behavior_suggestions` view
- Create `get_dashboard_summary()` function
- Create `get_dashboard_summary_weekly()` function  
- Create `get_suggestion_funnel()` function

### 4. Verify the Functions Work

After running the migration, test these queries in the SQL Editor:

```sql
-- Test Dashboard Summary
SELECT * FROM get_dashboard_summary('2024-01-01'::date, '2024-12-31'::date, NULL);

-- Test Weekly Summary  
SELECT * FROM get_dashboard_summary_weekly('2024-01-01'::date, '2024-12-31'::date, NULL) LIMIT 3;

-- Test Suggestion Funnel
SELECT * FROM get_suggestion_funnel('2024-01-01'::date, '2024-12-31'::date, NULL);

-- Test Behavior Suggestions View
SELECT COUNT(*) as total_rows FROM v_behavior_suggestions;
```

## 🎉 After Migration is Complete

Your dashboard will have:

1. **Enhanced KPI Cards** with suggestion metrics:
   - Suggestion Acceptance Rate
   - Substitution Rate

2. **Weekly Breakdown Chart** in Trends Explorer:
   - Revenue trends by week
   - Transaction volume by week  
   - Acceptance rate trends

3. **Suggestion Funnel** in Consumer Insights:
   - Total Transactions → Suggestions Offered → Accepted → Rejected
   - Conversion rate visualization

4. **Behavior Suggestions Table** in Sprint4 Dashboard:
   - Searchable and filterable data table
   - Export to CSV functionality
   - Store-level performance tracking

## 🚨 If You Encounter Issues

If any part of the migration fails:

1. **Check Error Messages** - Some functions might already exist
2. **Run Statements Individually** - Copy each function separately if needed
3. **Verify Table Structure** - Ensure `request_behaviors` table exists

## 📞 Alternative: Using Supabase CLI

If you have the correct database password, you can also run:

```bash
supabase db push --linked --password YOUR_DB_PASSWORD
```

But the manual approach via SQL Editor is the most reliable method.