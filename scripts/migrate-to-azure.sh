#!/bin/bash

# Supabase to Azure PostgreSQL Migration Script

echo "🔄 Supabase to Azure PostgreSQL Migration Tool"
echo "=============================================="

# Load environment variables if .env exists
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Prompt for credentials if not in environment
if [ -z "$SUPABASE_DB_PASSWORD" ]; then
  read -sp "Enter Supabase database password: " SUPABASE_DB_PASSWORD
  echo
fi

if [ -z "$AZURE_DB_PASSWORD" ]; then
  read -sp "Enter Azure PostgreSQL password: " AZURE_DB_PASSWORD
  echo
fi

# Configuration
SUPABASE_HOST="db.lcoxtanyckjzyxxcsjzz.supabase.co"
SUPABASE_DB="postgres"
SUPABASE_USER="postgres"
SUPABASE_PORT="5432"

# Azure Configuration - Update these!
AZURE_SERVER="retail-insights-pgserver"
AZURE_HOST="${AZURE_SERVER}.postgres.database.azure.com"
AZURE_DB="retaildb"
AZURE_USER="retailadmin"
AZURE_PORT="5432"

BACKUP_FILE="retail_backup_$(date +%Y%m%d_%H%M%S).sql"

echo "📥 Step 1: Exporting data from Supabase..."
PGPASSWORD=$SUPABASE_DB_PASSWORD pg_dump \
  -h $SUPABASE_HOST \
  -p $SUPABASE_PORT \
  -U $SUPABASE_USER \
  -d $SUPABASE_DB \
  --no-owner \
  --no-privileges \
  --no-comments \
  --if-exists \
  --clean \
  --exclude-schema=auth \
  --exclude-schema=storage \
  --exclude-schema=graphql \
  --exclude-schema=graphql_public \
  --exclude-schema=realtime \
  --exclude-schema=extensions \
  --exclude-schema=supabase_functions \
  --exclude-schema=pgbouncer \
  -f $BACKUP_FILE

if [ $? -ne 0 ]; then
  echo "❌ Export failed!"
  exit 1
fi

echo "✅ Export complete: $BACKUP_FILE"
echo "📊 Backup size: $(ls -lh $BACKUP_FILE | awk '{print $5}')"

echo ""
echo "📤 Step 2: Importing to Azure PostgreSQL..."
echo "Target: $AZURE_HOST"

PGPASSWORD=$AZURE_DB_PASSWORD psql \
  -h $AZURE_HOST \
  -p $AZURE_PORT \
  -U "${AZURE_USER}@${AZURE_SERVER}" \
  -d $AZURE_DB \
  -f $BACKUP_FILE

if [ $? -ne 0 ]; then
  echo "❌ Import failed!"
  echo "💡 Common issues:"
  echo "   - Check firewall rules in Azure"
  echo "   - Verify credentials"
  echo "   - Ensure database exists"
  exit 1
fi

echo "✅ Import complete!"

echo ""
echo "🔍 Step 3: Verifying migration..."

# Test query
PGPASSWORD=$AZURE_DB_PASSWORD psql \
  -h $AZURE_HOST \
  -p $AZURE_PORT \
  -U "${AZURE_USER}@${AZURE_SERVER}" \
  -d $AZURE_DB \
  -c "SELECT COUNT(*) as total_brands FROM brands;" \
  -c "SELECT COUNT(*) as total_products FROM products;" \
  -c "SELECT COUNT(*) as total_transactions FROM transactions;"

echo ""
echo "📝 Step 4: Update your application configuration:"
echo ""
echo "Add to your .env file:"
echo "AZURE_PG_CONNECTION_STRING=postgresql://${AZURE_USER}@${AZURE_SERVER}:${AZURE_DB_PASSWORD}@${AZURE_HOST}:5432/${AZURE_DB}?sslmode=require"
echo ""
echo "Or individual variables:"
echo "AZURE_PG_HOST=$AZURE_HOST"
echo "AZURE_PG_DATABASE=$AZURE_DB"
echo "AZURE_PG_USER=${AZURE_USER}@${AZURE_SERVER}"
echo "AZURE_PG_PORT=5432"
echo "AZURE_PG_SSL=true"

echo ""
echo "🎉 Migration complete!"
echo "📁 Backup saved as: $BACKUP_FILE"

# Optionally remove backup
read -p "Remove backup file? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  rm $BACKUP_FILE
  echo "🗑️  Backup removed"
fi