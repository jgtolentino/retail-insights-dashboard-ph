# Vercel Environment Variables Setup Guide

This guide ensures environment variables persist across all Vercel deployments.

## Required Environment Variables

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Setup Steps

### 1. Set Environment Variables in Vercel Dashboard

1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

   - **Variable Name**: `VITE_SUPABASE_URL`
     - **Value**: Your Supabase project URL
     - **Environment**: ✅ Production, ✅ Preview, ✅ Development
   
   - **Variable Name**: `VITE_SUPABASE_ANON_KEY`
     - **Value**: Your Supabase anon key
     - **Environment**: ✅ Production, ✅ Preview, ✅ Development

4. Click **Save** for each variable

### 2. Verify Configuration

The project now includes:

1. **`vercel.json`** - Ensures environment variables are mapped correctly
2. **`scripts/verify-env.js`** - Validates environment variables during build
3. **Build script** - Automatically checks environment variables before building

### 3. Test Your Setup

Run locally to verify:
```bash
npm run verify:env
```

### 4. Redeploy to Apply Changes

After setting up environment variables:

```bash
# Deploy to production
npm run deploy

# Or deploy to preview
vercel
```

## Troubleshooting

### If variables are still not persisting:

1. **Clear Vercel Cache**:
   - In Vercel Dashboard → Settings → Advanced → Clear Build Cache
   - Redeploy after clearing cache

2. **Check Variable Names**:
   - Ensure variables start with `VITE_` prefix
   - No spaces in variable names
   - Exact case matching

3. **Verify in Build Logs**:
   - Check Vercel deployment logs
   - Look for "Verifying environment variables..." section
   - Should show ✅ for each variable

4. **Force Rebuild**:
   ```bash
   vercel --force
   ```

### Common Issues

- **Variables not showing in app**: Make sure to use `import.meta.env.VITE_*` in your code
- **Build fails with missing variables**: Check that variables are set for the correct environment
- **Different values in preview vs production**: Set variables for all environments

## Security Notes

- Never commit `.env` files with real values
- Use `.env.example` for documentation
- Environment variables in Vercel are encrypted at rest
- Only use `VITE_` prefix for client-side variables

## Verification

After deployment, verify variables are working:

1. Check browser console:
   ```javascript
   console.log(import.meta.env.VITE_SUPABASE_URL)
   ```

2. Check network tab for Supabase requests going to correct URL

3. Run the verification script in build logs