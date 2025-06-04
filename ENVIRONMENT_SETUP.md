# Environment Variables Setup Guide

## 🚨 URGENT: Missing Environment Variables Error

If you're seeing "Missing required Supabase environment variables", follow these steps:

### For Lovable Platform:

1. **Go to your Lovable project settings**
2. **Find the "Environment Variables" section**
3. **Add these exact variables:**

```
VITE_SUPABASE_URL=https://lcoxtanyckjzyxxcsjzz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDUzMjcsImV4cCI6MjA2MzkyMTMyN30.W2JgvZdXubvWpKCNZ7TfjLiKANZO1Hlb164fBEKH2dA
```

4. **Save and redeploy**

### For Other Platforms:

**Vercel:**

1. Go to your project dashboard
2. Settings → Environment Variables
3. Add the variables above
4. Redeploy

**Netlify:**

1. Site settings → Environment variables
2. Add the variables
3. Trigger a new deploy

**Railway:**

1. Variables tab in your project
2. Add the environment variables
3. Redeploy

## 🔐 MCP (Managed Connection Proxy) Setup

For enhanced security, you can optionally set up MCP:

```bash
# Add this for MCP support
VITE_SUPABASE_MCP_URL=https://your-mcp-endpoint.com
```

### MCP Benefits:

- ✅ Enhanced security with short-lived tokens
- ✅ Better connection management
- ✅ Automatic failover to standard client
- ✅ Centralized authentication

### MCP Requirements:

1. Create an endpoint at `/api/getMcpToken`
2. Return short-lived tokens from your server
3. Configure the MCP URL in environment variables

## 🧪 Testing Environment Setup

To verify your environment is working:

```bash
# Run environment validation
npm run validate:env

# Or manually check
node scripts/validate-env.js
```

## 🚀 Quick Fix Commands

If you have access to the deployment:

```bash
# Set environment variables (adjust for your platform)
export VITE_SUPABASE_URL="https://lcoxtanyckjzyxxcsjzz.supabase.co"
export VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDUzMjcsImV4cCI6MjA2MzkyMTMyN30.W2JgvZdXubvWpKCNZ7TfjLiKANZO1Hlb164fBEKH2dA"

# Then restart your application
npm run build && npm start
```

## ❌ Common Issues

1. **Environment variables not loading**: Check if they're prefixed with `VITE_`
2. **Variables not updating**: Clear cache and redeploy
3. **MCP connection failing**: Check that fallback to standard client works
4. **Token expiration**: Ensure token refresh mechanism is working

## 📞 Support

If you're still having issues:

1. Check the browser console for detailed error messages
2. Verify environment variables are actually set in your deployment platform
3. Test locally with the same environment variables
4. Check if the Supabase project is accessible from your deployment region

---

**Last Updated:** June 2025  
**Priority:** 🚨 Critical for deployment
