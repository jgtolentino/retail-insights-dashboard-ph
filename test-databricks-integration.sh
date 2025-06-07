#!/bin/bash

# ==============================================================================
# Databricks Integration Testing and Validation Script
# ==============================================================================
# This script validates the Databricks AI Genie integration and runs
# comprehensive tests to ensure everything is working correctly.
# ==============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="${SCRIPT_DIR}/databricks-integration-test.log"
RESULTS_FILE="${SCRIPT_DIR}/integration-test-results.json"

# Test tracking
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

# ==============================================================================
# Utility Functions
# ==============================================================================

log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "${LOG_FILE}"
}

info() { log "INFO" "$@"; }
warn() { log "WARN" "${YELLOW}$*${NC}"; }
error() { log "ERROR" "${RED}$*${NC}"; }
success() { log "SUCCESS" "${GREEN}$*${NC}"; }

test_result() {
    local test_name=$1
    local status=$2
    local message=$3
    
    case $status in
        "PASS")
            success "✅ $test_name: $message"
            TESTS_PASSED=$((TESTS_PASSED + 1))
            ;;
        "FAIL")
            error "❌ $test_name: $message"
            TESTS_FAILED=$((TESTS_FAILED + 1))
            ;;
        "SKIP")
            warn "⏭️  $test_name: $message"
            TESTS_SKIPPED=$((TESTS_SKIPPED + 1))
            ;;
    esac
}

# ==============================================================================
# Environment Validation Tests
# ==============================================================================

test_environment_setup() {
    info "Testing environment setup..."
    
    # Test 1: Check if we're in the correct directory
    if [[ -f "package.json" ]] && [[ -d "src" ]]; then
        test_result "Project Structure" "PASS" "Found package.json and src directory"
    else
        test_result "Project Structure" "FAIL" "Not in project root directory"
        return 1
    fi
    
    # Test 2: Check Node.js and npm
    if command -v node &> /dev/null && command -v npm &> /dev/null; then
        local node_version=$(node --version)
        local npm_version=$(npm --version)
        test_result "Node.js/npm" "PASS" "Node $node_version, npm $npm_version"
    else
        test_result "Node.js/npm" "FAIL" "Node.js or npm not found"
        return 1
    fi
    
    # Test 3: Check if integration script exists
    if [[ -f "databricks-ai-genie-integration.sh" ]]; then
        test_result "Integration Script" "PASS" "Integration script found"
    else
        test_result "Integration Script" "FAIL" "Integration script not found"
        return 1
    fi
    
    return 0
}

# ==============================================================================
# File Structure Tests
# ==============================================================================

