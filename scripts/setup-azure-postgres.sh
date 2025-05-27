#!/bin/bash

# Quick Azure PostgreSQL Setup Script

echo "🚀 Azure PostgreSQL Quick Setup"
echo "==============================="

# Configuration
RESOURCE_GROUP="rg-retail-dashboard"
LOCATION="Southeast Asia"
SERVER_NAME="retail-insights-pgserver"
DB_NAME="retaildb"
ADMIN_USER="retailadmin"

# Generate secure password
ADMIN_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

echo "📝 Configuration:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Location: $LOCATION"
echo "  Server: $SERVER_NAME"
echo "  Database: $DB_NAME"
echo "  Admin User: $ADMIN_USER"
echo "  Admin Password: $ADMIN_PASSWORD"
echo ""
echo "⚠️  SAVE THIS PASSWORD - YOU'LL NEED IT!"
echo ""

read -p "Continue with setup? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  exit 1
fi

# Check if logged into Azure
echo "🔐 Checking Azure login..."
az account show &> /dev/null
if [ $? -ne 0 ]; then
  echo "📝 Please login to Azure..."
  az login
fi

# Create resource group
echo "📦 Creating resource group..."
az group create --name $RESOURCE_GROUP --location "$LOCATION"

# Create PostgreSQL Flexible Server
echo "🐘 Creating Azure PostgreSQL Flexible Server..."
echo "This may take 5-10 minutes..."

az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $SERVER_NAME \
  --location "$LOCATION" \
  --admin-user $ADMIN_USER \
  --admin-password "$ADMIN_PASSWORD" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 15 \
  --storage-size 32 \
  --backup-retention 7 \
  --public-access 0.0.0.0

# Create database
echo "📊 Creating database..."
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $SERVER_NAME \
  --database-name $DB_NAME

# Get current IP
MY_IP=$(curl -s https://api.ipify.org)
echo "🔥 Adding firewall rule for your IP: $MY_IP"

# Add firewall rules
az postgres flexible-server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --name $SERVER_NAME \
  --rule-name AllowMyIP \
  --start-ip-address $MY_IP \
  --end-ip-address $MY_IP

az postgres flexible-server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --name $SERVER_NAME \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Get connection details
FQDN="${SERVER_NAME}.postgres.database.azure.com"

echo ""
echo "✅ Setup Complete!"
echo ""
echo "📋 Connection Details:"
echo "===================="
echo "Host: $FQDN"
echo "Port: 5432"
echo "Database: $DB_NAME"
echo "Username: $ADMIN_USER"
echo "Password: $ADMIN_PASSWORD"
echo ""
echo "🔗 Connection String:"
echo "postgresql://${ADMIN_USER}:${ADMIN_PASSWORD}@${FQDN}:5432/${DB_NAME}?sslmode=require"
echo ""
echo "📝 psql Command:"
echo "PGPASSWORD='$ADMIN_PASSWORD' psql -h $FQDN -U $ADMIN_USER -d $DB_NAME"
echo ""
echo "💾 Save these details to your .env file:"
echo "AZURE_PG_HOST=$FQDN"
echo "AZURE_PG_DATABASE=$DB_NAME"
echo "AZURE_PG_USER=$ADMIN_USER"
echo "AZURE_PG_PASSWORD=$ADMIN_PASSWORD"
echo "AZURE_PG_CONNECTION_STRING=postgresql://${ADMIN_USER}:${ADMIN_PASSWORD}@${FQDN}:5432/${DB_NAME}?sslmode=require"
echo ""
echo "🚀 Next Steps:"
echo "1. Run ./scripts/migrate-to-azure.sh to migrate data from Supabase"
echo "2. Update your app to use the Azure connection string"
echo "3. Deploy to Azure App Service"