# 🚨 URGENT: Fix Database Access

The dashboard cannot work without fixing the database permissions. Follow these steps:

## Quick Fix (1 minute)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/lcoxtanyckjzyxxcsjzz
2. Click on **SQL Editor** in the left sidebar
3. Copy and paste this SQL:

```sql
-- Disable RLS for all tables
ALTER TABLE brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE skus DISABLE ROW LEVEL SECURITY;
ALTER TABLE substitution_events DISABLE ROW LEVEL SECURITY;

-- Grant read permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
```

4. Click **Run** button
5. Refresh your dashboard - it should work immediately!

## Why This Happened

Row Level Security (RLS) is enabled by default in Supabase, blocking all access until you create policies. The dashboard needs read access to display data.

## Production Solution

For production, instead of disabling RLS, create proper policies:

```sql
-- Example: Allow all users to read brands
CREATE POLICY "Allow public read access" ON brands
  FOR SELECT USING (true);
```

## Verify It's Fixed

After running the SQL, you should see:

- ✅ Green "Database connected successfully" message
- ✅ Data loading in all dashboard sections
- ✅ No more "Backend unreachable" errors