test_file_structure() {
    info "Testing file structure after integration..."
    
    local required_files=(
        "src/config/databricks/config.ts"
        "src/services/databricks/databricks-service.ts"
        "src/services/databricks/ai-genie-service.ts"
        "src/services/databricks/dashboard-integration.ts"
        "src/components/databricks/AIChatPanel.tsx"
        "src/components/databricks/SystemHealthMonitor.tsx"
        "src/components/databricks/EnhancedDashboardWidget.tsx"
        "tests/integration/databricks/connection.test.ts"
        ".env.databricks.template"
        "DATABRICKS_INTEGRATION_GUIDE.md"
        "DATABRICKS_DEPLOYMENT_INSTRUCTIONS.md"
    )
    
    local missing_files=()
    for file in "${required_files[@]}"; do
        if [[ -f "$file" ]]; then
            test_result "File Check" "PASS" "$file exists"
        else
            test_result "File Check" "FAIL" "$file missing"
            missing_files+=("$file")
        fi
    done
    
    if [[ ${#missing_files[@]} -eq 0 ]]; then
        test_result "File Structure" "PASS" "All required files present"
        return 0
    else
        test_result "File Structure" "FAIL" "${#missing_files[@]} files missing"
        return 1
    fi
}

# ==============================================================================
# Dependencies Tests
# ==============================================================================

test_dependencies() {
    info "Testing npm dependencies..."
    
    # Test if package.json exists and is valid
    if ! node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))" 2>/dev/null; then
        test_result "Package.json" "FAIL" "Invalid package.json format"
        return 1
    else
        test_result "Package.json" "PASS" "Valid package.json format"
    fi
    
    # Check for required dependencies
    local required_deps=(
        "@databricks/sql"
        "@azure/msal-node"
        "axios"
        "ws"
        "form-data"
    )
    
    for dep in "${required_deps[@]}"; do
        if npm list "$dep" >/dev/null 2>&1; then
            test_result "Dependency" "PASS" "$dep installed"
        else
            test_result "Dependency" "FAIL" "$dep not installed"
        fi
    done
    
    # Check for development dependencies
    local dev_deps=("@types/ws" "@types/node")
    
    for dep in "${dev_deps[@]}"; do
        if npm list "$dep" >/dev/null 2>&1; then
            test_result "Dev Dependency" "PASS" "$dep installed"
        else
            test_result "Dev Dependency" "FAIL" "$dep not installed"
        fi
    done
    
    return 0
}

# ==============================================================================
# Configuration Tests
# ==============================================================================

test_configuration() {
    info "Testing configuration files..."
    
    # Test 1: Environment template exists and is valid
    if [[ -f ".env.databricks.template" ]]; then
        if grep -q "DATABRICKS_HOST" ".env.databricks.template" && \
           grep -q "DATABRICKS_TOKEN" ".env.databricks.template"; then
            test_result "Env Template" "PASS" "Contains required variables"
        else
            test_result "Env Template" "FAIL" "Missing required variables"
        fi
    else
        test_result "Env Template" "FAIL" "Template file not found"
    fi
    
    # Test 2: Check if TypeScript config is valid
    if [[ -f "src/config/databricks/config.ts" ]]; then
        if node -e "
            const fs = require('fs');
            const content = fs.readFileSync('src/config/databricks/config.ts', 'utf8');
            if (content.includes('DatabricksConfig') && content.includes('export')) {
                console.log('valid');
            } else {
                throw new Error('Invalid config file');
            }
        " 2>/dev/null; then
            test_result "TypeScript Config" "PASS" "Valid configuration structure"
        else
            test_result "TypeScript Config" "FAIL" "Invalid configuration structure"
        fi
    else
        test_result "TypeScript Config" "FAIL" "Configuration file not found"
    fi
    
    return 0
}

# ==============================================================================
# Service Layer Tests
# ==============================================================================

test_services() {
    info "Testing service layer..."
    
    # Test service files exist and have correct exports
    local services=(
        "src/services/databricks/databricks-service.ts:databricksService"
        "src/services/databricks/ai-genie-service.ts:aiGenieService"
        "src/services/databricks/dashboard-integration.ts:dashboardIntegrationService"
    )
    
    for service_info in "${services[@]}"; do
        IFS=':' read -ra PARTS <<< "$service_info"
        local file="${PARTS[0]}"
        local export_name="${PARTS[1]}"
        
        if [[ -f "$file" ]]; then
            if grep -q "export.*$export_name" "$file"; then
                test_result "Service Export" "PASS" "$export_name exported from $file"
            else
                test_result "Service Export" "FAIL" "$export_name not exported from $file"
            fi
        else
            test_result "Service File" "FAIL" "$file not found"
        fi
    done
    
    return 0
}

# ==============================================================================
# Component Tests
# ==============================================================================

test_components() {
    info "Testing React components..."
    
    local components=(
        "src/components/databricks/AIChatPanel.tsx:AIChatPanel"
        "src/components/databricks/SystemHealthMonitor.tsx:SystemHealthMonitor"
        "src/components/databricks/EnhancedDashboardWidget.tsx:EnhancedDashboardWidget"
    )
    
    for component_info in "${components[@]}"; do
        IFS=':' read -ra PARTS <<< "$component_info"
        local file="${PARTS[0]}"
        local component_name="${PARTS[1]}"
        
        if [[ -f "$file" ]]; then
            if grep -q "export.*$component_name" "$file" && \
               grep -q "React" "$file"; then
                test_result "React Component" "PASS" "$component_name is valid React component"
            else
                test_result "React Component" "FAIL" "$component_name invalid or missing React import"
            fi
        else
            test_result "Component File" "FAIL" "$file not found"
        fi
    done
    
    return 0
}

# ==============================================================================
# Build Tests
# ==============================================================================

test_build() {
    info "Testing TypeScript compilation..."
    
    # Test TypeScript compilation
    if command -v npx &> /dev/null; then
        if npx tsc --noEmit --skipLibCheck 2>/dev/null; then
            test_result "TypeScript Build" "PASS" "No TypeScript compilation errors"
        else
            test_result "TypeScript Build" "FAIL" "TypeScript compilation errors found"
        fi
    else
        test_result "TypeScript Build" "SKIP" "npx not available"
    fi
    
    # Test if project builds successfully
    if npm run typecheck >/dev/null 2>&1; then
        test_result "Project Build" "PASS" "Project typecheck passes"
    else
        test_result "Project Build" "FAIL" "Project typecheck fails"
    fi
    
    return 0
}

# ==============================================================================
# Integration Tests
# ==============================================================================

test_integration() {
    info "Running integration tests..."
    
    # Check if test files exist
    if [[ -f "tests/integration/databricks/connection.test.ts" ]]; then
        test_result "Test Files" "PASS" "Integration test files found"
        
        # Try to run the tests
        if npm run test:databricks >/dev/null 2>&1; then
            test_result "Integration Tests" "PASS" "All integration tests pass"
        else
            test_result "Integration Tests" "FAIL" "Some integration tests failed"
        fi
    else
        test_result "Test Files" "FAIL" "Integration test files not found"
    fi
    
    return 0
}

# ==============================================================================
# Documentation Tests
# ==============================================================================

test_documentation() {
    info "Testing documentation..."
    
    local docs=(
        "DATABRICKS_INTEGRATION_GUIDE.md"
        "DATABRICKS_DEPLOYMENT_INSTRUCTIONS.md"
    )
    
    for doc in "${docs[@]}"; do
        if [[ -f "$doc" ]]; then
            local word_count=$(wc -w < "$doc")
            if [[ $word_count -gt 100 ]]; then
                test_result "Documentation" "PASS" "$doc has $word_count words"
            else
                test_result "Documentation" "FAIL" "$doc is too short ($word_count words)"
            fi
        else
            test_result "Documentation" "FAIL" "$doc not found"
        fi
    done
    
    return 0
}

# ==============================================================================
# Security Tests
# ==============================================================================

test_security() {
    info "Testing security configuration..."
    
    # Check for hardcoded credentials
    local sensitive_patterns=(
        "password.*=.*['\"][^'\"]*['\"]"
        "token.*=.*['\"][^'\"]*['\"]"
        "key.*=.*['\"][^'\"]*['\"]"
        "secret.*=.*['\"][^'\"]*['\"]"
    )
    
    local security_issues=0
    for pattern in "${sensitive_patterns[@]}"; do
        if grep -r -i "$pattern" src/ 2>/dev/null | grep -v "process.env" | grep -v "placeholder" | grep -v "your-"; then
            security_issues=$((security_issues + 1))
        fi
    done
    
    if [[ $security_issues -eq 0 ]]; then
        test_result "Security Check" "PASS" "No hardcoded credentials found"
    else
        test_result "Security Check" "FAIL" "$security_issues potential security issues found"
    fi
    
    # Check if environment template doesn't contain real values
    if [[ -f ".env.databricks.template" ]]; then
        if grep -q "your-" ".env.databricks.template" || grep -q "placeholder" ".env.databricks.template"; then
            test_result "Env Security" "PASS" "Environment template uses placeholders"
        else
            test_result "Env Security" "FAIL" "Environment template may contain real values"
        fi
    fi
    
    return 0
}

# ==============================================================================
# Performance Tests
# ==============================================================================

test_performance() {
    info "Testing performance considerations..."
    
    # Check file sizes
    local large_files=0
    while IFS= read -r -d '' file; do
        local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo 0)
        if [[ $size -gt 1048576 ]]; then  # 1MB
            large_files=$((large_files + 1))
            warn "Large file detected: $file ($(($size / 1024))KB)"
        fi
    done < <(find src/ -name "*.ts" -o -name "*.tsx" -print0 2>/dev/null)
    
    if [[ $large_files -eq 0 ]]; then
        test_result "File Sizes" "PASS" "No oversized source files"
    else
        test_result "File Sizes" "WARN" "$large_files large files detected"
    fi
    
    # Check for potential performance issues
    local perf_issues=0
    if grep -r "console.log" src/ >/dev/null 2>&1; then
        perf_issues=$((perf_issues + 1))
    fi
    
    if [[ $perf_issues -eq 0 ]]; then
        test_result "Performance" "PASS" "No obvious performance issues"
    else
        test_result "Performance" "WARN" "Potential performance issues found"
    fi
    
    return 0
}

