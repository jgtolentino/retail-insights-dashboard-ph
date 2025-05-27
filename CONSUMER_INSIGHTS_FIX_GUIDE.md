# Consumer Insights Data Connection Fix Guide

## Issue
The Consumer Insights dashboard shows "No data available" because:
1. Age Distribution Function is failing
2. Gender Distribution Function is failing  
3. Raw Transaction Data access is blocked

## Solution Steps

### Step 1: Run in Supabase SQL Editor

Go to your Supabase Dashboard → SQL Editor and run these scripts in order:

#### 1.1 Check Current Function Status
```sql
-- Check what functions currently exist
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_age_distribution', 'get_gender_distribution');
```

#### 1.2 Drop Existing Functions (if any)
```sql
-- Clean up any existing functions with wrong signatures
DROP FUNCTION IF EXISTS public.get_age_distribution(TIMESTAMPTZ, TIMESTAMPTZ, INT);
DROP FUNCTION IF EXISTS public.get_age_distribution(TEXT, TEXT, INT);
DROP FUNCTION IF EXISTS public.get_age_distribution(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_gender_distribution(TIMESTAMPTZ, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.get_gender_distribution(TEXT, TEXT);
```

#### 1.3 Create Age Distribution Function
```sql
CREATE OR REPLACE FUNCTION public.get_age_distribution(
    start_date TIMESTAMPTZ DEFAULT '2025-01-01'::TIMESTAMPTZ,
    end_date TIMESTAMPTZ DEFAULT '2025-12-31'::TIMESTAMPTZ,
    bucket_size INT DEFAULT 10
)
RETURNS TABLE (
    age_bucket TEXT,
    customer_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN customer_age IS NULL THEN 'Unknown'
            ELSE (FLOOR(customer_age / bucket_size) * bucket_size)::TEXT || '-' || 
                 (FLOOR(customer_age / bucket_size) * bucket_size + bucket_size - 1)::TEXT
        END as age_bucket,
        COUNT(DISTINCT id)::BIGINT as customer_count
    FROM public.transactions
    WHERE created_at >= start_date 
    AND created_at <= end_date
    AND customer_age IS NOT NULL
    GROUP BY 
        CASE 
            WHEN customer_age IS NULL THEN 'Unknown'
            ELSE (FLOOR(customer_age / bucket_size) * bucket_size)::TEXT || '-' || 
                 (FLOOR(customer_age / bucket_size) * bucket_size + bucket_size - 1)::TEXT
        END
    ORDER BY MIN(customer_age);
END;
$$;
```

#### 1.4 Create Gender Distribution Function
```sql
CREATE OR REPLACE FUNCTION public.get_gender_distribution(
    start_date TIMESTAMPTZ DEFAULT '2025-01-01'::TIMESTAMPTZ,
    end_date TIMESTAMPTZ DEFAULT '2025-12-31'::TIMESTAMPTZ
)
RETURNS TABLE (
    gender TEXT,
    customer_count BIGINT,
    total_revenue NUMERIC,
    percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_customers BIGINT;
BEGIN
    -- Get total customer count for percentage calculation
    SELECT COUNT(DISTINCT id) INTO total_customers
    FROM public.transactions
    WHERE created_at >= start_date 
    AND created_at <= end_date
    AND customer_gender IS NOT NULL;
    
    RETURN QUERY
    SELECT 
        COALESCE(customer_gender, 'Unknown') as gender,
        COUNT(DISTINCT id)::BIGINT as customer_count,
        COALESCE(SUM(total_amount), 0)::NUMERIC as total_revenue,
        CASE 
            WHEN total_customers > 0 THEN 
                ROUND((COUNT(DISTINCT id)::NUMERIC / total_customers::NUMERIC) * 100, 2)
            ELSE 0
        END as percentage
    FROM public.transactions
    WHERE created_at >= start_date 
    AND created_at <= end_date
    AND customer_gender IS NOT NULL
    GROUP BY customer_gender
    ORDER BY customer_count DESC;
END;
$$;
```

#### 1.5 Grant Permissions
```sql
-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_age_distribution(TIMESTAMPTZ, TIMESTAMPTZ, INT) TO public;
GRANT EXECUTE ON FUNCTION public.get_gender_distribution(TIMESTAMPTZ, TIMESTAMPTZ) TO public;
GRANT EXECUTE ON FUNCTION public.get_age_distribution(TIMESTAMPTZ, TIMESTAMPTZ, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_gender_distribution(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
```

#### 1.6 Fix RLS Policies
```sql
-- Enable RLS and create permissive read policy
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "public_read_transactions" ON public.transactions;
DROP POLICY IF EXISTS "allow_read_transactions" ON public.transactions;

-- Create a permissive read policy for transactions
CREATE POLICY "allow_read_transactions" 
ON public.transactions 
FOR SELECT 
USING (true);
```

### Step 2: Test the Functions

#### 2.1 Test Age Distribution
```sql
SELECT * FROM public.get_age_distribution(
    '2025-01-01'::TIMESTAMPTZ, 
    '2025-12-31'::TIMESTAMPTZ, 
    10
) LIMIT 5;
```

#### 2.2 Test Gender Distribution
```sql
SELECT * FROM public.get_gender_distribution(
    '2025-01-01'::TIMESTAMPTZ, 
    '2025-12-31'::TIMESTAMPTZ
) LIMIT 5;
```

#### 2.3 Test Raw Transaction Data
```sql
SELECT 
    COUNT(*) as total_transactions,
    MIN(created_at) as earliest_date,
    MAX(created_at) as latest_date,
    COUNT(DISTINCT customer_age) as unique_ages,
    COUNT(DISTINCT customer_gender) as unique_genders
FROM public.transactions
WHERE created_at >= '2025-01-01'::TIMESTAMPTZ 
AND created_at <= '2025-12-31'::TIMESTAMPTZ;
```

### Step 3: Verify Function Signatures
```sql
SELECT 
    routine_name,
    string_agg(
        parameter_name || ' ' || data_type,
        ', ' ORDER BY ordinal_position
    ) as parameters
FROM information_schema.parameters 
WHERE specific_schema = 'public' 
AND specific_name IN (
    SELECT specific_name 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name IN ('get_age_distribution', 'get_gender_distribution')
)
GROUP BY routine_name, specific_name
ORDER BY routine_name;
```

## Expected Results

After running these scripts:

1. **Age Distribution Function** should return age buckets with customer counts
2. **Gender Distribution Function** should return gender breakdown with revenue and percentages  
3. **Raw Transaction Data** should show transaction counts and date ranges
4. **Consumer Insights Dashboard** should display charts with actual data

## Troubleshooting

If you still see "No data available":

1. Check that your transactions table has data with `customer_age` and `customer_gender` fields
2. Verify the date ranges match your actual data
3. Check the browser console for any JavaScript errors
4. Re-run the Data Connection tests in the Consumer Insights page

## Next Steps

Once the functions are working:
1. Go to Consumer Insights page
2. Click "Re-run Tests" button
3. All three tests should show green checkmarks
4. Age and Gender charts should populate with data
