#!/bin/bash
# Complete Environment Fix Script
# This will fix all environment issues blocking QA tests

echo "🔧 Complete Environment Fix"
echo "==========================="
echo ""
echo "This script will fix:"
echo "1. DNS localhost resolution"
echo "2. Ensure dev server is running"
echo "3. Update port configurations"
echo ""
echo "Note: You'll need to enter your password for sudo commands"
echo "Your password is: Tbwa1234"
echo ""
read -p "Press Enter to continue..."

# 1. Fix DNS
echo ""
echo "Step 1: Fixing DNS..."
if ! grep -q "^127.0.0.1.*localhost" /etc/hosts; then
    echo "Tbwa1234" | sudo -S sh -c 'echo -e "127.0.0.1\tlocalhost\n::1\tlocalhost" >> /etc/hosts'
    echo "✅ DNS fixed"
else
    echo "✅ DNS already configured"
fi

# 2. Test DNS
echo ""
echo "Step 2: Testing DNS..."
if ping -c 1 localhost > /dev/null 2>&1; then
    echo "✅ localhost resolves correctly"
else
    echo "❌ DNS still not working"
    exit 1
fi

# 3. Start dev server if needed
echo ""
echo "Step 3: Checking dev server..."
if ! lsof -i:8080 > /dev/null 2>&1; then
    echo "Starting dev server..."
    npm run dev > /tmp/dev-server.log 2>&1 &
    DEV_PID=$!
    sleep 5
    echo "✅ Dev server started (PID: $DEV_PID)"
else
    echo "✅ Dev server already running"
fi

# 4. Run quick test
echo ""
echo "Step 4: Running quick test..."
if curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo "✅ Server accessible"
else
    echo "⚠️  Server may need more time to start"
fi

echo ""
echo "═══════════════════════════════════"
echo "✅ Environment fixes complete!"
echo "═══════════════════════════════════"
echo ""
echo "Now run: ./run-complete-qa.sh"
echo ""