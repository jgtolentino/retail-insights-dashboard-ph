#!/bin/bash

# ==============================================================================
# Databricks Integration Deployment Verification Script
# ==============================================================================
# This script verifies that the Databricks integration is properly deployed
# and functioning in both development and production environments.
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
LOG_FILE="${SCRIPT_DIR}/deployment-verification.log"
REPORT_FILE="${SCRIPT_DIR}/deployment-verification-report.json"

# Verification tracking
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

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

check_result() {
    local check_name=$1
    local status=$2
    local message=$3
    local severity=${4:-"error"}  # error, warning, info
    
    case $status in
        "PASS")
            success "✅ $check_name: $message"
            CHECKS_PASSED=$((CHECKS_PASSED + 1))
            ;;
        "FAIL")
            if [[ "$severity" == "warning" ]]; then
                warn "⚠️  $check_name: $message"
                CHECKS_WARNING=$((CHECKS_WARNING + 1))
            else
                error "❌ $check_name: $message"
                CHECKS_FAILED=$((CHECKS_FAILED + 1))
            fi
            ;;
        "WARN")
            warn "⚠️  $check_name: $message"
            CHECKS_WARNING=$((CHECKS_WARNING + 1))
            ;;
    esac
}

# ==============================================================================
# Environment Detection
# ==============================================================================

detect_environment() {
    local env="development"
    
    if [[ "${NODE_ENV:-}" == "production" ]] || [[ "${VERCEL:-}" == "1" ]] || [[ -n "${VERCEL_URL:-}" ]]; then
        env="production"
    elif [[ "${NODE_ENV:-}" == "staging" ]] || [[ -n "${STAGING:-}" ]]; then
        env="staging"
    fi
    
    echo "$env"
}

# ==============================================================================
# Build Verification
# ==============================================================================

verify_build() {
    info "Verifying build status..."
    
    # Check if dist directory exists
    if [[ -d "dist" ]]; then
        check_result "Build Directory" "PASS" "dist directory exists"
        
        # Check if main files exist in dist
        local required_files=("index.html" "assets")
        for file in "${required_files[@]}"; do
            if [[ -e "dist/$file" ]]; then
                check_result "Build Assets" "PASS" "$file exists in dist"
            else
                check_result "Build Assets" "FAIL" "$file missing from dist"
            fi
        done
    else
        check_result "Build Directory" "FAIL" "dist directory not found - run npm run build"
    fi
    
    # Check TypeScript compilation
    if npx tsc --noEmit --skipLibCheck >/dev/null 2>&1; then
        check_result "TypeScript" "PASS" "No compilation errors"
    else
        check_result "TypeScript" "FAIL" "TypeScript compilation errors"
    fi
}

# ==============================================================================
# Environment Variables Verification
# ==============================================================================

verify_environment_variables() {
    info "Verifying environment variables..."
    
    local env_type=$(detect_environment)
    
    # Core Supabase variables (always required)
    local core_vars=(
        "VITE_SUPABASE_URL"
        "VITE_SUPABASE_ANON_KEY"
    )
    
    for var in "${core_vars[@]}"; do
        if [[ -n "${!var:-}" ]]; then
            check_result "Core Environment" "PASS" "$var is set"
        else
            check_result "Core Environment" "FAIL" "$var is not set"
        fi
    done
    
    # Databricks variables (optional but recommended)
    local databricks_vars=(
        "DATABRICKS_HOST"
        "DATABRICKS_TOKEN"
        "DATABRICKS_WAREHOUSE_ID"
    )
    
    local databricks_configured=0
    for var in "${databricks_vars[@]}"; do
        if [[ -n "${!var:-}" ]]; then
            check_result "Databricks Config" "PASS" "$var is configured"
            databricks_configured=$((databricks_configured + 1))
        else
            check_result "Databricks Config" "WARN" "$var not configured" "warning"
        fi
    done
    
    if [[ $databricks_configured -eq 0 ]]; then
        check_result "Databricks Integration" "WARN" "No Databricks variables configured - running in Supabase-only mode" "warning"
    elif [[ $databricks_configured -eq 3 ]]; then
        check_result "Databricks Integration" "PASS" "Full Databricks configuration detected"
    else
        check_result "Databricks Integration" "WARN" "Partial Databricks configuration - some features may not work" "warning"
    fi
    
    # AI Genie variables (optional)
    if [[ "${AI_GENIE_ENABLED:-}" == "true" ]]; then
        if [[ -n "${DATABRICKS_GENIE_SPACE_ID:-}" ]]; then
            check_result "AI Genie" "PASS" "AI Genie is enabled and configured"
        else
            check_result "AI Genie" "FAIL" "AI Genie enabled but DATABRICKS_GENIE_SPACE_ID not set"
        fi
    else
        check_result "AI Genie" "WARN" "AI Genie is disabled" "warning"
    fi
}

