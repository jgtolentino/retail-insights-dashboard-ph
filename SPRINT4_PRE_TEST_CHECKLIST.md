# 🚀 Sprint 4 Pre-Testing Checklist

## ⚠️ IMPORTANT: Run These Steps Before Testing

### 1️⃣ Database Setup (REQUIRED)

First, ensure your database has the Sprint 4 schema updates:

```bash
# Option A: Using Supabase CLI (Recommended)
supabase db push

# Option B: Manual SQL execution in Supabase Dashboard
# Go to SQL Editor and run these files in order:
# 1. migrations/sprint4_schema_updates.sql
# 2. migrations/sprint4_rpc_functions.sql
```

### 2️⃣ Install Dependencies (REQUIRED)

```bash
# Install new Sprint 4 dependencies
npm install @faker-js/faker@latest --save-dev
npm install @radix-ui/react-progress --save

# Update all dependencies
npm update
```

### 3️⃣ Generate Enhanced Data (REQUIRED)

The Sprint 4 features require enhanced transaction data with the new fields:

```bash
# Generate 2000 transactions with Sprint 4 fields
npm run tsx scripts/generate-enhanced-retail-data.ts

# If tsx doesn't work, try:
npx tsx scripts/generate-enhanced-retail-data.ts

# Or with ts-node:
npx ts-node scripts/generate-enhanced-retail-data.ts
```

### 4️⃣ Verify Data Generation

Run this SQL query in Supabase to verify the enhanced data:

```sql
-- Check if Sprint 4 fields are populated
SELECT 
    COUNT(*) as total_transactions,
    COUNT(payment_method) as has_payment_method,
    COUNT(checkout_time) as has_checkout_time,
    COUNT(request_type) as has_request_type,
    COUNT(transcription_text) as has_transcription,
    COUNT(CASE WHEN suggestion_accepted IS NOT NULL THEN 1 END) as has_suggestion_data
FROM transactions
WHERE checkout_time > NOW() - INTERVAL '1 hour';

-- Check substitutions table
SELECT COUNT(*) as substitution_count FROM substitutions;

-- Check request behaviors table  
SELECT COUNT(*) as behavior_count FROM request_behaviors;

-- Verify payment method distribution
SELECT payment_method, COUNT(*) 
FROM transactions 
WHERE payment_method IS NOT NULL
GROUP BY payment_method;

-- Verify request type distribution
SELECT request_type, COUNT(*)
FROM transactions
WHERE request_type IS NOT NULL  
GROUP BY request_type;
```

### 5️⃣ Run the Deployment Script (OPTIONAL - Automates Steps 1-4)

If you want to automate all the above steps:

```bash
# Make the script executable
chmod +x scripts/deploy-sprint4.sh

# Run the deployment script
./scripts/deploy-sprint4.sh
```

### 6️⃣ Start Development Server

```bash
# Start the development server
npm run dev

# The Sprint 4 dashboard will be available at:
# http://localhost:5173/sprint4
# http://localhost:5173/advanced-analytics
```

### 7️⃣ Quick Verification Test

Open browser console and run:

```javascript
// Test 1: Check if enhanced analytics service is working
const { enhancedAnalyticsService } = await import('/src/services/enhanced-analytics.ts');
const summary = await enhancedAnalyticsService.getDashboardSummary();
console.log('Dashboard Summary:', summary);

// Test 2: Check substitution patterns
const patterns = await enhancedAnalyticsService.getSubstitutionPatterns();
console.log('Substitution Patterns:', patterns.length);

// Test 3: Check request behaviors
const behaviors = await enhancedAnalyticsService.getRequestBehaviorStats();
console.log('Request Behaviors:', behaviors);
```

## ✅ Expected Results After Setup

### Database Should Have:
- ✅ ~2000 new transactions with Sprint 4 fields
- ✅ ~300 substitution records
- ✅ ~1600 request behavior records
- ✅ All transactions have payment_method, checkout_time, request_type
- ✅ 80%+ transactions have transcription_text

### Sprint 4 Dashboard Should Show:
- ✅ "Advanced Analytics" in navigation with ✨ indicator
- ✅ 4 tabs: Overview, Substitution Flow, Customer Behavior, AI Recommendations
- ✅ Substitution flow visualization with brand relationships
- ✅ Request behavior charts (branded/unbranded/pointing)
- ✅ AI recommendations with actionable insights
- ✅ NLP insights from Filipino transcriptions

## 🔍 Troubleshooting Common Issues

### Issue: "No substitution patterns found"
**Solution**: Run the enhanced data generation script - it creates substitution records

### Issue: "Failed to load request behavior analysis"  
**Solution**: Check if RPC functions were created - run migrations/sprint4_rpc_functions.sql

### Issue: Empty payment method or request type data
**Solution**: The original data doesn't have these fields - run the enhanced data generator

### Issue: Page not found at /sprint4
**Solution**: Restart the dev server - the routes are already added to App.tsx

### Issue: Components not rendering
**Solution**: Check browser console for errors - likely missing the new dependencies

## 🎯 Quick Test Sequence

1. Navigate to `/sprint4`
2. Check Overview tab - should see implementation status
3. Click Substitution Flow tab - should see Sankey-style visualization
4. Click Customer Behavior tab - should see request type charts
5. Click AI Recommendations tab - should see insights and recommendations
6. Change date range - all components should update
7. Click Export button - should download CSV

## 📊 Data Verification Queries

```sql
-- Complete Sprint 4 data health check
WITH data_quality AS (
  SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT DATE(checkout_time)) as days_with_data,
    COUNT(DISTINCT payment_method) as payment_methods,
    COUNT(DISTINCT request_type) as request_types,
    AVG(checkout_seconds) as avg_checkout_time,
    SUM(CASE WHEN suggestion_accepted THEN 1 ELSE 0 END)::FLOAT / COUNT(*) as acceptance_rate
  FROM transactions
  WHERE checkout_time > NOW() - INTERVAL '30 days'
)
SELECT * FROM data_quality;

-- Should return:
-- total_records: 2000+
-- days_with_data: 30
-- payment_methods: 4 (cash, gcash, maya, credit)
-- request_types: 3 (branded, unbranded, pointing)
-- avg_checkout_time: ~75 seconds
-- acceptance_rate: ~0.7 (70%)
```

## 🚦 Ready to Test Indicators

✅ **Green Light** - Ready to test when you see:
- Navigation shows "Advanced Analytics" with ✨
- /sprint4 page loads without errors
- All 4 tabs are visible and clickable
- Data appears in visualizations
- No console errors

❌ **Red Light** - Not ready if:
- 404 error on /sprint4
- Empty charts or "No data" messages
- Console errors about missing functions
- Loading states that never resolve

---

**Once all steps are complete, you're ready to test the Sprint 4 features! 🎉**