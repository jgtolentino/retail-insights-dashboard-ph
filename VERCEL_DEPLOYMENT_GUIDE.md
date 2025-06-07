# 🚀 Vercel Production Deployment Guide

## Quick Start

### Option 1: One-Command Deployment
```bash
./deploy-production.sh
```

### Option 2: Manual Deployment
```bash
npm run deploy:clean
```

---

## 🔧 Environment Variables Setup

You have **two options** for managing environment variables:

### Option 1: Azure Key Vault (Recommended for Production) 🔐

**Benefits:**
- Enterprise-grade security with encryption
- Centralized secret management
- Automatic secret rotation capabilities
- Audit logging and compliance
- Cost-effective (25,000 operations/month free)

**Setup Steps:**
1. **Run the setup script:**
   ```bash
   ./setup-azure-keyvault.sh
   ```

2. **Set in Vercel Dashboard:**
   ```
   AZURE_KEYVAULT_URL=https://your-keyvault.vault.azure.net/
   NODE_ENV=production
   ```

3. **The script will prompt for all required secrets:**
   - Supabase URL and keys
   - Groq API key (for StockBot)
   - Azure OpenAI credentials (optional)
   - IoT and database credentials (optional)

### Option 2: Direct Environment Variables

**For simple deployments, set these in Vercel Dashboard:**

1. **Groq AI (Required for StockBot)**
   ```
   GROQ_API_KEY=gsk_your_groq_api_key_here
   ```

2. **Supabase (Required)**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

3. **Production Settings**
   ```
   NODE_ENV=production
   VITE_APP_ENV=production
   ```

### How to Set Variables in Vercel:
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the variables (Azure Key Vault URL OR individual secrets)
4. Deploy or redeploy your project

---

## 📊 Build Optimization

### Bundle Analysis
The production build creates optimized chunks:
- **Main app**: ~38KB (core application)
- **React vendor**: ~252KB (React libraries - cached)
- **AI vendor**: ~247KB (Groq/AI libraries - cached)
- **Supabase vendor**: ~6KB (database client - cached)

### Production Features
- ✅ Console.log removal in production
- ✅ Terser minification
- ✅ Vendor chunk splitting for better caching
- ✅ Tree shaking for unused code
- ✅ Gzip compression

---

## 🧪 Pre-Deployment Checklist

### Automated Checks (included in deployment script)
- [ ] Clean npm install (`npm ci`)
- [ ] Linting passes (`npm run lint`)
- [ ] TypeScript compilation (`npm run typecheck`)
- [ ] Tests pass (`npm test`)
- [ ] Production build succeeds (`npm run build:prod`)

### Manual Verification
- [ ] Environment variables set in Vercel
- [ ] Supabase database is accessible
- [ ] Groq API key is valid
- [ ] Domain/subdomain configured (if custom)

---

## 📁 Project Structure

```
/
├── api/                    # Vercel serverless functions
│   └── chat.ts            # Groq AI chat endpoint
├── src/                   # React application source
├── dist/                  # Production build output
├── vercel.json           # Vercel configuration
├── deploy-production.sh  # Deployment script
└── .env.production.template  # Environment template
```

---

## 🔄 Deployment Commands

### Development
```bash
npm run dev              # Start development server
npm run preview         # Preview production build locally
```

### Production
```bash
npm run build:prod      # Build for production
npm run deploy:clean    # Clean deployment with checks
npm run deploy:safe     # Deployment + post-verification
./deploy-production.sh  # Full automated deployment
```

---

## 🐛 Troubleshooting

### Common Issues

1. **Build Fails - Missing Dependencies**
   ```bash
   rm -rf node_modules package-lock.json
   npm ci
   ```

2. **API Routes Not Working**
   - Check environment variables in Vercel dashboard
   - Ensure `GROQ_API_KEY` is set correctly
   - Verify `SUPABASE_SERVICE_ROLE_KEY` has proper permissions

3. **Chat Not Responding**
   - Check browser console for errors
   - Verify Groq API key is valid
   - Test API endpoint: `https://your-app.vercel.app/api/chat`

4. **Database Connection Issues**
   - Verify Supabase URLs and keys
   - Check Supabase project is not paused
   - Ensure RLS policies allow access

### Debug Commands
```bash
# Test local build
npm run build:prod && npm run preview

# Check bundle size
npm run build:prod && ls -lh dist/assets/

# Test API locally (if using Vercel CLI)
vercel dev
```

---

## 🎯 Post-Deployment Verification

### Automated Tests
The deployment script includes automatic verification:
- ✅ HTTP response check
- ✅ Basic functionality test
- ⚠️ Manual verification recommended

### Manual Testing Checklist
1. **Frontend**
   - [ ] Dashboard loads without errors
   - [ ] Navigation works correctly
   - [ ] StockBot chat button appears

2. **StockBot Chat**
   - [ ] Chat panel opens
   - [ ] Can send messages
   - [ ] Receives AI responses
   - [ ] Quick actions work

3. **Data Integration**
   - [ ] Supabase connection working
   - [ ] Real data appears in charts
   - [ ] Filters function correctly

---

## 🚀 Performance Metrics

### Target Performance
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 3s

### Monitoring
- Use Vercel Analytics for performance metrics
- Monitor bundle size with each deployment
- Check Core Web Vitals in production

---

## 📞 Support

### Resources
- [Vercel Documentation](https://vercel.com/docs)
- [Groq API Docs](https://console.groq.com/docs)
- [Supabase Documentation](https://supabase.com/docs)

### Quick Links
- Vercel Dashboard: `https://vercel.com/dashboard`
- Groq Console: `https://console.groq.com/`
- Supabase Dashboard: `https://supabase.com/dashboard`

---

## 🎉 Success!

Once deployed, your app will be available at:
`https://your-project-name.vercel.app`

Features available:
- ✅ Philippine Retail Analytics Dashboard
- ✅ Groq-powered StockBot AI Assistant
- ✅ Real-time Supabase data integration
- ✅ Production-optimized performance