# ==============================================================================
# API Endpoints Verification
# ==============================================================================

verify_api_endpoints() {
    info "Verifying API endpoints..."
    
    local base_url="http://localhost:5173"
    local env_type=$(detect_environment)
    
    if [[ "$env_type" == "production" ]]; then
        base_url="${VERCEL_URL:-https://your-app.vercel.app}"
    fi
    
    # Test health endpoint
    if curl -s "$base_url/api/health" >/dev/null 2>&1; then
        check_result "Health Endpoint" "PASS" "API health endpoint accessible"
    else
        check_result "Health Endpoint" "FAIL" "API health endpoint not accessible"
    fi
    
    # Test if main page loads
    if curl -s "$base_url" | grep -q "<!DOCTYPE html>"; then
        check_result "Main Page" "PASS" "Main page loads successfully"
    else
        check_result "Main Page" "FAIL" "Main page not loading properly"
    fi
}

# ==============================================================================
# Database Connectivity Verification
# ==============================================================================

verify_database_connectivity() {
    info "Verifying database connectivity..."
    
    # Test Supabase connection
    if [[ -n "${VITE_SUPABASE_URL:-}" ]] && [[ -n "${VITE_SUPABASE_ANON_KEY:-}" ]]; then
        # Create a simple test to check if Supabase is accessible
        if node -e "
            const { createClient } = require('@supabase/supabase-js');
            const supabase = createClient(
                process.env.VITE_SUPABASE_URL, 
                process.env.VITE_SUPABASE_ANON_KEY
            );
            supabase.from('transactions').select('count', { count: 'exact', head: true })
                .then(({ error }) => {
                    if (error) throw error;
                    console.log('Supabase connection successful');
                })
                .catch(e => {
                    console.error('Supabase connection failed:', e.message);
                    process.exit(1);
                });
        " 2>/dev/null; then
            check_result "Supabase Connection" "PASS" "Successfully connected to Supabase"
        else
            check_result "Supabase Connection" "FAIL" "Failed to connect to Supabase"
        fi
    else
        check_result "Supabase Connection" "FAIL" "Supabase credentials not configured"
    fi
    
    # Test Databricks connection (if configured)
    if [[ -n "${DATABRICKS_HOST:-}" ]] && [[ -n "${DATABRICKS_TOKEN:-}" ]]; then
        # Simple connectivity test
        if curl -s -H "Authorization: Bearer ${DATABRICKS_TOKEN}" \
           "${DATABRICKS_HOST}/api/2.0/clusters/list" >/dev/null 2>&1; then
            check_result "Databricks Connection" "PASS" "Successfully connected to Databricks"
        else
            check_result "Databricks Connection" "FAIL" "Failed to connect to Databricks"
        fi
    else
        check_result "Databricks Connection" "WARN" "Databricks not configured" "warning"
    fi
}

# ==============================================================================
# Feature Verification
# ==============================================================================