# ==============================================================================
# Environment Integration Test
# ==============================================================================

test_environment_integration() {
    info "Testing environment integration..."
    
    # Test if environment variables are properly handled
    if [[ -f "src/lib/config.ts" ]]; then
        if grep -q "process.env" "src/lib/config.ts"; then
            test_result "Env Integration" "PASS" "Configuration uses environment variables"
        else
            test_result "Env Integration" "FAIL" "Configuration doesn't use environment variables"
        fi
    else
        test_result "Env Integration" "SKIP" "Main config file not found"
    fi
    
    # Test environment variable validation
    if node -e "
        try {
            const config = require('./src/lib/config.ts');
            console.log('Config module loads successfully');
        } catch (e) {
            console.error('Config module failed to load:', e.message);
            process.exit(1);
        }
    " 2>/dev/null; then
        test_result "Config Loading" "PASS" "Configuration module loads without errors"
    else
        test_result "Config Loading" "FAIL" "Configuration module has loading errors"
    fi
    
    return 0
}

# ==============================================================================
# Summary and Reporting
# ==============================================================================

generate_test_report() {
    local total_tests=$((TESTS_PASSED + TESTS_FAILED + TESTS_SKIPPED))
    local pass_rate=0
    
    if [[ $total_tests -gt 0 ]]; then
        pass_rate=$(( (TESTS_PASSED * 100) / total_tests ))
    fi
    
    # Generate JSON report
    cat > "$RESULTS_FILE" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "summary": {
    "total_tests": $total_tests,
    "passed": $TESTS_PASSED,
    "failed": $TESTS_FAILED,
    "skipped": $TESTS_SKIPPED,
    "pass_rate": $pass_rate
  },
  "status": "$([ $TESTS_FAILED -eq 0 ] && echo "SUCCESS" || echo "FAILURE")",
  "recommendations": []
}
EOF
    
    # Add recommendations based on test results
    if [[ $TESTS_FAILED -gt 0 ]]; then
        echo "Recommendations for failed tests:" >> "$RESULTS_FILE"
    fi
    
    echo
    echo "========================================================================"
    echo "  INTEGRATION TEST RESULTS SUMMARY"
    echo "========================================================================"
    echo
    echo "📊 Test Results:"
    echo "   Total Tests: $total_tests"
    echo "   ✅ Passed: $TESTS_PASSED"
    echo "   ❌ Failed: $TESTS_FAILED"
    echo "   ⏭️  Skipped: $TESTS_SKIPPED"
    echo "   📈 Pass Rate: $pass_rate%"
    echo
    
    if [[ $TESTS_FAILED -eq 0 ]]; then
        success "🎉 ALL TESTS PASSED! Integration is ready for use."
        echo
        echo "Next Steps:"
        echo "1. Configure your environment: cp .env.databricks.template .env.local"
        echo "2. Add your Databricks credentials to .env.local"
        echo "3. Run: npm run dev"
        echo "4. Test the integration in your browser"
    else
        error "❌ $TESTS_FAILED tests failed. Please review the issues above."
        echo
        echo "Common Solutions:"
        echo "1. Run the integration script: ./databricks-ai-genie-integration.sh"
        echo "2. Install dependencies: npm install"
        echo "3. Check file permissions and paths"
        echo "4. Review the integration guide: DATABRICKS_INTEGRATION_GUIDE.md"
    fi
    
    echo
    echo "📁 Test Results: $RESULTS_FILE"
    echo "📁 Test Log: $LOG_FILE"
    echo
}

# ==============================================================================
# Main Execution
# ==============================================================================

main() {
    echo "========================================================================"
    echo "  Databricks Integration Testing and Validation"
    echo "========================================================================"
    echo
    
    # Initialize log file
    > "$LOG_FILE"
    
    info "Starting comprehensive integration testing..."
    
    # Run all test suites
    test_environment_setup || true
    test_file_structure || true
    test_dependencies || true
    test_configuration || true
    test_services || true
    test_components || true
    test_build || true
    test_integration || true
    test_documentation || true
    test_security || true
    test_performance || true
    test_environment_integration || true
    
    # Generate final report
    generate_test_report
    
    # Exit with appropriate code
    if [[ $TESTS_FAILED -eq 0 ]]; then
        exit 0
    else
        exit 1
    fi
}

# Handle script interruption
trap 'error "Testing interrupted"; exit 1' INT TERM

# Run main function
main "$@"