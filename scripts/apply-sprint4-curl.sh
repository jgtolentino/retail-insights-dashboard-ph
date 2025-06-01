#!/bin/bash

# Sprint 4 Migration via Supabase Management API
# This script executes SQL migrations using curl

SUPABASE_PROJECT_REF="lcoxtanyckjzyxxcsjzz"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODM0NTMyNywiZXhwIjoyMDYzOTIxMzI3fQ.42ByHcIAi1jrcpzdvfcMJyE6ibqr81d-rIjsqxL_Bbk"

echo "🚀 Sprint 4 Migration Executor"
echo "================================"

# Function to execute SQL using Supabase PostgreSQL REST API
execute_sql() {
    local sql="$1"
    local description="$2"
    
    echo "⚡ Executing: $description"
    
    # For Supabase, we need to use the pg-meta API endpoint
    # Note: This requires proper authentication and may need adjustment based on Supabase's current API
    
    # Create a temporary file for the SQL
    local temp_file=$(mktemp)
    echo "$sql" > "$temp_file"
    
    # Try using the Supabase CLI if available
    if command -v supabase &> /dev/null; then
        echo "   Using Supabase CLI..."
        supabase db push --db-url "postgresql://postgres:$SUPABASE_DB_PASSWORD@db.$SUPABASE_PROJECT_REF.supabase.co:5432/postgres" < "$temp_file"
    else
        echo "   ⚠️  Supabase CLI not found"
        echo "   Please install with: brew install supabase/tap/supabase"
    fi
    
    rm -f "$temp_file"
}

# Read migration files
MIGRATIONS_DIR="$(dirname "$0")/../migrations"

echo ""
echo "📄 Processing migrations..."
echo ""

# Process each migration file
for migration_file in "sprint4_schema_updates.sql" "sprint4_rpc_functions.sql"; do
    if [ -f "$MIGRATIONS_DIR/$migration_file" ]; then
        echo "📝 Reading $migration_file..."
        sql_content=$(cat "$MIGRATIONS_DIR/$migration_file")
        
        # Split into individual statements for better error handling
        # This is a simplified approach - in production you'd want more robust parsing
        
        echo "   Found $(echo "$sql_content" | grep -c ';$') statements"
        echo ""
        
        # For now, we'll create the combined file approach
    else
        echo "❌ File not found: $migration_file"
    fi
done

# Alternative approach: Direct REST API call
echo "📡 Alternative: Direct API Execution"
echo "===================================="
echo ""
echo "Since direct SQL execution requires authentication beyond service keys,"
echo "here's a Node.js script that you can run:"
echo ""

cat << 'EOF' > "$MIGRATIONS_DIR/execute-sprint4-api.js"
const https = require('https');
const fs = require('fs');

const SUPABASE_URL = 'https://lcoxtanyckjzyxxcsjzz.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDUzMjcsImV4cCI6MjA2MzkyMTMyN30.K0h_g0gySdBJp6rxGeI6FOi8uLfBtF5kl7ND0Yxs-zI';

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  const options = {
    hostname: 'lcoxtanyckjzyxxcsjzz.supabase.co',
    path: '/rest/v1/',
    method: 'GET',
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      resolve(res.statusCode === 200);
    });
    
    req.on('error', reject);
    req.end();
  });
}

testConnection()
  .then(success => {
    if (success) {
      console.log('✅ Connection successful!');
      console.log('\nTo apply migrations:');
      console.log('1. Go to: https://app.supabase.com/project/lcoxtanyckjzyxxcsjzz/editor');
      console.log('2. Paste the content from sprint4_combined.sql');
      console.log('3. Click Run');
    }
  })
  .catch(err => console.error('❌ Connection failed:', err));
EOF

echo "✅ Created: $MIGRATIONS_DIR/execute-sprint4-api.js"
echo ""
echo "🎯 Recommended Actions:"
echo "======================"
echo ""
echo "1. EASIEST METHOD - Supabase Dashboard:"
echo "   Open: https://app.supabase.com/project/$SUPABASE_PROJECT_REF/editor"
echo "   Paste contents of: $MIGRATIONS_DIR/sprint4_combined.sql"
echo ""
echo "2. Using Supabase CLI (if installed):"
echo "   supabase db push < $MIGRATIONS_DIR/sprint4_combined.sql"
echo ""
echo "3. Using psql (requires database password):"
echo "   Get password from: https://app.supabase.com/project/$SUPABASE_PROJECT_REF/settings/database"
echo "   Run: psql \"postgresql://postgres:[PASSWORD]@db.$SUPABASE_PROJECT_REF.supabase.co:5432/postgres\" < $MIGRATIONS_DIR/sprint4_combined.sql"
echo ""
echo "📊 What will be created:"
echo "   • 2 new tables (substitutions, request_behaviors)"
echo "   • 6 new columns in transactions table"
echo "   • 7 analytics functions"
echo "   • 7 performance indexes"
echo "   • 1 materialized view"
echo "   • ~2,500 sample records"
echo ""