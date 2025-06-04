# Sprint 4 + Edge Device Deployment Guide 🚀

## 📋 Overview

This guide covers the complete deployment of Sprint 4 enhancements plus edge device integration for Project Scout. This update provides comprehensive backend fixes, advanced analytics, and IoT edge computing capabilities.

## 🎯 What This Update Includes

### ✅ **Complete Backend Fixes**

- **RLS (Row Level Security)** - Fixed for all tables including new edge device tables
- **Advanced RPC Functions** - 7 new analytics functions for dashboard insights
- **Enhanced Transaction Schema** - New columns for behavioral analytics
- **Materialized Views** - Performance optimization for large datasets
- **Proper Permissions** - All functions have correct access controls

### ✅ **Edge Device Integration**

- **4 New Tables** - devices, device_health, product_detections, edge_logs
- **Auto-Registration** - Hardware fingerprinting for device identification
- **Real-time Monitoring** - CPU, memory, temperature tracking
- **AI Product Detection** - Computer vision with confidence scoring
- **Local NLP Processing** - Ollama + spaCy for language understanding
- **Centralized Logging** - Multi-level logging with structured data

### ✅ **Dashboard Enhancements**

- **Transaction Trends** - Enhanced with payment methods, request types
- **Consumer Behavior** - Substitution patterns, checkout duration analysis
- **AI Insights** - NLP transcription analysis, gesture detection
- **Real-time Data** - Live updates from edge devices
- **Advanced Filtering** - Cascading filters with proper data validation

---

## 🔧 **Step 1: Apply Database Migrations**

### **Option A: Manual SQL Execution (Recommended)**

1. **Open Supabase SQL Editor:**

   ```
   https://supabase.com/dashboard/project/lcoxtanyckjzyxxcsjzz/sql
   ```

2. **Execute Sprint 4 Schema Updates:**

   - Copy contents of `migrations/sprint4_combined.sql`
   - Paste in SQL editor and execute
   - Watch for success messages

3. **Execute Edge Device Schema:**
   - Copy contents of `create_missing_edge_tables.sql`
   - Paste in SQL editor and execute
   - Verify all 4 edge tables are created

### **Option B: Automated Script**

```bash
# Set your Supabase service role key
export SUPABASE_SERVICE_ROLE_KEY="your_actual_service_role_key"

# Run migrations
npm run db:migrate
```

---

## 🧪 **Step 2: Verify Database Setup**

### **Test Schema Verification:**

```bash
node verify_edge_schema.cjs
```

**Expected Output:**

```
✅ Existing tables: 13
❌ Missing tables: 0
🎉 Schema is ready for edge device integration!
```

### **Test Integration:**

```bash
node test_edge_integration.cjs
```

**Expected Output:**

```
📋 Test Results Summary
========================
✅ Device Registration
✅ Health Monitoring
✅ Product Detection
✅ Logging
✅ Transactions
✅ Data Queries

📊 Overall Result: 6/6 tests passed
```

---

## 🏗️ **Step 3: Deploy Frontend Updates**

### **Build and Deploy:**

```bash
# Install dependencies
npm install

# Build for production
npm run build:prod

# Deploy to Vercel
npm run deploy:safe
```

### **Verify Deployment:**

```bash
# Check deployment status
npm run qa:finalize

# Verify all functions work
curl https://your-deployment-url.vercel.app/api/health
```

---

## 🔧 **Step 4: Configure Edge Devices**

### **For Raspberry Pi 5 Deployment:**

1. **Get Supabase Keys:**

   ```
   https://supabase.com/dashboard/project/lcoxtanyckjzyxxcsjzz/settings/api
   ```

2. **Update Edge Configuration:**

   ```bash
   # Edit .env.edge file
   SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key
   SUPABASE_ANON_KEY=your_actual_anon_key
   ```

3. **Deploy to Edge Devices:**

   ```bash
   # Copy files to Raspberry Pi
   scp edge_client.py .env.edge edge_device_config.json pi@device_ip:~/

   # Run installation
   ssh pi@device_ip
   chmod +x install_edge_client.sh
   ./install_edge_client.sh
   ```

---

## 📊 **Step 5: Dashboard Features Now Available**

### **Transaction Trends**

- ✅ Payment method analysis (cash, GCash, Maya, credit)
- ✅ Request type breakdown (branded, unbranded, pointing)
- ✅ Checkout duration insights
- ✅ Real-time transaction volume

### **Product Mix & SKU Info**

- ✅ AI-detected product confidence scores
- ✅ Substitution pattern analysis
- ✅ Brand switching behavior
- ✅ Category performance metrics

### **Consumer Behavior & Preference Signals**

- ✅ NLP transcription analysis
- ✅ Gesture usage tracking
- ✅ Clarification count metrics
- ✅ Suggestion acceptance rates

### **Consumer Profiling**