verify_features() {
    info "Verifying feature availability..."
    
    # Check if Databricks integration files exist
    local databricks_files=(
        "src/services/databricks/databricks-service.ts"
        "src/services/databricks/ai-genie-service.ts"
        "src/services/databricks/dashboard-integration.ts"
    )
    
    local databricks_features=0
    for file in "${databricks_files[@]}"; do
        if [[ -f "$file" ]]; then
            databricks_features=$((databricks_features + 1))
        fi
    done
    
    if [[ $databricks_features -eq 3 ]]; then
        check_result "Databricks Features" "PASS" "All Databricks integration files present"
    elif [[ $databricks_features -gt 0 ]]; then
        check_result "Databricks Features" "WARN" "Partial Databricks integration" "warning"
    else
        check_result "Databricks Features" "WARN" "No Databricks integration detected" "warning"
    fi
    
    # Check React components
    local component_files=(
        "src/components/databricks/AIChatPanel.tsx"
        "src/components/databricks/SystemHealthMonitor.tsx"
        "src/components/databricks/EnhancedDashboardWidget.tsx"
    )
    
    local component_count=0
    for file in "${component_files[@]}"; do
        if [[ -f "$file" ]]; then
            component_count=$((component_count + 1))
        fi
    done
    
    if [[ $component_count -eq 3 ]]; then
        check_result "Databricks Components" "PASS" "All Databricks components available"
    elif [[ $component_count -gt 0 ]]; then
        check_result "Databricks Components" "WARN" "Some Databricks components missing" "warning"
    else
        check_result "Databricks Components" "WARN" "No Databricks components found" "warning"
    fi
}

# ==============================================================================
# Performance Verification
# ==============================================================================

verify_performance() {
    info "Verifying performance characteristics..."
    
    # Check bundle size
    if [[ -d "dist/assets" ]]; then
        local js_files=$(find dist/assets -name "*.js" -type f)
        local total_js_size=0
        
        for file in $js_files; do
            local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo 0)
            total_js_size=$((total_js_size + size))
        done
        
        local size_mb=$((total_js_size / 1024 / 1024))
        
        if [[ $size_mb -lt 5 ]]; then
            check_result "Bundle Size" "PASS" "JavaScript bundle size: ${size_mb}MB (good)"
        elif [[ $size_mb -lt 10 ]]; then
            check_result "Bundle Size" "WARN" "JavaScript bundle size: ${size_mb}MB (acceptable)" "warning"
        else
            check_result "Bundle Size" "FAIL" "JavaScript bundle size: ${size_mb}MB (too large)"
        fi
    else
        check_result "Bundle Size" "WARN" "Cannot check bundle size - dist directory not found" "warning"
    fi
    
    # Check for performance optimizations
    if grep -q "React.memo\|useMemo\|useCallback" src/components/**/*.tsx 2>/dev/null; then
        check_result "React Optimizations" "PASS" "React performance optimizations found"
    else
        check_result "React Optimizations" "WARN" "No React performance optimizations detected" "warning"
    fi
}

# ==============================================================================
# Security Verification
# ==============================================================================

