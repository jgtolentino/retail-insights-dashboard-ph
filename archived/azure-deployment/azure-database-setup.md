# Azure Database Integration Guide

## Option 1: Azure Database for PostgreSQL (Recommended)

### Create Azure PostgreSQL Database

```bash
# Variables
RESOURCE_GROUP="rg-retail-dashboard"
LOCATION="Southeast Asia"
SERVER_NAME="retail-insights-pgserver"
DB_NAME="retaildb"
ADMIN_USER="retailadmin"
ADMIN_PASSWORD="YourSecurePassword123!" # Change this!

# Create PostgreSQL server
az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $SERVER_NAME \
  --location "$LOCATION" \
  --admin-user $ADMIN_USER \
  --admin-password $ADMIN_PASSWORD \
  --sku-name Standard_B2s \
  --tier Burstable \
  --version 15 \
  --storage-size 32 \
  --public-access 0.0.0.0

# Create database
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $SERVER_NAME \
  --database-name $DB_NAME

# Configure firewall for Azure services
az postgres flexible-server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --name $SERVER_NAME \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Allow your IP (for migration)
az postgres flexible-server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --name $SERVER_NAME \
  --rule-name AllowMyIP \
  --start-ip-address YOUR_IP \
  --end-ip-address YOUR_IP
```

### Migrate Data from Supabase to Azure

```bash
# 1. Export from Supabase
SUPABASE_HOST="db.lcoxtanyckjzyxxcsjzz.supabase.co"
SUPABASE_DB="postgres"
SUPABASE_USER="postgres"
SUPABASE_PASSWORD="your-supabase-password"

pg_dump \
  -h $SUPABASE_HOST \
  -U $SUPABASE_USER \
  -d $SUPABASE_DB \
  --no-owner \
  --no-privileges \
  --exclude-schema=auth \
  --exclude-schema=storage \
  --exclude-schema=extensions \
  -f retail_backup.sql

# 2. Import to Azure PostgreSQL
AZURE_HOST="${SERVER_NAME}.postgres.database.azure.com"
psql \
  -h $AZURE_HOST \
  -U $ADMIN_USER \
  -d $DB_NAME \
  -f retail_backup.sql
```

## Option 2: Azure Cosmos DB for PostgreSQL (Distributed)

Good for scaling globally with multiple regions:

```bash
az cosmosdb create \
  --resource-group $RESOURCE_GROUP \
  --name retail-cosmos-pg \
  --kind PostgreSQL \
  --locations regionName="Southeast Asia" failoverPriority=0
```

## Option 3: Keep Supabase + Azure Private Endpoint

Create secure connection between Azure App Service and Supabase:

```bash
# Create Virtual Network
az network vnet create \
  --resource-group $RESOURCE_GROUP \
  --name vnet-retail \
  --address-prefix 10.0.0.0/16 \
  --subnet-name subnet-app \
  --subnet-prefix 10.0.1.0/24

# Integrate App Service with VNet
az webapp vnet-integration add \
  --resource-group $RESOURCE_GROUP \
  --name retail-insights-dashboard-ph \
  --vnet vnet-retail \
  --subnet subnet-app
```

## Connection String Updates

### Update your environment variables:

```env
# For Azure PostgreSQL
DATABASE_URL=postgresql://retailadmin:YourSecurePassword123!@retail-insights-pgserver.postgres.database.azure.com:5432/retaildb?sslmode=require

# Or keep Supabase and add for hybrid approach
VITE_SUPABASE_URL=https://lcoxtanyckjzyxxcsjzz.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
AZURE_PG_CONNECTION_STRING=your-azure-connection-string
```