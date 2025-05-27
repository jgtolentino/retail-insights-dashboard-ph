# Error Prevention Guide

## 🛡️ Automated Error Prevention System

This guide explains how to use the error prevention system implemented for the retail insights dashboard.

## 1. Pre-Deployment Checks

### Automated Script
Run before every deployment:
```bash
npm run deploy:check
```

This checks:
- ✅ Build succeeds
- ✅ Environment variables exist
- ✅ TypeScript has no errors
- ✅ Console errors are tracked
- ✅ TODO comments are flagged

### Manual Deployment with Checks
```bash
npm run deploy  # Automatically runs deploy:check first
```

## 2. Sprint-Specific Error Boundaries

### Using SprintDashboard Component
Wrap each sprint's features with error protection:

```tsx
import { SprintDashboard } from '@/components/SprintDashboard';

// In your component
<SprintDashboard sprint={1}>
  <TimeSeriesChart data={data} />
  <TransactionTrends />
</SprintDashboard>
```

### Benefits:
- Catches expected errors gracefully
- Provides helpful error messages
- Suggests solutions
- Prevents full dashboard crash

## 3. Pre-Sprint Validation

### Check Sprint Readiness
Before implementing each sprint:

```typescript
import { runPreSprintChecks, displayValidationResults } from '@/utils/pre-sprint-checks';

// Check sprint 1 readiness
const results = await runPreSprintChecks(1);
displayValidationResults(results);
```

### What It Validates:
- **Sprint 1**: Transaction data, date fields, store locations
- **Sprint 2**: Product relationships, categories, brand data
- **Sprint 3**: Consumer behavior fields
- **Sprint 4**: Geographic coordinates, mapping data
- **Sprint 5**: API keys, data volume for AI

## 4. Console Error Monitoring

### During Development:
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Fix all red errors before committing

### Automated Checks:
GitHub Actions will automatically:
- Run on every push to main
- Check for build errors
- Flag console.error statements
- Validate TypeScript

## 5. Common Error Patterns & Solutions

### Time Series Errors (Sprint 1)
```typescript
// Problem: "Cannot read property 'map' of undefined"
// Solution: Always provide default empty array
const data = timeSeriesData || [];
```

### Supabase Query Errors
```typescript
// Problem: "Unexpected 'c' expecting..."
// Solution: Use simple queries instead of complex joins
const { data } = await supabase
  .from('transactions')
  .select('*')  // Simple select
  .gte('created_at', startDate);
```

### Missing Environment Variables
```typescript
// Problem: "Invalid API key"
// Solution: Check .env.local exists with:
// VITE_SUPABASE_URL=...
// VITE_SUPABASE_ANON_KEY=...
```

## 6. Deployment Workflow

### Local Development
```bash
# 1. Make changes
# 2. Test locally
npm run dev

# 3. Run validation
npm run deploy:check

# 4. Fix any issues
# 5. Commit and push
```

### Production Deployment
```bash
# Automatic checks before deploy
npm run deploy

# Or manual steps:
npm run build
npm run deploy:check
vercel --prod
```

## 7. Error Tracking Setup

### Add to Main App Component
```tsx
import { SprintErrorBoundary } from '@/utils/error-boundary-sprint';

function App() {
  return (
    <SprintErrorBoundary sprint={getCurrentSprint()}>
      <Dashboard />
    </SprintErrorBoundary>
  );
}
```

### Monitor in Production
1. Check Vercel Functions logs
2. Monitor browser console in production
3. Set up error tracking service (Sentry, LogRocket)

## 8. Sprint Rollout Checklist

Before each sprint:
- [ ] Run `runPreSprintChecks(sprintNumber)`
- [ ] Fix all validation errors
- [ ] Wrap features in SprintErrorBoundary
- [ ] Test error scenarios locally
- [ ] Run `npm run deploy:check`
- [ ] Deploy to staging first
- [ ] Monitor for 24 hours
- [ ] Deploy to production

## 9. Quick Fixes

### Dashboard Shows All Zeros
```bash
# Check environment variables
cat .env.local

# Test database connection
node test-dashboard.js

# Restart dev server
npm run dev
```

### Build Fails
```bash
# Check TypeScript errors
npx tsc --noEmit

# Clear cache and rebuild
rm -rf node_modules/.vite
npm run build
```

### Deployment Fails
```bash
# Verify Vercel env vars are set
vercel env ls

# Re-add if missing
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
```

---

By following this guide, you can catch and prevent most errors before they reach production!