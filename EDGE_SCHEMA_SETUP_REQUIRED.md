# 🔧 Edge Device Schema Setup Required

## 📊 Current Status

The Project Scout Supabase schema verification shows that **4 edge device tables are missing** and need to be created before deploying edge devices.

### ✅ **Existing Tables (Ready):**

- `transactions` - For sale transaction data
- `transaction_items` - For individual transaction items
- `products` - Product catalog
- `brands` - Brand information
- `stores` - Store locations

### ❌ **Missing Tables (Required for Edge Devices):**

- `devices` - Device registration and management
- `device_health` - Device monitoring and health metrics
- `product_detections` - AI-detected products from edge devices
- `edge_logs` - Device logging and troubleshooting

---

## 🚀 **Step-by-Step Setup Instructions**

### **Step 1: Create Missing Tables in Supabase**

1. **Open Supabase SQL Editor:**

   ```
   https://app.supabase.com/project/alxbucsacdxxwaibdxcf/sql
   ```

2. **Copy and paste the SQL from `create_missing_edge_tables.sql`**
3. **Execute the SQL** to create all 4 missing tables with:
   - Proper indexes for performance
   - Row Level Security (RLS) policies
   - Foreign key relationships
   - Auto-cleanup functions

### **Step 2: Verify Schema**

After creating the tables, run verification:

```bash
node verify_edge_schema.cjs
```

Expected output should show:

```
✅ Existing tables: 9
❌ Missing tables: 0
🎉 Schema is ready for edge device integration!
```

### **Step 3: Deploy Edge Devices**

Once schema is ready, you can deploy edge devices using:

```bash
# On each Raspberry Pi
./install_edge_client.sh
```

---

## 📋 **Table Details**

### **1. `devices` Table**

```sql
-- Device registration and management
- device_id (TEXT, UNIQUE) - Hardware-based unique identifier
- device_type (TEXT) - Default: 'RaspberryPi5'
- firmware_version (TEXT) - Current firmware version
- store_id (TEXT) - Links to stores table
- status (TEXT) - 'active', 'inactive', 'maintenance'
- registration_time (TIMESTAMPTZ) - When device was first registered
- last_seen (TIMESTAMPTZ) - Last communication time
- metadata (JSONB) - Additional device information
```

### **2. `device_health` Table**

```sql
-- Device monitoring and health metrics
- device_id (TEXT) - Links to devices table
- cpu_usage (DECIMAL) - CPU utilization percentage
- memory_usage (DECIMAL) - RAM usage percentage
- disk_usage (DECIMAL) - Storage usage percentage
- temperature (DECIMAL) - CPU temperature (Celsius)
- uptime_seconds (BIGINT) - Device uptime
- network_connected (BOOLEAN) - Network status
- battery_level (DECIMAL) - Battery percentage (if applicable)
```

### **3. `product_detections` Table**

```sql
-- AI-detected products from edge devices
- device_id (TEXT) - Source device
- store_id (TEXT) - Store location
- brand_detected (TEXT) - Detected brand name
- confidence_score (DECIMAL) - AI confidence (0.0-1.0)
- customer_age (INTEGER) - Customer age estimate
- customer_gender (TEXT) - 'Male', 'Female', 'Other'
- image_path (TEXT) - Optional image storage path
- detected_at (TIMESTAMPTZ) - Detection timestamp
```

### **4. `edge_logs` Table**

```sql
-- Device logging and troubleshooting
- device_id (TEXT) - Source device
- log_level (TEXT) - 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'
- message (TEXT) - Log message content
- component (TEXT) - System component name
- error_code (TEXT) - Error code if applicable
- timestamp (TIMESTAMPTZ) - Log entry time
- metadata (JSONB) - Additional log context
```

---

## 🔐 **Security & Permissions**

### **Row Level Security (RLS)**

All tables include RLS policies:

- **Read access**: Enabled for all authenticated users
- **Insert/Update**: Enabled for service role (edge devices)
- **Delete**: Restricted to admin users only

### **API Keys Required**

Edge devices need these Supabase keys:

- `SUPABASE_ANON_KEY` - For basic authentication
- `SUPABASE_SERVICE_ROLE_KEY` - For write operations

Get these keys from:

```
https://app.supabase.com/project/alxbucsacdxxwaibdxcf/settings/api
```

---

## 🎯 **Benefits After Setup**

### **Automated Device Management**

- Auto-registration when devices first send data
- Real-time health monitoring
- Automatic offline data sync
- Hardware-based unique device IDs

### **Advanced Analytics**

- AI-powered product detection
- Customer behavior analysis
- Device performance tracking
- Real-time store insights

### **Operational Excellence**

- Centralized device monitoring
- Automated health alerts
- Remote troubleshooting via logs
- Scalable edge infrastructure

---

## 🔧 **Troubleshooting**

### **If SQL Execution Fails:**

1. Check you're logged in as admin/owner in Supabase
2. Verify Project Scout project permissions
3. Try executing statements one by one
4. Check for naming conflicts with existing objects

### **After Table Creation:**

1. Verify RLS policies are enabled
2. Test insert permissions with service role key
3. Confirm foreign key relationships work
4. Check indexes are created properly

### **Edge Device Connection Issues:**

1. Verify Supabase API keys are correct
2. Check network connectivity to Supabase
3. Ensure device_id generation is working
4. Monitor edge_logs table for error messages

---

## 📞 **Next Steps**

1. **Create the missing tables** using the SQL file
2. **Update `.env.edge`** with your Supabase service role key
3. **Test edge device deployment** on one Raspberry Pi
4. **Monitor device registration** in Project Scout dashboard
5. **Scale to multiple devices** once testing is successful

---

**🔗 Quick Links:**

- **Supabase SQL Editor**: https://app.supabase.com/project/alxbucsacdxxwaibdxcf/sql
- **API Keys**: https://app.supabase.com/project/alxbucsacdxxwaibdxcf/settings/api
- **Project Dashboard**: https://app.supabase.com/project/alxbucsacdxxwaibdxcf

**The edge device infrastructure is ready to deploy once these 4 tables are created in Supabase!** 🚀
