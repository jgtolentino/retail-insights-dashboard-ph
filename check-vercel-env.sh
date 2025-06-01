#!/bin/bash

# Vercel Environment Variables Checker
# Validates that all required environment variables are set

echo "🔍 Vercel Environment Variables Check"
echo "===================================="
echo ""

# Required environment variables for the dashboard
REQUIRED_VARS=(
  "VITE_SUPABASE_URL"
  "VITE_SUPABASE_ANON_KEY"
)

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ALL_PRESENT=true
MISSING_VARS=()

echo "📋 Checking required environment variables..."
echo ""

for var in "${REQUIRED_VARS[@]}"; do
  if [[ -n "${!var}" ]]; then
    echo -e "${GREEN}✅ $var${NC} = ${!var:0:20}..." # Show first 20 chars
  else
    echo -e "${RED}❌ $var${NC} - MISSING"
    ALL_PRESENT=false
    MISSING_VARS+=("$var")
  fi
done

echo ""

if [[ "$ALL_PRESENT" == "true" ]]; then
  echo -e "${GREEN}🎉 All environment variables are present!${NC}"
  echo -e "${GREEN}✅ Vercel deployment should succeed${NC}"
  exit 0
else
  echo -e "${RED}🚨 Missing environment variables detected!${NC}"
  echo ""
  echo -e "${YELLOW}🔧 To fix this:${NC}"
  echo "1. Go to: https://vercel.com/jakes-projects-e9f46c30/retail-insights-dashboard-ph/settings/environment-variables"
  echo "2. Add the following variables under 'Production' scope:"
  echo ""
  
  for var in "${MISSING_VARS[@]}"; do
    case $var in
      "VITE_SUPABASE_URL")
        echo -e "   ${YELLOW}$var${NC} = https://clyzeaymuldsaslqtjnr.supabase.co"
        ;;
      "VITE_SUPABASE_ANON_KEY")
        echo -e "   ${YELLOW}$var${NC} = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNseXplYXltdWxkc2FzbHF0am5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5ODkxOTAsImV4cCI6MjA0OTU2NTE5MH0.J7R_fJ3-wWPJJSX8h_4Q-PUHDvdVdQd4QdNSPYB5L5M"
        ;;
    esac
  done
  
  echo ""
  echo "3. Click 'Deploy' > 'Redeploy' to trigger a new deployment"
  echo ""
  echo -e "${RED}❌ Deployment will fail without these variables${NC}"
  exit 1
fi