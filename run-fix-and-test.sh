#!/bin/bash
# Auto-fix environment issues and run backend QA tests

echo "🔧 Fixing Environment Issues..."
echo "==============================="

# 1. Fix DNS Resolution
echo "📌 Checking localhost resolution..."
if ! grep -q "127.0.0.1.*localhost" /etc/hosts; then
    echo "   → Adding localhost to /etc/hosts..."
    echo "127.0.0.1 localhost" | sudo tee -a /etc/hosts > /dev/null
    echo "   ✅ DNS fix applied"
else
    echo "   ✅ localhost already configured"
fi

# 2. Start Dev Server
echo ""
echo "🚀 Starting development server..."
# Check if server is already running
if lsof -i:5000 > /dev/null 2>&1; then
    echo "   ✅ Server already running on port 5000"
else
    echo "   → Starting npm dev server in background..."
    npm run dev > /tmp/dev-server.log 2>&1 &
    SERVER_PID=$!
    echo "   → Server PID: $SERVER_PID"
    echo "   → Waiting for server to start..."
    sleep 5
    
    # Verify server started
    if lsof -i:5000 > /dev/null 2>&1; then
        echo "   ✅ Server started successfully"
    else
        echo "   ❌ Server failed to start. Check /tmp/dev-server.log"
    fi
fi

# 3. Run Backend QA Tests
echo ""
echo "🧪 Running Backend QA Tests..."
echo "==============================="
./backend-qa-summary.sh

# Optional: Stop the server we started
if [ ! -z "$SERVER_PID" ]; then
    echo ""
    echo "🛑 Stopping dev server (PID: $SERVER_PID)..."
    kill $SERVER_PID 2>/dev/null
fi