verify_security() {
    info "Verifying security configuration..."
    
    # Check for environment variable exposure
    if [[ -f "dist/index.html" ]]; then
        if grep -i "secret\|password\|private" dist/index.html 2>/dev/null; then
            check_result "Secret Exposure" "FAIL" "Potential secrets found in built files"
        else
            check_result "Secret Exposure" "PASS" "No secrets detected in built files"
        fi
    fi
    
    # Check for proper environment variable usage
    if grep -r "process.env" src/ | grep -v "VITE_" | grep -v ".example" | grep -v ".template" >/dev/null 2>&1; then
        check_result "Environment Security" "WARN" "Non-VITE environment variables detected in client code" "warning"
    else
        check_result "Environment Security" "PASS" "Proper environment variable usage"
    fi
    
    # Check for HTTPS in production
    local env_type=$(detect_environment)
    if [[ "$env_type" == "production" ]]; then
        if [[ "${VITE_SUPABASE_URL:-}" == https://* ]]; then
            check_result "HTTPS Usage" "PASS" "Supabase URL uses HTTPS"
        else
            check_result "HTTPS Usage" "FAIL" "Supabase URL should use HTTPS in production"
        fi
        
        if [[ "${DATABRICKS_HOST:-}" == https://* ]]; then
            check_result "HTTPS Usage" "PASS" "Databricks host uses HTTPS"
        elif [[ -n "${DATABRICKS_HOST:-}" ]]; then
            check_result "HTTPS Usage" "FAIL" "Databricks host should use HTTPS in production"
        fi
    fi
}

# ==============================================================================
# Monitoring and Logging Verification
# ==============================================================================

verify_monitoring() {
    info "Verifying monitoring and logging..."
    
    # Check if logging is properly configured
    if [[ -f "src/utils/logger.ts" ]]; then
        check_result "Logging Setup" "PASS" "Logger utility found"
        
        if grep -q "console.log" src/**/*.ts src/**/*.tsx 2>/dev/null; then
            check_result "Development Logs" "WARN" "console.log statements found - consider using logger utility" "warning"
        else
            check_result "Development Logs" "PASS" "No console.log statements in source code"
        fi
    else
        check_result "Logging Setup" "WARN" "No logger utility found" "warning"
    fi
    
    # Check for error boundaries
    if grep -r "ErrorBoundary\|componentDidCatch" src/ >/dev/null 2>&1; then
        check_result "Error Boundaries" "PASS" "Error boundaries implemented"
    else
        check_result "Error Boundaries" "WARN" "No error boundaries detected" "warning"
    fi
    
    # Check for health check endpoints
    if [[ -f "public/health" ]] || [[ -f "api/health.js" ]]; then
        check_result "Health Checks" "PASS" "Health check endpoint available"
    else
        check_result "Health Checks" "WARN" "No health check endpoint found" "warning"
    fi
}

# ==============================================================================
# Integration-Specific Verification
# ==============================================================================

verify_databricks_integration() {
    info "Verifying Databricks-specific integration..."
    
    # Check configuration
    if [[ -f "src/config/databricks/config.ts" ]]; then
        check_result "Databricks Config" "PASS" "Databricks configuration file exists"
        
        # Check if config exports required interfaces
        if grep -q "DatabricksConfig\|databricksConfig" "src/config/databricks/config.ts"; then
            check_result "Config Interfaces" "PASS" "Required configuration interfaces found"
        else
            check_result "Config Interfaces" "FAIL" "Configuration interfaces missing"
        fi
    else
        check_result "Databricks Config" "FAIL" "Databricks configuration file missing"
    fi
    
    # Check service integration
    if [[ -f "src/services/databricks/dashboard-integration.ts" ]]; then
        check_result "Integration Service" "PASS" "Dashboard integration service exists"
        
        if grep -q "dashboardIntegrationService" "src/services/databricks/dashboard-integration.ts"; then
            check_result "Service Export" "PASS" "Integration service properly exported"
        else
            check_result "Service Export" "FAIL" "Integration service not properly exported"
        fi
    else
        check_result "Integration Service" "FAIL" "Dashboard integration service missing"
    fi
    
    # Check AI Genie integration
    if [[ "${AI_GENIE_ENABLED:-}" == "true" ]]; then
        if [[ -f "src/services/databricks/ai-genie-service.ts" ]]; then
            check_result "AI Genie Service" "PASS" "AI Genie service file exists"
        else
            check_result "AI Genie Service" "FAIL" "AI Genie service missing despite being enabled"
        fi
    else
        check_result "AI Genie Service" "WARN" "AI Genie not enabled" "warning"
    fi
}

# ==============================================================================
# Generate Verification Report
# ==============================================================================

generate_verification_report() {
    local env_type=$(detect_environment)
    local total_checks=$((CHECKS_PASSED + CHECKS_FAILED + CHECKS_WARNING))
    local success_rate=0
    
    if [[ $total_checks -gt 0 ]]; then
        success_rate=$(( (CHECKS_PASSED * 100) / total_checks ))
    fi
    
    local overall_status="HEALTHY"
    if [[ $CHECKS_FAILED -gt 0 ]]; then
        overall_status="FAILED"
    elif [[ $CHECKS_WARNING -gt 5 ]]; then
        overall_status="WARNING"
    fi
    
    # Generate JSON report
    cat > "$REPORT_FILE" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "$env_type",
  "overall_status": "$overall_status",
  "summary": {
    "total_checks": $total_checks,
    "passed": $CHECKS_PASSED,
    "failed": $CHECKS_FAILED,
    "warnings": $CHECKS_WARNING,
    "success_rate": $success_rate
  },
  "environment_variables": {
    "supabase_configured": $([ -n "${VITE_SUPABASE_URL:-}" ] && echo "true" || echo "false"),
    "databricks_configured": $([ -n "${DATABRICKS_HOST:-}" ] && echo "true" || echo "false"),
    "ai_genie_enabled": $([ "${AI_GENIE_ENABLED:-}" == "true" ] && echo "true" || echo "false")
  },
  "recommendations": []
}
EOF
    
    echo
    echo "========================================================================"
    echo "  DEPLOYMENT VERIFICATION REPORT"
    echo "========================================================================"
    echo
    echo "🌍 Environment: $env_type"
    echo "📊 Overall Status: $overall_status"
    echo
    echo "📈 Check Results:"
    echo "   Total Checks: $total_checks"
    echo "   ✅ Passed: $CHECKS_PASSED"
    echo "   ❌ Failed: $CHECKS_FAILED"
    echo "   ⚠️  Warnings: $CHECKS_WARNING"
    echo "   📊 Success Rate: $success_rate%"
    echo
    
    if [[ "$overall_status" == "HEALTHY" ]]; then
        success "🎉 DEPLOYMENT VERIFICATION PASSED!"
        echo
        echo "Your Databricks integration is properly deployed and configured."
        echo "All critical systems are operational."
    elif [[ "$overall_status" == "WARNING" ]]; then
        warn "⚠️  DEPLOYMENT HAS WARNINGS"
        echo
        echo "The deployment is functional but has some issues that should be addressed:"
        echo "- Review the warnings above"
        echo "- Consider optimizing performance"
        echo "- Complete optional configurations"
    else
        error "❌ DEPLOYMENT VERIFICATION FAILED"
        echo
        echo "Critical issues detected that need to be resolved:"
        echo "- Fix the failed checks above"
        echo "- Verify environment configuration"
        echo "- Check network connectivity"
        echo "- Ensure all required services are running"
    fi
    
    echo
    echo "📁 Detailed Report: $REPORT_FILE"
    echo "📁 Verification Log: $LOG_FILE"
    echo
    
    if [[ "$env_type" == "production" ]]; then
        echo "🚀 Production Deployment Checklist:"
        echo "   □ Environment variables secured"
        echo "   □ HTTPS enabled for all endpoints"
        echo "   □ Error monitoring configured"
        echo "   □ Performance monitoring enabled"
        echo "   □ Backup and recovery procedures in place"
        echo
    fi
    
    echo "💡 Quick Actions:"
    echo "   Health Check: npm run health:check"
    echo "   Clear Cache: npm run databricks:cache:clear"
    echo "   Run Tests: npm run test:databricks"
    echo
}

# ==============================================================================
# Main Execution
# ==============================================================================

main() {
    local env_type=$(detect_environment)
    
    echo "========================================================================"
    echo "  Databricks Integration Deployment Verification"
    echo "  Environment: $env_type"
    echo "========================================================================"
    echo
    
    # Initialize log file
    > "$LOG_FILE"
    
    info "Starting deployment verification for $env_type environment..."
    
    # Run all verification checks
    verify_build
    verify_environment_variables
    verify_api_endpoints
    verify_database_connectivity
    verify_features
    verify_performance
    verify_security
    verify_monitoring
    verify_databricks_integration
    
    # Generate final report
    generate_verification_report
    
    # Exit with appropriate code
    if [[ $CHECKS_FAILED -eq 0 ]]; then
        exit 0
    else
        exit 1
    fi
}

# Handle script interruption
trap 'error "Verification interrupted"; exit 1' INT TERM

# Run main function
main "$@"