#!/bin/bash

# Deploy SQL Functions Script
# This script applies the new SQL functions for location and time patterns

echo "🚀 Deploying SQL functions to Supabase..."

# Check if SUPABASE_URL and SUPABASE_ANON_KEY are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY environment variables must be set"
    echo "Please check your .env file or set these variables"
    exit 1
fi

# Function to execute SQL file
execute_sql() {
    local file_path=$1
    local function_name=$2
    
    echo "📄 Deploying $function_name..."
    
    if [ ! -f "$file_path" ]; then
        echo "❌ Error: SQL file not found: $file_path"
        return 1
    fi
    
    # Use psql to execute the SQL file
    # Note: You'll need to replace these connection details with your actual Supabase connection
    # This is a template - users need to configure their own connection
    
    echo "⚠️  Manual deployment required:"
    echo "   1. Copy the SQL from: $file_path"
    echo "   2. Execute it in your Supabase SQL editor"
    echo "   3. Or use psql with your connection string"
    echo ""
    cat "$file_path"
    echo ""
    echo "---"
    echo ""
}

# Deploy location distribution function
execute_sql "sql-functions/location_distribution_function.sql" "get_location_distribution"

# Deploy purchase patterns by time function
execute_sql "sql-functions/purchase_patterns_by_time_function.sql" "get_purchase_patterns_by_time"

echo "✅ SQL function deployment instructions provided"
echo ""
echo "📋 Next steps:"
echo "1. Execute the SQL functions in your Supabase database"
echo "2. Test the functions using the Supabase SQL editor"
echo "3. Verify the dashboard components are working"
echo ""
echo "🧪 Test queries:"
echo "SELECT * FROM get_location_distribution('2025-05-01T00:00:00Z', '2025-05-31T23:59:59Z');"
echo "SELECT * FROM get_purchase_patterns_by_time('2025-05-01T00:00:00Z', '2025-05-31T23:59:59Z');"