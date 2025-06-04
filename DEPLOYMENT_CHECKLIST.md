# Pre-Deployment Checklist

## Before Every Deployment:

- [ ] Remove all mock data fallbacks
- [ ] Test with real database connection
- [ ] Check for hardcoded values
- [ ] Verify environment variables are set
- [ ] Run build locally first
- [ ] Check for Icon files and clean them
- [ ] Ensure no large backup files in dist
- [ ] Verify all imports use relative paths
- [ ] Run tests and ensure they pass
- [ ] Check build size is reasonable (<10MB)
- [ ] Verify no console.log statements in production code
- [ ] Check that real-time connections work
- [ ] Validate all API endpoints return data

## Environment Variables Required:

- `VITE_SUPABASE_URL` (standard Supabase URL)
- `VITE_SUPABASE_ANON_KEY` (anon key)
- `USE_MOCK_DATA=false` (for production)
- `NODE_ENV=production`

## Optional Environment Variables:

- `VITE_SUPABASE_MCP_URL` (if using Managed Connection Proxy)

## MCP (Managed Connection Proxy) Notes:

- ✅ MCP provides enhanced security and connection management
- ✅ Fallback to standard client if MCP fails
- ✅ Requires `/api/getMcpToken` endpoint for token refresh
- ⚠️ Ensure MCP URL is properly configured if using

## Build Commands to Run:

```bash
npm run clean
npm run build
npm run preview  # Test locally
```

## Common Issues to Check:

1. **Icon Files**: Search for `Icon*` files and delete them
2. **Backup Files**: Remove any `*backup*` or `*.bak` files
3. **Mock Data**: Ensure `USE_MOCK_DATA` is false
4. **Import Paths**: Check all imports use `@/` or relative paths
5. **Console Logs**: Remove debug console.log statements
6. **Large Assets**: Check for oversized images or data files

## Post-Deployment Verification:

- [ ] Dashboard loads without errors
- [ ] Real-time updates work
- [ ] Filters function correctly
- [ ] API calls return real data
- [ ] Mobile responsive design works
- [ ] Performance is acceptable (< 3s load time)

## Emergency Rollback:

```bash
git revert HEAD --no-edit
git push origin main
# Or use Vercel: vercel rollback
```
