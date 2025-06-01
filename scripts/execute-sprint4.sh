#!/bin/bash
# Sprint 4 Migration Execution Script

SUPABASE_DB_URL="postgresql://postgres:[YOUR-DB-PASSWORD]@db.lcoxtanyckjzyxxcsjzz.supabase.co:5432/postgres"

echo "🚀 Executing Sprint 4 migrations..."

# Execute combined migration
psql "$SUPABASE_DB_URL" < migrations/sprint4_combined.sql

if [ $? -eq 0 ]; then
  echo "✅ Migrations applied successfully!"
else
  echo "❌ Migration failed. Please check the error messages above."
fi
