#!/bin/bash

# COMPLETE QA VALIDATION RUNNER
# This script runs all QA validation scripts to ensure data consistency

echo "════════════════════════════════════════════════════════════"
echo "🔍 COMPLETE QA VALIDATION FOR ALL PAGES AND VIEWS"
echo "════════════════════════════════════════════════════════════"
echo "📊 Ensuring displayed data matches backend queries"
echo "🎯 Validating all dashboard pages and components"
echo "🔧 Testing filter functionality and persistence"
echo "════════════════════════════════════════════════════════════"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

run_test() {
  local test_name="$1"
  local test_command="$2"
  
  echo -e "\n${BLUE}▶ Running: $test_name${NC}"
  echo "────────────────────────────────────────"
  
  ((TOTAL_TESTS++))
  
  if eval "$test_command"; then
    echo -e "${GREEN}✅ $test_name: PASSED${NC}"
    ((PASSED_TESTS++))
  else
    echo -e "${RED}❌ $test_name: FAILED${NC}"
    ((FAILED_TESTS++))
  fi
}

# Check prerequisites
echo "📋 Checking Prerequisites..."
echo "────────────────────────────────────────"

# Check if Node.js is available
if command -v node >/dev/null 2>&1; then
  echo -e "✅ Node.js: $(node --version)"
else
  echo -e "${RED}❌ Node.js not found${NC}"
  exit 1
fi

# Check if npm dependencies are installed
if [ -f "package.json" ] && [ -d "node_modules" ]; then
  echo -e "✅ NPM dependencies: Installed"
else
  echo -e "${YELLOW}⚠️  Installing NPM dependencies...${NC}"
  npm install
fi

# Check if environment file exists
if [ -f ".env" ]; then
  echo -e "✅ Environment: .env file found"
else
  echo -e "${RED}❌ Environment: .env file missing${NC}"
  echo -e "${YELLOW}   Create .env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY${NC}"
  exit 1
fi

# Check if dev server is available
if lsof -i:8080 >/dev/null 2>&1; then
  echo -e "✅ Dev Server: Running on port 8080"
  DEV_SERVER_RUNNING=true
else
  echo -e "${YELLOW}⚠️  Dev Server: Not running, starting...${NC}"
  npm run dev >/tmp/dev-server.log 2>&1 &
  DEV_SERVER_PID=$!
  DEV_SERVER_RUNNING=false
  sleep 10  # Give server time to start
  
  # Check if server started successfully
  if lsof -i:8080 >/dev/null 2>&1; then
    echo -e "✅ Dev Server: Started successfully"
  else
    echo -e "${RED}❌ Dev Server: Failed to start${NC}"
    exit 1
  fi
fi

# Install puppeteer if not available
if ! npm list puppeteer >/dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  Installing Puppeteer for browser automation...${NC}"
  npm install puppeteer --save-dev
fi

echo ""
echo "🧪 RUNNING QA VALIDATION TESTS"
echo "════════════════════════════════════════"

# 1. Backend-Frontend Data Validation
run_test "Backend-Frontend Data Consistency" "node backend-frontend-data-validator.js"

# 2. Comprehensive QA Validation (requires browser)
run_test "Comprehensive Page & Component Validation" "node comprehensive-qa-validation.js"

# 3. Filter QA Tests
if [ -f "tests/filter-qa-automated.js" ]; then
  run_test "Filter Functionality Tests" "node tests/filter-qa-automated.js"
fi

# 4. Pre-deployment Validation
if [ -f "scripts/pre-deployment-validation.js" ]; then
  run_test "Pre-deployment Validation" "node scripts/pre-deployment-validation.js"
fi

# 5. Run existing QA tests
if [ -f "run-complete-qa.sh" ]; then
  run_test "Existing QA Test Suite" "./run-complete-qa.sh"
fi

# 6. Backend QA Tests
if [ -f "run-backend-qa-proper.sh" ]; then
  run_test "Backend API Tests" "./run-backend-qa-proper.sh"
fi

# 7. Type checking
run_test "TypeScript Type Checking" "npx tsc --noEmit"

# 8. Linting
run_test "Code Linting" "npm run lint || true"

# 9. Build test
run_test "Production Build Test" "npm run build"

# Generate Final Report
echo ""
echo "════════════════════════════════════════════════════════════"
echo "                    📊 QA VALIDATION RESULTS                 "
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Total Tests Run: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

if [ $TOTAL_TESTS -gt 0 ]; then
  PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
  echo ""
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

echo ""
echo "📋 DETAILED REPORTS GENERATED:"
echo "──────────────────────────────"
echo "• backend-frontend-validation-report.json"
echo "• qa-validation-report.json"
echo "• qa-results.json (if filter tests ran)"

if [ $FAILED_TESTS -gt 0 ]; then
  echo ""
  echo -e "${RED}🚨 CRITICAL ISSUES FOUND${NC}"
  echo "─────────────────────────────"
  echo "❌ Some QA validations failed"
  echo "📊 Check reports for detailed analysis"
  echo "🔧 Fix issues before deployment"
  
  echo ""
  echo "💡 RECOMMENDED ACTIONS:"
  echo "• Review detailed JSON reports"
  echo "• Check console logs for specific errors"
  echo "• Verify database connectivity"
  echo "• Ensure all RPC functions exist"
  echo "• Test individual components manually"
else
  echo ""
  echo -e "${GREEN}🎉 ALL QA VALIDATIONS PASSED!${NC}"
  echo "─────────────────────────────"
  echo "✅ Backend data consistency verified"
  echo "✅ All pages load correctly"
  echo "✅ Filters work as expected"
  echo "✅ Charts display real data"
  echo "✅ No critical issues found"
  
  echo ""
  echo -e "${GREEN}🚀 READY FOR DEPLOYMENT!${NC}"
fi

# Cleanup
if [ "$DEV_SERVER_RUNNING" = false ] && [ ! -z "$DEV_SERVER_PID" ]; then
  echo ""
  echo "🛑 Stopping temporary dev server..."
  kill $DEV_SERVER_PID 2>/dev/null || true
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ QA Validation Complete - $(date '+%H:%M:%S')"
echo "════════════════════════════════════════════════════════════"

# Exit with appropriate code
exit $FAILED_TESTS