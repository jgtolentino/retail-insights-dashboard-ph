#!/bin/bash

echo "🔍 Deployment Comparison Tool"
echo "============================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# URLs
PRODUCTION_URL="https://retail-insights-dashboard-ph.vercel.app"
PREVIEW_URL=$(vercel ls --limit 1 | head -1)
LOCAL_URL="http://localhost:5173"

echo -e "\n📌 Comparing Deployments:"
echo -e "${GREEN}Production:${NC} $PRODUCTION_URL"
echo -e "${YELLOW}Preview:${NC} $PREVIEW_URL"
echo -e "${RED}Local:${NC} $LOCAL_URL"

# 1. Git Differences
echo -e "\n📝 Git Differences:"
echo "==================="

# Current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "Current branch: ${YELLOW}$CURRENT_BRANCH${NC}"

# Commits ahead/behind
echo -e "\nCommits ahead of main:"
git log --oneline main..HEAD | head -5

echo -e "\nFiles changed from main:"
git diff --name-status main | head -10

# 2. Environment Variables
echo -e "\n🔐 Environment Variables:"
echo "========================"

echo -e "\nLocal .env file:"
if [ -f .env ]; then
    echo -e "${GREEN}✓${NC} .env file exists"
    echo "Variables:"
    grep -E "^[A-Z]" .env | head -5
else
    echo -e "${RED}✗${NC} No .env file found"
fi

echo -e "\nVercel Environment Variables:"
vercel env ls | head -10

# 3. Build Information
echo -e "\n🏗️  Build Information:"
echo "===================="

echo -e "\nLatest deployments:"
vercel ls --limit 5

# 4. Database Connection Test
echo -e "\n🗄️  Database Status:"
echo "=================="

# Test local environment
if [ -f .env ]; then
    echo -e "\n${BLUE}Testing local Supabase connection...${NC}"
    npm run validate:pre-deploy 2>/dev/null | grep -E "(✅|❌|Database|Connection)" | head -3
fi

# 5. Feature Differences
echo -e "\n✨ Feature Differences:"
echo "======================"

echo -e "\n${GREEN}Production (main branch):${NC}"
echo "- Stable release"
echo "- Basic dashboard functionality"

echo -e "\n${YELLOW}Current Branch ($CURRENT_BRANCH):${NC}"
if git diff --name-only main | grep -q "Footer"; then
    echo "- ✅ Footer with timestamp added"
fi
if git diff --name-only main | grep -q "client.ts"; then
    echo "- ✅ Supabase environment variable fixes"
fi
if git diff --name-only main | grep -q "validation"; then
    echo "- ✅ Pre-deployment validation suite"
fi

# 6. Quick Health Check
echo -e "\n❤️  Health Check:"
echo "==============="

check_url() {
    local url=$1
    local name=$2
    
    local status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    if [ "$status" = "200" ]; then
        echo -e "${GREEN}✓${NC} $name is up (HTTP $status)"
    elif [ "$status" = "401" ]; then
        echo -e "${YELLOW}⚠${NC} $name returned 401 (auth issue)"
    else
        echo -e "${RED}✗${NC} $name is down (HTTP $status)"
    fi
}

check_url "$PRODUCTION_URL" "Production"
check_url "$LOCAL_URL" "Local Dev Server"

# 7. Key File Changes
echo -e "\n📄 Key Changes Summary:"
echo "======================"

# Count changed files
CHANGED_FILES=$(git diff --name-only main | wc -l)
echo -e "Total files changed: ${YELLOW}$CHANGED_FILES${NC}"

# Show important changes
if git diff --name-only main | grep -q "package.json"; then
    echo -e "${BLUE}•${NC} package.json - Dependencies or scripts updated"
fi

if git diff --name-only main | grep -q "client.ts"; then
    echo -e "${BLUE}•${NC} Supabase client - Environment variable configuration"
fi

if git diff --name-only main | grep -q "Footer"; then
    echo -e "${BLUE}•${NC} Footer component - Added deployment timestamp"
fi

if git diff --name-only main | grep -q "validation"; then
    echo -e "${BLUE}•${NC} Validation scripts - Pre-deployment testing"
fi

# 8. Next Steps
echo -e "\n🎯 Next Steps:"
echo "============="
echo "1. Test local: npm run dev"
echo "2. Run validation: npm run validate:pre-deploy"
echo "3. Deploy to production: vercel --prod"
echo "4. Check production URL: $PRODUCTION_URL"

echo -e "\n✅ Comparison complete!"