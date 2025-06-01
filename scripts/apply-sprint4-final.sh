#!/bin/bash

# Sprint 4 Migration - Final Automated Solution
# This script uses Supabase CLI to apply migrations

set -e  # Exit on error

echo "🚀 Sprint 4 Migration - Automated Execution"
echo "=========================================="
echo ""

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo "   Install with: brew install supabase/tap/supabase"
    exit 1
fi

echo "✅ Supabase CLI found at: $(which supabase)"
echo ""

# Project details
PROJECT_REF="lcoxtanyckjzyxxcsjzz"
MIGRATIONS_DIR="$(cd "$(dirname "$0")/../migrations" && pwd)"
COMBINED_SQL="$MIGRATIONS_DIR/sprint4_combined.sql"

# Check if combined SQL exists
if [ ! -f "$COMBINED_SQL" ]; then
    echo "❌ Combined SQL file not found!"
    echo "   Run: node scripts/apply-sprint4-supabase.js"
    exit 1
fi

echo "📄 Found migration file: $COMBINED_SQL"
echo "   Size: $(wc -l < "$COMBINED_SQL") lines"
echo ""

# Get database password from environment or prompt
if [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo "🔑 Database password needed!"
    echo "   Get it from: https://app.supabase.com/project/$PROJECT_REF/settings/database"
    echo "   (Look for the 'Connection string' section)"
    echo ""
    read -s -p "Enter database password: " DB_PASSWORD
    echo ""
else
    DB_PASSWORD="$SUPABASE_DB_PASSWORD"
fi

# Construct database URL
DB_URL="postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres"

echo "🔌 Connecting to database..."
echo ""

# Test connection first
if ! PGPASSWORD="$DB_PASSWORD" psql -h "db.${PROJECT_REF}.supabase.co" -U postgres -d postgres -c "SELECT version();" &> /dev/null; then
    echo "❌ Failed to connect to database!"
    echo "   Please check your password and try again."
    exit 1
fi

echo "✅ Database connection successful!"
echo ""

# Apply migrations
echo "⚡ Applying migrations..."
echo "========================"
echo ""

# Using psql directly for better control
PGPASSWORD="$DB_PASSWORD" psql -h "db.${PROJECT_REF}.supabase.co" -U postgres -d postgres < "$COMBINED_SQL"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Migrations applied successfully!"
    echo ""
    
    # Verify the changes
    echo "📊 Verifying changes..."
    echo ""
    
    PGPASSWORD="$DB_PASSWORD" psql -h "db.${PROJECT_REF}.supabase.co" -U postgres -d postgres -c "
    SELECT 'Tables' as type, COUNT(*) as count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('substitutions', 'request_behaviors')
    UNION ALL
    SELECT 'Functions' as type, COUNT(*) as count 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name LIKE 'get_%'
    AND routine_type = 'FUNCTION';
    "
    
    echo ""
    echo "✅ Migration completed!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Test the new functions in your application"
    echo "   2. Verify data in Supabase Dashboard"
    echo "   3. Update your frontend to use new features"
    echo ""
else
    echo ""
    echo "❌ Migration failed!"
    echo "   Check the error messages above for details."
    exit 1
fi