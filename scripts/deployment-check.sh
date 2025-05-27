#!/bin/bash

# deployment-check.sh - Automated deployment verification
echo "🔍 Running Deployment Verification..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track if any checks fail
FAILED=0

# 1. Build Check
echo -e "\n📦 Building project..."
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    FAILED=1
fi

# 2. Environment Variables Check
echo -e "\n🔐 Checking environment variables..."
if [ -f ".env.local" ]; then
    # Check required variables
    required_vars=("VITE_SUPABASE_URL" "VITE_SUPABASE_ANON_KEY")
    
    for var in "${required_vars[@]}"; do
        if grep -q "^${var}=" .env.local; then
            echo -e "${GREEN}✅ $var is set${NC}"
        else
            echo -e "${RED}❌ Missing required env var: $var${NC}"
            FAILED=1
        fi
    done
else
    echo -e "${RED}❌ .env.local file not found${NC}"
    FAILED=1
fi

# 3. TypeScript Check
echo -e "\n🔤 Running TypeScript check..."
if npx tsc --noEmit > /dev/null 2>&1; then
    echo -e "${GREEN}✅ TypeScript check passed${NC}"
else
    echo -e "${RED}❌ TypeScript errors found${NC}"
    FAILED=1
fi

# 4. Check for console errors in key files
echo -e "\n🐛 Checking for console.error statements..."
ERROR_COUNT=$(grep -r "console\.error" src/ --include="*.ts" --include="*.tsx" | grep -v "// eslint-disable" | wc -l)
if [ "$ERROR_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✅ No console.error statements found${NC}"
else
    echo -e "${YELLOW}⚠️  Found $ERROR_COUNT console.error statements (may be intentional)${NC}"
fi

# 5. Check for TODO comments
echo -e "\n📝 Checking for TODO comments..."
TODO_COUNT=$(grep -r "TODO\|FIXME\|XXX" src/ --include="*.ts" --include="*.tsx" | wc -l)
if [ "$TODO_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✅ No TODO comments found${NC}"
else
    echo -e "${YELLOW}⚠️  Found $TODO_COUNT TODO/FIXME comments${NC}"
fi

# 6. Check package.json for test scripts
echo -e "\n🧪 Checking for test configuration..."
if grep -q '"test"' package.json; then
    echo -e "${GREEN}✅ Test script found${NC}"
else
    echo -e "${YELLOW}⚠️  No test script configured${NC}"
fi

# Final result
echo -e "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All critical checks passed!${NC}"
    echo -e "Ready for deployment 🚀"
    exit 0
else
    echo -e "${RED}❌ Some checks failed!${NC}"
    echo -e "Please fix the issues before deploying."
    exit 1
fi