# Quick Reference - Retail Insights Dashboard

## 🔑 Environment Variables (Copy to .env)

```bash
VITE_SUPABASE_URL=https://lcoxtanyckjzyxxcsjzz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY4ODU3NjMsImV4cCI6MjAzMjQ2MTc2M30.GcLZ8W2ipQKn_BdahJlITME49IITWNkEzBcRPx_BTWM
```

## 🚀 Common Commands

```bash
# Run Backend QA
./pulser-qa-backend.sh

# Run Full QA Suite
node ./pulser-task-runner-v2.js run qa-full

# Start Dev Server
npm run dev

# Deploy
node ./pulser-task-runner-v2.js run deploy
```

## ✅ Pre-configured

- ✅ All npm dependencies installed
- ✅ Supabase client configured
- ✅ 109 products in database
- ✅ Pulser agents ready
- ✅ Test scripts available

## 📊 Database Info

- **URL**: https://lcoxtanyckjzyxxcsjzz.supabase.co
- **Tables**: products, transactions, stores, brands, customers
- **Connection**: Working via @supabase/supabase-js

---

_All dependencies installed. Just create .env and run!_
