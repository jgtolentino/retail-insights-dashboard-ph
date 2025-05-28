# Security Credentials Guide

## 🔒 Security Issue Fixed

**Date**: May 29, 2025  
**Issue**: Hardcoded Supabase credentials found in `test-sprint2-access.js`  
**Status**: ✅ RESOLVED

## 🚨 What Was the Problem?

The file `test-sprint2-access.js` contained hardcoded Supabase credentials:

```javascript
// ❌ SECURITY RISK - Never do this!
const supabaseUrl = 'https://lcoxtanyckjzyxxcsjzz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Why this is dangerous:**
- Credentials are visible to anyone with access to the repository
- Keys can be extracted from git history even after removal
- Exposed keys can be used maliciously
- Violates security best practices

## ✅ How It Was Fixed

1. **Removed hardcoded credentials** from `test-sprint2-access.js`
2. **Updated to use environment variables**:
   ```javascript
   // ✅ SECURE - Use environment variables
   const supabaseUrl = process.env.VITE_SUPABASE_URL
   const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
   ```
3. **Added validation** to ensure environment variables are present
4. **Verified no other files** contain hardcoded credentials

## 🔧 Current Secure Implementation

The updated `test-sprint2-access.js` now:

- ✅ Imports `dotenv` to load environment variables
- ✅ Uses `process.env.VITE_SUPABASE_URL` and `process.env.VITE_SUPABASE_ANON_KEY`
- ✅ Validates that required environment variables are present
- ✅ Exits gracefully with helpful error message if credentials are missing

## 📋 Environment Variables Required

Ensure these variables are set in your `.env` file:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## 🛡️ Security Best Practices

### ✅ DO:
- Store credentials in environment variables
- Use `.env` files (excluded from git via `.gitignore`)
- Use different credentials for different environments
- Rotate keys regularly
- Use least-privilege access (anon key for frontend, service key only when needed)

### ❌ DON'T:
- Hardcode credentials in source files
- Commit `.env` files to git
- Share credentials in chat/email
- Use production credentials in development
- Store credentials in comments or documentation

## 🔄 Next Steps Recommended

1. **Rotate the exposed key** in your Supabase project dashboard
2. **Audit git history** to ensure no other credentials were committed
3. **Review all scripts** in the `scripts/` directory for hardcoded credentials
4. **Set up pre-commit hooks** to prevent future credential commits

## 📁 Files That Use Environment Variables Correctly

These files already follow security best practices:

- ✅ `src/integrations/supabase/client.ts` - Uses environment variables
- ✅ `scripts/pre-deployment-validation.js` - Uses environment variables
- ✅ All React components - Use the centralized Supabase client

## 🔍 How to Check for Hardcoded Credentials

Run this command to search for potential hardcoded credentials:

```bash
# Search for JWT tokens
grep -r "eyJ" --include="*.js" --include="*.ts" --include="*.tsx" .

# Search for Supabase URLs
grep -r "supabase\.co" --include="*.js" --include="*.ts" --include="*.tsx" .

# Search for common credential patterns
grep -r -i "password\|secret\|key.*=" --include="*.js" --include="*.ts" .
```

## 📞 Contact

If you discover any security issues, please:
1. **Do not commit** the issue to git
2. **Remove credentials immediately** from code
3. **Rotate the exposed credentials** in the service dashboard
4. **Document the fix** following this guide

---

**Remember**: Security is everyone's responsibility. When in doubt, use environment variables! 🔒
