#!/bin/bash

# Backend QA Test Runner with Proper Pass/Fail Reporting
# This script runs all backend tests and reports clear results

echo "🧪 Backend QA Test Suite"
echo "========================"
echo ""

# Initialize counters
TESTS_PASSED=0
TESTS_FAILED=0

# Environment Variable Validation
echo "🔍 Validating Environment Variables..."
ENV_CHECK_PASSED=true

if [[ -z "$VITE_SUPABASE_URL" ]]; then
  echo -e "${RED}❌ Missing VITE_SUPABASE_URL${NC}"
  ENV_CHECK_PASSED=false
fi

if [[ -z "$VITE_SUPABASE_ANON_KEY" ]]; then
  echo -e "${RED}❌ Missing VITE_SUPABASE_ANON_KEY${NC}"
  ENV_CHECK_PASSED=false
fi

if [[ "$ENV_CHECK_PASSED" == "true" ]]; then
  echo -e "${GREEN}✅ Environment variables validated${NC}"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${RED}❌ Environment validation failed - deployment will fail${NC}"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to run a test and track results
run_test() {
  local test_name=$1
  local test_command=$2
  local test_file=$3
  
  ((TOTAL_TESTS++))
  
  echo -n "📋 $test_name... "
  
  # Check if test file exists
  if [ ! -z "$test_file" ] && [ ! -f "$test_file" ]; then
    echo -e "${YELLOW}SKIP${NC} (file not found: $test_file)"
    return
  fi
  
  # Run the test and capture output
  output=$(eval "$test_command" 2>&1)
  exit_code=$?
  
  if [ $exit_code -eq 0 ]; then
    echo -e "${GREEN}PASS${NC} ✅"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}FAIL${NC} ❌"
    ((TESTS_FAILED++))
    # Show first error line or last line of output
    error_msg=$(echo "$output" | grep -E "(Error:|❌|Failed|ENOTFOUND)" | head -1)
    if [ -z "$error_msg" ]; then
      error_msg=$(echo "$output" | tail -1)
    fi
    echo "   └─ Error: $error_msg"
  fi
}

# Set up environment if .env exists
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

echo "🔧 Running Backend Tests..."
echo "────────────────────────────"

# 1. Database Connection Test
run_test "Database Connection" \
  "node scripts/test-supabase-connection-simple.js > /dev/null 2>&1" \
  "scripts/test-supabase-connection-simple.js"

# 2. SQL Functions Test
run_test "SQL Functions" \
  "node scripts/test-sql-functions.js > /dev/null 2>&1" \
  "scripts/test-sql-functions.js"

# 3. Unit Tests
run_test "Unit Tests" \
  "npm run test:unit -- --run > /dev/null 2>&1" \
  ""

# 4. Integration Tests
run_test "Integration Tests" \
  "npm run test:integration -- --run > /dev/null 2>&1" \
  ""

# 5. Comprehensive Filter Tests
run_test "Filter Tests" \
  "node scripts/comprehensive-filter-test.js > /dev/null 2>&1" \
  "scripts/comprehensive-filter-test.js"

# 6. API Health Check
run_test "API Health Check" \
  "./check-api-health.sh" \
  ""

# Summary Report
echo ""
echo "📊 Test Results Summary"
echo "────────────────────────────"
echo -e "Total Tests:  $TOTAL_TESTS"
echo -e "Passed:       ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed:       ${RED}$TESTS_FAILED${NC}"
echo ""

# Calculate pass rate
if [ $TOTAL_TESTS -gt 0 ]; then
  PASS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))
  echo -n "Pass Rate:    "
  if [ $PASS_RATE -ge 80 ]; then
    echo -e "${GREEN}${PASS_RATE}%${NC}"
  elif [ $PASS_RATE -ge 60 ]; then
    echo -e "${YELLOW}${PASS_RATE}%${NC}"
  else
    echo -e "${RED}${PASS_RATE}%${NC}"
  fi
fi

echo ""

# Exit with appropriate code
if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All backend tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed. Please check the errors above.${NC}"
  exit 1
fi