#!/bin/bash
# Patcha Apply Script - Apply fixes from .patcha-fixes directory

echo "🩹 Patcha Auto-Fix System"
echo "========================"

# Check if fix ID provided
if [ -z "$1" ]; then
    echo "Usage: ./patcha-apply.sh <fix-id>"
    echo ""
    echo "Available fixes:"
    for fix in .patcha-fixes/*.yaml; do
        if [ -f "$fix" ]; then
            fix_id=$(grep "^fix_id:" "$fix" | cut -d' ' -f2)
            desc=$(grep "^description:" "$fix" | cut -d'"' -f2)
            echo "  • $fix_id - $desc"
        fi
    done
    exit 1
fi

FIX_ID=$1
FIX_FILE=".patcha-fixes/${FIX_ID}.yaml"

if [ ! -f "$FIX_FILE" ]; then
    echo "❌ Fix not found: $FIX_ID"
    exit 1
fi

echo "📋 Applying fix: $FIX_ID"
echo ""

# Apply DNS fix if needed
if grep -q "1_dns_resolution" "$FIX_FILE"; then
    echo "🔧 Fixing DNS resolution..."
    if ! grep -q "127.0.0.1.*localhost" /etc/hosts; then
        echo "127.0.0.1 localhost" | sudo tee -a /etc/hosts > /dev/null
        echo "::1 localhost" | sudo tee -a /etc/hosts > /dev/null
        echo "✅ DNS fix applied"
    else
        echo "✅ DNS already configured"
    fi
fi

# Apply port fix if needed
if grep -q "2_update_health_check_port" "$FIX_FILE"; then
    echo ""
    echo "🔧 Updating health check port..."
    sed -i '' 's/localhost:5000/localhost:8080/g' run-backend-qa-proper.sh
    echo "✅ Port updated to 8080"
fi

# Run validation
echo ""
echo "🧪 Running validation..."
./backend-qa-summary.sh

echo ""
echo "🩹 Patcha fix complete!"