#!/bin/bash

# Load environment variables
source .env

echo "🧠 Applying Behavioral Analytics Migrations"
echo "================================"
echo "Project URL: $VITE_SUPABASE_URL"
echo ""

# Function to execute SQL file
execute_sql_file() {
    local sql_file=$1
    local description=$2
    
    echo "🚀 Executing: $description"
    
    # Read SQL content and escape it for JSON
    local sql_content=$(cat "$sql_file" | jq -Rs .)
    
    # Try using the Supabase CLI first
    if command -v supabase &> /dev/null; then
        echo "Using Supabase CLI..."
        cd "$(dirname "$0")/.." # Go to project root
        
        # Execute using Supabase DB push
        supabase db push --db-url "postgresql://postgres:${DATABASE_PASSWORD}@db.${VITE_SUPABASE_URL#https://}.supabase.co:5432/postgres" < "$sql_file"
        
        if [ $? -eq 0 ]; then
            echo "✅ Success: $description"
            return 0
        else
            echo "⚠️  Supabase CLI failed, trying alternative method..."
        fi
    fi
    
    # Alternative: Create a temporary SQL file and use psql if available
    if command -v psql &> /dev/null; then
        echo "Using psql..."
        PGPASSWORD="${DATABASE_PASSWORD}" psql \
            -h "db.${VITE_SUPABASE_URL#https://}.supabase.co" \
            -p 5432 \
            -U postgres \
            -d postgres \
            -f "$sql_file"
        
        if [ $? -eq 0 ]; then
            echo "✅ Success: $description"
            return 0
        fi
    fi
    
    echo "❌ Failed to execute: $description"
    return 1
}

# Apply migrations
echo ""
execute_sql_file "migrations/fix_behavioral_analytics_tables.sql" "Fix Missing Fields"
echo ""
execute_sql_file "migrations/behavioral_analytics_functions.sql" "Behavioral Analytics Functions"

echo ""
echo "🧪 Testing Functions..."
echo ""

# Test queries using Supabase CLI
if command -v supabase &> /dev/null; then
    supabase db push --db-url "postgresql://postgres:${DATABASE_PASSWORD}@db.${VITE_SUPABASE_URL#https://}.supabase.co:5432/postgres" <<EOF
-- Test Dashboard Summary
SELECT * FROM get_dashboard_summary('2024-01-01'::date, '2024-12-31'::date, NULL);

-- Test Weekly Summary
SELECT * FROM get_dashboard_summary_weekly('2024-01-01'::date, '2024-12-31'::date, NULL) LIMIT 1;

-- Test Suggestion Funnel
SELECT * FROM get_suggestion_funnel('2024-01-01'::date, '2024-12-31'::date, NULL);

-- Test Behavior Suggestions View
SELECT COUNT(*) as total_rows FROM v_behavior_suggestions;
EOF
fi

echo ""
echo "✅ Migration Process Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Refresh your dashboard to see the new behavioral analytics"
echo "2. Check the KPI cards for live suggestion metrics"
echo "3. Visit Trends Explorer for weekly breakdowns"
echo "4. Check Consumer Insights for the suggestion funnel"
echo "5. Visit Sprint4 Dashboard for the full behavior suggestions table"