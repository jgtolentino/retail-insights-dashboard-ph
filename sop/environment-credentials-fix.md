# Environment Credentials Fix SOP

## 🚨 Issue: Missing Environment Variables in Production

### Symptoms

- Production deployment shows: `Missing environment variable: SUPABASE_ANON_KEY`
- React app fails to mount with runtime errors
- Dashboard shows "Something went wrong" error boundary

### Root Cause

Required environment variables are not configured in Vercel production environment.

## ✅ Automated Fix Steps

### Step 1: Go to Vercel Environment Variables

**URL**: https://vercel.com/jakes-projects-e9f46c30/retail-insights-dashboard-ph/settings/environment-variables

### Step 2: Add Required Variables (Production Scope)

| Variable Name            | Value                                                                                                                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `VITE_SUPABASE_URL`      | `https://clyzeaymuldsaslqtjnr.supabase.co`                                                                                                                                                                         |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNseXplYXltdWxkc2FzbHF0am5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5ODkxOTAsImV4cCI6MjA0OTU2NTE5MH0.J7R_fJ3-wWPJJSX8h_4Q-PUHDvdVdQd4QdNSPYB5L5M` |

### Step 3: Redeploy

1. Go to **Deployments** tab
2. Click **"Redeploy"** on latest deployment
3. Wait for deployment to complete (~2-3 minutes)

### Step 4: Verify Fix

- Visit production URL: https://retail-insights-dashboard-ph.vercel.app
- Confirm dashboard loads without errors
- Check browser console for any remaining errors

## 🔧 Prevention

This issue is now automatically detected by:

- `vercel-env-check` Pulser task
- Environment validation in `run-backend-qa-proper.sh`
- Pre-deployment checks in `qa-full` pipeline

## 📋 Validation Commands

```bash
# Check local environment
./check-vercel-env.sh

# Run full QA with environment check
npm run qa-full

# Verify production deployment
npx playwright test tests/e2e/production-health.spec.ts
```

## 🚨 Emergency Rollback

If environment fix doesn't work:

```bash
# Rollback to previous working deployment
vercel rollback --token YOUR_VERCEL_TOKEN
```

---

**Last Updated**: $(date)
**SOP Version**: 1.0
**Pulser Integration**: Automatic via Caca agent
