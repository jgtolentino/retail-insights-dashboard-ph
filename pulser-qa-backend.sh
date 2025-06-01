#!/bin/bash
# Pulser Backend QA Execution Wrapper
# This script provides a clean CLI interface for running backend QA via Pulser

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Pulser Backend QA Runner${NC}"
echo "=============================="

# Check which Pulser binary to use
if [ -x "./pulser-task-runner-v2.js" ]; then
    PULSER_BIN="./pulser-task-runner-v2.js"
elif [ -x "./pulser-simple.js" ]; then
    PULSER_BIN="./pulser-simple.js"
elif [ -x "./pulser-task-runner.js" ]; then
    PULSER_BIN="./pulser-task-runner.js"
else
    echo -e "${RED}❌ No Pulser executable found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Using Pulser: ${PULSER_BIN}${NC}"

# Set environment for Pulser
export PULSER_LOG_LEVEL=${PULSER_LOG_LEVEL:-info}
export NODE_ENV=${NODE_ENV:-development}

# Check for required environment variables
if [ -z "$SUPABASE_DB_URL" ]; then
    echo -e "${YELLOW}⚠️  Warning: SUPABASE_DB_URL not set${NC}"
    echo "   Set with: export SUPABASE_DB_URL='your_connection_string'"
fi

# Run the backend QA task
echo -e "\n${BLUE}🚀 Executing backend-qa task...${NC}"
echo "────────────────────────────────"

# Execute using Node directly to avoid interactive mode
node "$PULSER_BIN" run backend-qa

# Check exit code
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Backend QA completed successfully!${NC}"
else
    echo -e "\n${RED}❌ Backend QA failed${NC}"
    exit 1
fi