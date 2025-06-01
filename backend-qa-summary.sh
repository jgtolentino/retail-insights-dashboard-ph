#!/bin/bash

# Backend QA Summary Report
# Shows complete test results with pass/fail status

echo "═══════════════════════════════════════════════════════════"
echo "                 BACKEND QA TEST REPORT                     "
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Project: retail-insights-dashboard-ph"
echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Run the proper QA script and capture output
./run-backend-qa-proper.sh > /tmp/qa-output.txt 2>&1
exit_code=$?

# Display the output
cat /tmp/qa-output.txt

# Add recommendations based on results
echo ""
echo "📋 Recommendations:"
echo "───────────────────"

if grep -q "Unit Tests.*FAIL" /tmp/qa-output.txt; then
  echo "• Unit Tests Failed: Check localhost DNS resolution"
  echo "  Fix: Add '127.0.0.1 localhost' to /etc/hosts"
fi

if grep -q "API Health Check.*FAIL" /tmp/qa-output.txt; then
  echo "• API Health Check Failed: Server not running"
  echo "  Fix: Run 'npm run dev' to start the server"
fi

if grep -q "SQL Functions.*FAIL" /tmp/qa-output.txt; then
  echo "• SQL Functions Failed: Missing environment variables"
  echo "  Fix: Create .env file with VITE_SUPABASE_* variables"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"

# Return the same exit code
exit $exit_code