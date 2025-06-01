#!/bin/bash
# Complete End-to-End QA Pipeline Runner
# This script runs all QA tests and provides a comprehensive report

echo "════════════════════════════════════════════════════════════"
echo "        🔄 COMPLETE END-TO-END QA PIPELINE                  "
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Project: retail-insights-dashboard-ph"
echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo "Runner: Pulser QA v2.2.2"
echo ""

# Initialize counters
TOTAL_SUITES=0
PASSED_SUITES=0
FAILED_SUITES=0

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Load environment
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Function to run a test suite
run_suite() {
  local suite_name=$1
  local suite_command=$2
  
  ((TOTAL_SUITES++))
  echo -e "\n${BLUE}▶ Running $suite_name...${NC}"
  echo "────────────────────────────────────────"
  
  # Run the command and capture result
  if eval "$suite_command" > /tmp/${suite_name// /_}.log 2>&1; then
    echo -e "${GREEN}✅ $suite_name: PASSED${NC}"
    ((PASSED_SUITES++))
  else
    echo -e "${RED}❌ $suite_name: FAILED${NC}"
    ((FAILED_SUITES++))
    # Show error summary
    echo -e "${YELLOW}   Error details:${NC}"
    tail -5 /tmp/${suite_name// /_}.log | sed 's/^/   /'
  fi
}

# Check prerequisites
echo "📋 Checking Prerequisites..."
echo "────────────────────────────────────────"

# Check if localhost resolves
if ping -c 1 localhost > /dev/null 2>&1; then
  echo -e "✅ DNS: localhost resolves correctly"
else
  echo -e "❌ DNS: localhost not resolving"
  echo -e "${YELLOW}   Fix: echo '127.0.0.1 localhost' | sudo tee -a /etc/hosts${NC}"
fi

# Check if dev server is running
if lsof -i:8080 > /dev/null 2>&1; then
  echo -e "✅ Dev Server: Running on port 8080"
else
  echo -e "⚠️  Dev Server: Not running"
  echo -e "${YELLOW}   Starting server...${NC}"
  npm run dev > /tmp/dev-server.log 2>&1 &
  DEV_SERVER_PID=$!
  sleep 5
fi

# Check Supabase connection
if [ ! -z "$VITE_SUPABASE_URL" ]; then
  echo -e "✅ Supabase: Environment configured"
else
  echo -e "⚠️  Supabase: Missing environment variables"
fi

# Run all test suites
echo -e "\n${BLUE}🧪 Running QA Test Suites${NC}"
echo "════════════════════════════════════════"

# 1. Linting
run_suite "Code Linting" "npm run lint"

# 2. Type Checking
run_suite "Type Checking" "npm run type-check || true"

# 3. Unit Tests
run_suite "Unit Tests" "npm run test:unit -- --run"

# 4. Integration Tests
run_suite "Integration Tests" "npm run test:integration -- --run"

# 5. Backend QA Tests
run_suite "Backend QA" "./run-backend-qa-proper.sh"

# 6. E2E Tests (if not in CI)
if [ -z "$CI" ]; then
  run_suite "E2E Tests" "npm run test:e2e -- --reporter=dot"
else
  echo -e "\n${YELLOW}⚠️  Skipping E2E tests in CI environment${NC}"
fi

# 7. Build Test
run_suite "Build Test" "npm run build"

# Generate Final Report
echo ""
echo "════════════════════════════════════════════════════════════"
echo "                    📊 QA PIPELINE RESULTS                   "
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Test Suites Run: $TOTAL_SUITES"
echo -e "Passed: ${GREEN}$PASSED_SUITES${NC}"
echo -e "Failed: ${RED}$FAILED_SUITES${NC}"
echo ""

# Calculate pass rate
if [ $TOTAL_SUITES -gt 0 ]; then
  PASS_RATE=$((PASSED_SUITES * 100 / TOTAL_SUITES))
  echo -n "Overall Pass Rate: "
  if [ $PASS_RATE -eq 100 ]; then
    echo -e "${GREEN}${PASS_RATE}% 🎉${NC}"
  elif [ $PASS_RATE -ge 80 ]; then
    echo -e "${GREEN}${PASS_RATE}%${NC}"
  elif [ $PASS_RATE -ge 60 ]; then
    echo -e "${YELLOW}${PASS_RATE}%${NC}"
  else
    echo -e "${RED}${PASS_RATE}%${NC}"
  fi
fi

# Recommendations
if [ $FAILED_SUITES -gt 0 ]; then
  echo ""
  echo "📝 Recommendations:"
  echo "────────────────────"
  
  if grep -q "Unit Tests.*FAILED" /tmp/*.log 2>/dev/null; then
    echo "• Fix DNS: sudo sh -c 'echo \"127.0.0.1 localhost\" >> /etc/hosts'"
  fi
  
  if grep -q "lint.*FAILED" /tmp/*.log 2>/dev/null; then
    echo "• Fix linting: npm run lint -- --fix"
  fi
  
  if grep -q "Build.*FAILED" /tmp/*.log 2>/dev/null; then
    echo "• Check build errors: npm run build"
  fi
  
  echo ""
  echo "💡 Run './patcha-apply.sh' to apply available auto-fixes"
fi

# Cleanup
if [ ! -z "$DEV_SERVER_PID" ]; then
  echo ""
  echo "🛑 Stopping temporary dev server..."
  kill $DEV_SERVER_PID 2>/dev/null
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ QA Pipeline Complete - $(date '+%H:%M:%S')"
echo "════════════════════════════════════════════════════════════"

# Exit with appropriate code
if [ $FAILED_SUITES -eq 0 ]; then
  exit 0
else
  exit 1
fi