- ✅ Age distribution from edge AI
- ✅ Gender detection analytics
- ✅ Behavioral segmentation
- ✅ Purchase pattern analysis

### **AI Recommendation Panel**

- ✅ Substitution recommendations
- ✅ Checkout optimization insights
- ✅ Customer behavior predictions
- ✅ Real-time business intelligence

---

## 🔧 **Available RPC Functions**

### **Analytics Functions:**

```sql
-- Substitution pattern analysis
SELECT * FROM get_substitution_patterns('2024-01-01', '2024-12-31');

-- Request behavior stats
SELECT * FROM get_request_behavior_stats();

-- Checkout duration analysis
SELECT * FROM get_checkout_duration_analysis();

-- Payment method insights
SELECT * FROM get_payment_method_analysis();

-- NLP transcription insights
SELECT * FROM get_transcription_insights();

-- Enhanced daily trends
SELECT * FROM get_daily_trends_enhanced();

-- Brand substitution impact
SELECT * FROM get_top_brands_with_substitution_impact();
```

### **Edge Device Functions:**

- Device auto-registration with hardware fingerprinting
- Real-time health monitoring and alerting
- AI product detection with confidence scoring
- Centralized logging with structured metadata
- Transaction linking with device identification

---

## 🔒 **Security Features**

### **Row Level Security (RLS)**

- ✅ All tables have proper RLS policies
- ✅ Read access for authenticated users
- ✅ Write access restricted to service roles
- ✅ Edge devices use service role for operations

### **API Security**

- ✅ HTTPS/WSS encryption for all connections
- ✅ Hardware-based device authentication
- ✅ Rate limiting on API endpoints
- ✅ Audit logging for all operations

---

## 🔧 **Troubleshooting**

### **Database Issues:**

```bash
# Check table existence
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

# Verify RLS policies
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

# Test function permissions
SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';
```

### **Edge Device Issues:**

```bash
# Check device logs
sudo journalctl -u project-scout-edge -f

# Test network connectivity
curl https://lcoxtanyckjzyxxcsjzz.supabase.co

# Verify device registration
node -e "console.log(require('./edge_device_config.json'))"
```

### **Frontend Issues:**

```bash
# Check build errors
npm run build

# Verify environment variables
npm run verify:env

# Test API connections
npm run verify:supabase
```

---

## 📈 **Performance Monitoring**

### **Database Performance:**

- Materialized views for fast aggregations
- Optimized indexes on all query paths
- Auto-cleanup for log tables (30-day retention)
- Connection pooling for edge devices

### **Edge Device Monitoring:**

- Real-time health metrics (CPU, memory, temperature)
- Network connectivity status
- Battery level monitoring (if applicable)
- Automatic offline data sync

### **Dashboard Performance:**

- Client-side caching for static data
- Lazy loading for heavy components
- Real-time updates via WebSocket connections
- Optimized SQL queries with proper indexing

---

## 🚀 **Post-Deployment Checklist**

### **Backend Verification:**

- [ ] All 13 database tables exist and accessible
- [ ] All 7 RPC functions execute without errors
- [ ] RLS policies allow proper read/write access
- [ ] Edge device tables accept data insertions
- [ ] Materialized views refresh successfully

### **Frontend Verification:**

- [ ] Dashboard loads without JavaScript errors
- [ ] All charts render with real data
- [ ] Filters work with cascading updates
- [ ] Real-time data updates are visible
- [ ] Mobile responsiveness works correctly

### **Edge Device Verification:**

- [ ] Devices auto-register on first connection
- [ ] Health monitoring data appears in dashboard
- [ ] Product detections are recorded correctly
- [ ] Logs are centralized and searchable
- [ ] Transaction linking works properly

### **Security Verification:**

- [ ] API keys are properly configured
- [ ] RLS prevents unauthorized access
- [ ] Edge devices authenticate correctly
- [ ] All connections use HTTPS/WSS
- [ ] Audit logs capture all operations

---

## 📞 **Support & Next Steps**

### **Immediate Actions:**

1. ✅ Apply database migrations in Supabase
2. ✅ Deploy frontend updates to Vercel
3. ✅ Configure edge devices with proper API keys
4. ✅ Monitor deployment for any issues

### **Future Enhancements:**

- Multi-tenant support for franchise operations
- Advanced ML models for demand forecasting
- Integration with additional POS systems
- Mobile app for field technicians
- Advanced reporting and export features

---

**🎉 Deployment Complete!**

Your Project Scout platform now includes:

- ✅ **Complete backend with advanced analytics**
- ✅ **Edge computing capabilities**
- ✅ **Real-time monitoring and insights**
- ✅ **Production-ready security and performance**

**Ready for enterprise retail deployment across Philippine markets!** 🇵🇭

---

_Last Updated: 2025-06-04 | Version: 4.1 | Status: Production Ready_
