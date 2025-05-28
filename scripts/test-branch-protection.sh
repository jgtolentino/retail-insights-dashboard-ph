#!/bin/bash

# Test Branch Protection Script
# This script verifies that branch protection is working correctly

echo "🔒 Testing Branch Protection for 'main' branch..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

# Function to test direct push
test_direct_push() {
    echo -e "\n${YELLOW}Test 1: Attempting direct push to main...${NC}"
    
    # Create a temporary test branch
    git checkout -b test-protection-$RANDOM 2>/dev/null
    
    # Create a test file
    echo "Test protection at $(date)" > .test-protection
    git add .test-protection
    git commit -m "test: verify branch protection" --no-verify 2>/dev/null
    
    # Try to push directly to main
    if git push origin HEAD:main 2>&1 | grep -q "protected branch"; then
        echo -e "${GREEN}✅ SUCCESS: Direct push to main was blocked!${NC}"
        PROTECTION_ACTIVE=true
    else
        echo -e "${RED}❌ WARNING: Direct push to main was NOT blocked!${NC}"
        PROTECTION_ACTIVE=false
    fi
    
    # Cleanup
    git checkout $CURRENT_BRANCH 2>/dev/null
    git branch -D test-protection-* 2>/dev/null
}

# Function to check GitHub API
check_api_protection() {
    echo -e "\n${YELLOW}Test 2: Checking protection via GitHub API...${NC}"
    
    # Extract owner and repo from remote URL
    REMOTE_URL=$(git remote get-url origin)
    if [[ $REMOTE_URL =~ github.com[:/]([^/]+)/([^/.]+)(\.git)?$ ]]; then
        OWNER="${BASH_REMATCH[1]}"
        REPO="${BASH_REMATCH[2]}"
        
        # Check protection status
        if gh api repos/$OWNER/$REPO/branches/main/protection --silent 2>/dev/null; then
            echo -e "${GREEN}✅ Branch protection is configured via API${NC}"
            
            # Get protection details
            echo -e "\n${YELLOW}Protection Details:${NC}"
            gh api repos/$OWNER/$REPO/branches/main/protection 2>/dev/null | jq -r '
                "- Required reviews: " + (.required_pull_request_reviews.required_approving_review_count | tostring),
                "- Dismiss stale reviews: " + (.required_pull_request_reviews.dismiss_stale_reviews | tostring),
                "- Require status checks: " + (.required_status_checks.strict | tostring),
                "- Enforce admins: " + (.enforce_admins.enabled | tostring),
                "- Restrict push access: " + (if .restrictions then "true" else "false" end)
            '
        else
            echo -e "${RED}❌ No branch protection found via API${NC}"
        fi
    fi
}

# Function to check rulesets
check_rulesets() {
    echo -e "\n${YELLOW}Test 3: Checking repository rulesets...${NC}"
    
    # Extract owner and repo
    REMOTE_URL=$(git remote get-url origin)
    if [[ $REMOTE_URL =~ github.com[:/]([^/]+)/([^/.]+)(\.git)?$ ]]; then
        OWNER="${BASH_REMATCH[1]}"
        REPO="${BASH_REMATCH[2]}"
        
        # Check rulesets
        RULESETS=$(gh api repos/$OWNER/$REPO/rulesets --jq '.[].name' 2>/dev/null)
        
        if [ -n "$RULESETS" ]; then
            echo -e "${GREEN}✅ Found rulesets:${NC}"
            echo "$RULESETS" | while read -r ruleset; do
                echo "   - $ruleset"
            done
        else
            echo -e "${YELLOW}⚠️  No rulesets found (might be using legacy branch protection)${NC}"
        fi
    fi
}

# Main execution
echo "Repository: $(git remote get-url origin)"
echo "Current branch: $CURRENT_BRANCH"

# Run tests
test_direct_push
check_api_protection
check_rulesets

echo -e "\n${YELLOW}Summary:${NC}"
if [ "$PROTECTION_ACTIVE" = true ]; then
    echo -e "${GREEN}✅ Branch protection appears to be active!${NC}"
    echo -e "${GREEN}   Your main branch is protected from direct pushes.${NC}"
else
    echo -e "${RED}❌ Branch protection may not be properly configured.${NC}"
    echo -e "${RED}   Please follow the setup guide in BRANCH_PROTECTION_SETUP.md${NC}"
fi

echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Visit: https://github.com/$OWNER/$REPO/settings/rules"
echo "2. Create a 'Protect main' ruleset following BRANCH_PROTECTION_SETUP.md"
echo "3. Run this script again to verify"