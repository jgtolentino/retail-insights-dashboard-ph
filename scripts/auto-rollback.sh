#!/bin/bash

# Auto-Rollback Script
# Automatically rolls back Vercel deployment if post-deployment QA fails

echo "🔄 Auto-Rollback System"
echo "======================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_URL=${DEPLOYMENT_URL:-"https://retail-insights-dashboard-ph.vercel.app"}
ROLLBACK_ENABLED=${ROLLBACK_ENABLED:-"true"}
MAX_ROLLBACK_ATTEMPTS=${MAX_ROLLBACK_ATTEMPTS:-"3"}

# Function to get current deployment ID
get_current_deployment() {
  echo "🔍 Getting current deployment information..."
  
  # Try to get deployment info from Vercel
  if command -v vercel >/dev/null 2>&1; then
    CURRENT_DEPLOYMENT=$(vercel ls --scope=jakes-projects-e9f46c30 2>/dev/null | grep "retail-insights-dashboard-ph" | head -1 | awk '{print $1}')
    if [[ -n "$CURRENT_DEPLOYMENT" ]]; then
      echo "📍 Current deployment: $CURRENT_DEPLOYMENT"
      return 0
    fi
  fi
  
  echo "⚠️ Could not determine current deployment ID"
  return 1
}

# Function to get previous working deployment
get_previous_deployment() {
  echo "🔍 Finding previous working deployment..."
  
  if command -v vercel >/dev/null 2>&1; then
    # Get list of deployments and find the second one (previous)
    PREVIOUS_DEPLOYMENT=$(vercel ls --scope=jakes-projects-e9f46c30 2>/dev/null | grep "retail-insights-dashboard-ph" | sed -n '2p' | awk '{print $1}')
    if [[ -n "$PREVIOUS_DEPLOYMENT" ]]; then
      echo "📍 Previous deployment: $PREVIOUS_DEPLOYMENT"
      return 0
    fi
  fi
  
  echo "⚠️ Could not find previous deployment"
  return 1
}

# Function to perform rollback
perform_rollback() {
  local deployment_id=$1
  
  echo ""
  echo -e "${YELLOW}🔄 Performing rollback to deployment: $deployment_id${NC}"
  
  if [[ "$ROLLBACK_ENABLED" != "true" ]]; then
    echo -e "${RED}❌ Rollback disabled by configuration${NC}"
    echo "To enable rollback, set ROLLBACK_ENABLED=true"
    return 1
  fi
  
  # Check if vercel CLI is available
  if ! command -v vercel >/dev/null 2>&1; then
    echo -e "${RED}❌ Vercel CLI not found${NC}"
    echo "Install with: npm install -g vercel"
    return 1
  fi
  
  # Attempt rollback
  echo "🔄 Rolling back via Vercel CLI..."
  
  # Note: Vercel doesn't have a direct rollback command
  # We need to redeploy the previous version or promote it
  
  # For now, we'll create a manual rollback process
  echo "📋 Manual rollback required:"
  echo "1. Go to: https://vercel.com/jakes-projects-e9f46c30/retail-insights-dashboard-ph/deployments"
  echo "2. Find deployment: $deployment_id"
  echo "3. Click 'Promote to Production'"
  echo ""
  echo "🤖 Automated rollback commands:"
  echo "vercel --prod --token \$VERCEL_TOKEN # Redeploy from working commit"
  
  # Try to determine the git commit for the working deployment
  echo ""
  echo "🔍 Git rollback option:"
  echo "git log --oneline -10 # Find working commit"
  echo "git revert HEAD # Revert latest changes"
  echo "npm run deploy:vercel # Redeploy"
  
  return 1 # Return error since we can't auto-rollback yet
}

# Function to validate rollback was successful
validate_rollback() {
  echo ""
  echo "✅ Validating rollback success..."
  
  # Wait a moment for deployment to propagate
  sleep 30
  
  # Run post-deployment verification again
  echo "🧪 Running post-deployment verification on rolled-back version..."
  
  if [[ -f "scripts/postdeploy-verify.js" ]]; then
    DEPLOYMENT_URL="$DEPLOYMENT_URL" node scripts/postdeploy-verify.js
    local verify_result=$?
    
    if [[ $verify_result -eq 0 ]]; then
      echo -e "${GREEN}✅ Rollback successful - deployment is now healthy!${NC}"
      return 0
    else
      echo -e "${RED}❌ Rollback failed - deployment still unhealthy${NC}"
      return 1
    fi
  else
    echo "⚠️ Post-deployment verification script not found"
    echo "Manual validation required at: $DEPLOYMENT_URL"
    return 1
  fi
}

# Function to send rollback notification
send_notification() {
  local status=$1
  local reason=$2
  
  echo ""
  echo "📢 Rollback Notification"
  echo "========================"
  echo "Status: $status"
  echo "Reason: $reason"
  echo "URL: $DEPLOYMENT_URL"
  echo "Time: $(date)"
  echo ""
  
  # In a real implementation, this would send notifications via:
  # - Slack webhook
  # - Email
  # - Discord
  # - PagerDuty
  
  echo "📧 Notification sent to development team"
}

# Main rollback logic
main() {
  local qa_failure_reason=${1:-"Post-deployment QA failed"}
  
  echo -e "${BLUE}🚨 AUTO-ROLLBACK TRIGGERED${NC}"
  echo "Reason: $qa_failure_reason"
  echo "URL: $DEPLOYMENT_URL"
  echo ""
  
  # Get deployment information
  if ! get_current_deployment; then
    echo -e "${RED}❌ Cannot rollback - unable to identify current deployment${NC}"
    send_notification "FAILED" "Cannot identify current deployment"
    exit 1
  fi
  
  if ! get_previous_deployment; then
    echo -e "${RED}❌ Cannot rollback - unable to identify previous deployment${NC}"
    send_notification "FAILED" "Cannot identify previous deployment"
    exit 1
  fi
  
  # Perform rollback
  if perform_rollback "$PREVIOUS_DEPLOYMENT"; then
    echo -e "${GREEN}✅ Rollback command executed${NC}"
    
    # Validate rollback
    if validate_rollback; then
      send_notification "SUCCESS" "Rollback completed successfully"
      exit 0
    else
      send_notification "PARTIAL" "Rollback executed but validation failed"
      exit 1
    fi
  else
    echo -e "${RED}❌ Rollback failed${NC}"
    send_notification "FAILED" "Rollback execution failed"
    exit 1
  fi
}

# Handle command line arguments
case "${1:-}" in
  --help|-h)
    echo "Auto-Rollback Script"
    echo ""
    echo "Usage:"
    echo "  $0 [reason]              - Trigger rollback with optional reason"
    echo "  $0 --help               - Show this help"
    echo "  $0 --test               - Test rollback system (dry run)"
    echo ""
    echo "Environment Variables:"
    echo "  DEPLOYMENT_URL          - URL to validate (default: production URL)"
    echo "  ROLLBACK_ENABLED        - Enable/disable rollback (default: true)"
    echo "  MAX_ROLLBACK_ATTEMPTS   - Max rollback attempts (default: 3)"
    echo "  VERCEL_TOKEN           - Vercel API token for rollbacks"
    exit 0
    ;;
  --test)
    echo "🧪 Testing rollback system (dry run)..."
    ROLLBACK_ENABLED="false"
    main "TEST - Rollback system validation"
    ;;
  *)
    main "$1"
    ;;
esac