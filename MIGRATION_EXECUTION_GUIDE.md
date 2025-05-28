# Database Migration Execution Guide

## 🚀 How to Execute the Database Migration

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase dashboard: https://app.supabase.com/project/{your-project-id}
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Execute Migration Commands

Copy and paste the contents of `DATABASE_MIGRATION.sql` into the SQL editor and run it in sections:

#### Phase 1: Schema Updates (Run First)
```sql
-- 1. Create customer_requests table
CREATE TABLE IF NOT EXISTS customer_requests (
  id SERIAL PRIMARY KEY,
  transaction_id INT REFERENCES transactions(id),
  request_type VARCHAR(20) CHECK (request_type IN ('branded', 'unbranded', 'volume')),
  request_mode VARCHAR(20) CHECK (request_mode IN ('pointing', 'verbal')),
  accepted_suggestion BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add checkout duration to transactions
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS checkout_seconds INT DEFAULT NULL;

-- 3. Create system_logs table
CREATE TABLE IF NOT EXISTS system_logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Phase 2: Materialized Views (Run Second)
```sql
-- Create materialized views for performance
-- (Copy from DATABASE_MIGRATION.sql lines 45-120)
```

#### Phase 3: New RPC Functions (Run Third)
```sql
-- Create new RPC functions
-- (Copy from DATABASE_MIGRATION.sql lines 130-250)
```

#### Phase 4: Indexes (Run Fourth)
```sql
-- Create performance indexes
-- (Copy from DATABASE_MIGRATION.sql lines 260-280)
```

#### Phase 5: Auto-refresh Function (Run Last)
```sql
-- Create auto-refresh function
-- (Copy from DATABASE_MIGRATION.sql lines 290-320)
```

### Step 3: Verify Migration Success

Run this verification query:
```sql
-- Check if all components were created
SELECT 
  'Tables' as type, 
  COUNT(*) as count 
FROM information_schema.tables 
WHERE table_name IN ('customer_requests', 'system_logs')

UNION ALL

SELECT 
  'Materialized Views' as type, 
  COUNT(*) as count 
FROM pg_matviews 
WHERE matviewname IN ('v_txn_trends_daily', 'v_basket_summary', 'v_consumer_profile')

UNION ALL

SELECT 
  'RPC Functions' as type, 
  COUNT(*) as count 
FROM pg_proc 
WHERE proname IN ('get_hourly_trends', 'get_basket_summary', 'get_substitution_flow', 'get_request_behaviour', 'get_consumer_profile');
```

Expected results:
- Tables: 2
- Materialized Views: 3  
- RPC Functions: 5

### Step 4: Test New Functions

Test each new RPC function:

```sql
-- Test hourly trends
SELECT * FROM get_hourly_trends(
  '2024-01-01'::timestamptz, 
  '2024-01-31'::timestamptz
) LIMIT 5;

-- Test basket summary
SELECT * FROM get_basket_summary('electronics', 5);

-- Test consumer profile
SELECT * FROM get_consumer_profile(
  '2024-01-01'::timestamptz, 
  '2024-01-31'::timestamptz
);

-- Test request behavior
SELECT get_request_behaviour(
  '2024-01-01'::timestamptz, 
  '2024-01-31'::timestamptz
);
```

## 🔧 Alternative: Automated Execution

You can also use the provided script:

```bash
node scripts/execute-migration.js
```

**Note**: This requires `SUPABASE_SERVICE_ROLE_KEY` in your `.env` file for admin access.

## ✅ Post-Migration Steps

1. **Refresh Materialized Views**: Run the refresh function once
   ```sql
   SELECT sp_refresh_materialised_views();
   ```

2. **Add Sample Data** (Optional for testing):
   ```sql
   -- Insert some sample customer requests
   INSERT INTO customer_requests (transaction_id, request_type, request_mode, accepted_suggestion)
   SELECT 
     t.id,
     (ARRAY['branded', 'unbranded', 'volume'])[floor(random() * 3 + 1)],
     (ARRAY['pointing', 'verbal'])[floor(random() * 2 + 1)],
     random() > 0.3
   FROM transactions t
   WHERE t.created_at >= CURRENT_DATE - INTERVAL '30 days'
     AND random() > 0.7
   LIMIT 100;
   ```

3. **Update Frontend Services**: The new RPC functions are ready to use in your React components!

## 🚨 Troubleshooting

**If you get permission errors:**
- Make sure you're using the service role key, not anon key
- Check that RLS policies allow the operations

**If materialized views fail to create:**
- Check that base tables have data
- Verify column names match your schema

**If RPC functions fail:**
- Check for missing tables (like `substitutions`)
- Some functions may need table adjustments based on your actual schema

## 📋 Migration Checklist

- [ ] Phase 1: Schema updates completed
- [ ] Phase 2: Materialized views created  
- [ ] Phase 3: RPC functions added
- [ ] Phase 4: Performance indexes created
- [ ] Phase 5: Auto-refresh function added
- [ ] Verification queries run successfully
- [ ] Test queries return data
- [ ] Sample data added (optional)
- [ ] Frontend ready to use new functions

Once complete, your dashboard will have access to all 5 new RPC functions and optimized materialized views! 🎉