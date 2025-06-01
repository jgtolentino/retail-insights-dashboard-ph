#!/bin/bash

# Direct SQL execution using Supabase SQL Editor API
# This uses the Management API to execute SQL directly

# Load environment variables
source .env

PROJECT_REF="lcoxtanyckjzyxxcsjzz"
SUPABASE_URL="$VITE_SUPABASE_URL"
SERVICE_KEY="$SUPABASE_SERVICE_ROLE_KEY"

echo "🧠 Applying Behavioral Analytics via Direct SQL"
echo "=============================================="
echo ""

# Function to execute SQL via the SQL Editor API
execute_sql() {
    local sql_content="$1"
    local description="$2"
    
    echo "🚀 Executing: $description"
    
    # Use the Supabase REST API to execute SQL
    response=$(curl -s -X POST \
        "${SUPABASE_URL}/rest/v1/rpc" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${SERVICE_KEY}" \
        -H "apikey: ${SERVICE_KEY}" \
        -d @- <<EOF
{
  "query": $(echo "$sql_content" | jq -Rs .)
}
EOF
    )
    
    if [ $? -eq 0 ]; then
        echo "✅ Request sent for: $description"
        echo "Response: ${response:0:100}..."
    else
        echo "❌ Failed to execute: $description"
    fi
    echo ""
}

# Read SQL files and execute them
echo "📁 Reading SQL files..."
echo ""

# Fix missing fields
FIX_FIELDS_SQL=$(cat migrations/fix_behavioral_analytics_tables.sql)
execute_sql "$FIX_FIELDS_SQL" "Fix Missing Fields"

# Behavioral analytics functions
FUNCTIONS_SQL=$(cat migrations/behavioral_analytics_functions.sql)
execute_sql "$FUNCTIONS_SQL" "Behavioral Analytics Functions"

echo ""
echo "🎯 Manual Steps Required:"
echo "========================"
echo ""
echo "Since direct SQL execution is limited, please:"
echo ""
echo "1. Go to your Supabase Dashboard: ${SUPABASE_URL}"
echo "2. Navigate to SQL Editor"
echo "3. Copy and paste the contents of these files:"
echo "   - migrations/fix_behavioral_analytics_tables.sql"
echo "   - migrations/behavioral_analytics_functions.sql"
echo "4. Execute them in order"
echo ""
echo "Or use the Supabase CLI with:"
echo "  supabase db push < migrations/fix_behavioral_analytics_tables.sql"
echo "  supabase db push < migrations/behavioral_analytics_functions.sql"
echo ""
echo "Once complete, your behavioral analytics will be ready!"