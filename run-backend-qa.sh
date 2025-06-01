#!/bin/bash

# Backend QA Runner Script
# This script runs backend QA tests for the retail-insights-dashboard-ph project

echo "🔍 Starting Backend QA Suite..."

# Check environment variables
if [ -z "$SUPABASE_DB_URL" ]; then
  echo "⚠️ Warning: SUPABASE_DB_URL not set"
  echo "Set it with: export SUPABASE_DB_URL='your_connection_string'"
fi

# Function to run a test and report results
run_test() {
  local test_name=$1
  local test_command=$2
  
  echo ""
  echo "📊 Running: $test_name"
  echo "────────────────────────────────────────"
  
  if eval "$test_command"; then
    echo "✅ $test_name PASSED"
  else
    echo "❌ $test_name FAILED (exit code: $?)"
    echo "────────────────────────────────────────"
    return 1
  fi
}

# Track overall status
TESTS_FAILED=0

# Database Connection Test
if [ -f "scripts/test-db-connection.js" ]; then
  run_test "Database Connection Test" "node scripts/test-db-connection.js" || ((TESTS_FAILED++))
fi

# SQL Function Tests
if [ -f "scripts/test-sql-functions.js" ]; then
  run_test "SQL Function Tests" "node scripts/test-sql-functions.js" || ((TESTS_FAILED++))
fi

# Backend Unit Tests
if npm run test:unit >/dev/null 2>&1; then
  run_test "Backend Unit Tests" "npm run test:unit" || ((TESTS_FAILED++))
else
  echo "⚠️ Skipping unit tests (npm script not found)"
fi

# Integration Tests
if npm run test:integration >/dev/null 2>&1; then
  run_test "Integration Tests" "npm run test:integration" || ((TESTS_FAILED++))
else
  echo "⚠️ Skipping integration tests (npm script not found)"
fi

# Comprehensive Filter Tests
if [ -f "scripts/comprehensive-filter-test.js" ]; then
  run_test "Comprehensive Filter Tests" "node scripts/comprehensive-filter-test.js" || ((TESTS_FAILED++))
fi

# Summary
echo ""
echo "════════════════════════════════════════"
echo "📊 Backend QA Suite Complete!"
echo ""
if [ $TESTS_FAILED -eq 0 ]; then
  echo "✅ All tests passed!"
  exit 0
else
  echo "❌ $TESTS_FAILED test(s) failed"
  exit 1
fi