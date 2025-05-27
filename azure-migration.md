# Migrate Supabase to Azure PostgreSQL

## 1. Create Azure PostgreSQL
```bash
# Create resource group
az group create --name retail-analytics-rg --location eastus

# Create PostgreSQL server
az postgres server create \
  --resource-group retail-analytics-rg \
  --name retail-analytics-db \
  --admin-user pgadmin \
  --admin-password [YourPassword] \
  --sku-name B_Gen5_1 \
  --version 13
```

## 2. Export from Supabase
```bash
# Dump the database
pg_dump "postgresql://postgres.lcoxtanyckjzyxxcsjzz:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres" \
  --no-owner \
  --no-privileges \
  --exclude-schema=auth \
  --exclude-schema=storage \
  > retail_backup.sql
```

## 3. Import to Azure
```bash
# Import to Azure PostgreSQL
psql "host=retail-analytics-db.postgres.database.azure.com \
  port=5432 \
  dbname=postgres \
  user=pgadmin@retail-analytics-db \
  password=[YourPassword] \
  sslmode=require" \
  < retail_backup.sql
```

## 4. Update Dashboard Connection
```typescript
// In src/integrations/supabase/client.ts
const AZURE_PG_URL = "postgresql://pgadmin@retail-analytics-db:[PASSWORD]@retail-analytics-db.postgres.database.azure.com:5432/postgres";
```