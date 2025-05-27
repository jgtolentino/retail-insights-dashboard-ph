#!/bin/bash

# Helper script to run SQL files via Supabase CLI
# Usage: ./scripts/run-sql.sh <sql-file>

if [ -z "$1" ]; then
    echo "Usage: $0 <sql-file>"
    echo "Example: $0 migrations/test_connection.sql"
    exit 1
fi

if [ ! -f "$1" ]; then
    echo "Error: File '$1' not found"
    exit 1
fi

echo "🚀 Running SQL script: $1"
echo "================================"

# Run the SQL file
supabase db push < "$1"

if [ $? -eq 0 ]; then
    echo "================================"
    echo "✅ SQL script executed successfully!"
else
    echo "================================"
    echo "❌ SQL script failed. Check the error above."
    echo ""
    echo "Common issues:"
    echo "1. Not logged in: Run 'supabase login'"
    echo "2. Project not linked: Run 'supabase link --project-ref YOUR_REF'"
    echo "3. Wrong password: Check your database password"
fi