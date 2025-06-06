# MCP (Managed Connection Proxy) Setup Guide

This guide explains how to set up MCP for enhanced security and performance with your Supabase connection.

## What is MCP?

MCP (Managed Connection Proxy) is Supabase's security feature that:

- Provides short-lived JWT tokens instead of permanent API keys
- Reduces security risks from exposed credentials
- Offers better connection management
- Enables more granular access control

## Current Status

✅ **MCP Integration Code**: Ready (with fallback to standard client)
✅ **Serverless Endpoint**: Created at `/pages/api/getMcpToken.js`
✅ **Fallback Mechanism**: Falls back to standard Supabase client if MCP fails

## Setup Steps

### 1. Enable MCP in Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/lcoxtanyckjzyxxcsjzz
2. Navigate to: **Settings** → **Database** → **Connection Pooling**
3. Enable **"Managed Connection Proxy"**
4. Note your MCP URL (format: `https://lcoxtanyckjzyxxcsjzz.mcp.supabase.co`)

### 2. Configure Environment Variables in Vercel

Add these to your Vercel project environment variables:

```bash
# Client-side (exposed to browser)
VITE_SUPABASE_MCP_URL=https://lcoxtanyckjzyxxcsjzz.mcp.supabase.co

# Server-side only (secure)
SUPABASE_PROJECT_REF=lcoxtanyckjzyxxcsjzz
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDUzMjcsImV4cCI6MjA2MzkyMTMyN30.W2JgvZdXubvWpKCNZ7TfjLiKANZO1Hlb164fBEKH2dA
```

### 3. Test MCP Integration

After setting environment variables:

1. Deploy to Vercel
2. Check browser console for MCP logs
3. Verify network requests use MCP URL
4. Confirm fallback works if MCP fails

## How It Works

```javascript
// 1. Client requests data
const supabase = await getSupabaseClient();

// 2. If MCP_URL is set:
//    - Calls /api/getMcpToken to get short-lived token
//    - Creates Supabase client with MCP URL + token
// 3. If MCP fails or not configured:
//    - Falls back to standard Supabase client
//    - Uses permanent API key (current setup)

// 4. All queries work the same way regardless of client type
const { data } = await supabase.from('brands').select('*');
```

## Verification

Once configured, you should see in browser console:

```
🔍 Supabase Request: https://lcoxtanyckjzyxxcsjzz.mcp.supabase.co/rest/v1/brands
```

Instead of:

```
🔍 Supabase Request: https://lcoxtanyckjzyxxcsjzz.supabase.co/rest/v1/brands
```

## Benefits After Setup

- ✅ **Enhanced Security**: Short-lived tokens instead of permanent keys
- ✅ **Better Performance**: Optimized connection pooling
- ✅ **Audit Trail**: Better logging and monitoring
- ✅ **Zero Downtime**: Automatic fallback if MCP unavailable

## Troubleshooting

### MCP Not Working?

- Check environment variables are set correctly in Vercel
- Verify MCP is enabled in Supabase dashboard
- Look for error messages in browser console
- System will automatically fallback to standard client

### Still Getting Standard URLs?

- MCP URL environment variable not set
- MCP endpoint returning errors
- This is expected behavior - fallback is working

## Current Implementation Status

🟢 **Ready to Enable**: All code is in place
🟡 **Optional**: Dashboard works fine without MCP
🔄 **Zero Risk**: Fallback ensures no downtime

The system will continue working with the current setup. MCP is an enhancement, not a requirement.
