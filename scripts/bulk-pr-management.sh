#!/bin/bash

# Bulk PR Management Scripts for retail-insights-dashboard-ph
# Usage: ./scripts/bulk-pr-management.sh [command]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
show_help() {
    echo -e "${BLUE}🔧 Bulk PR Management Commands${NC}"
    echo "=================================="
    echo ""
    echo "Available commands:"
    echo -e "  ${GREEN}list${NC}        - List all open PRs"
    echo -e "  ${GREEN}close-all${NC}   - Close all open PRs"
    echo -e "  ${GREEN}merge-all${NC}   - Merge all open PRs (with squash)"
    echo -e "  ${GREEN}status${NC}      - Show PR status summary"
    echo -e "  ${GREEN}help${NC}        - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./scripts/bulk-pr-management.sh list"
    echo "  ./scripts/bulk-pr-management.sh close-all"
    echo "  ./scripts/bulk-pr-management.sh merge-all"
}

list_prs() {
    echo -e "${BLUE}📋 Open Pull Requests${NC}"
    echo "====================="
    
    # Check if there are any open PRs
    local open_count=$(gh pr list --state open --json number | jq length)
    
    if [ "$open_count" -eq 0 ]; then
        echo -e "${GREEN}✅ No open pull requests found!${NC}"
        return 0
    fi
    
    echo -e "${YELLOW}Found $open_count open PR(s):${NC}"
    echo ""
    gh pr list --state open
}

close_all_prs() {
    echo -e "${YELLOW}🔒 Closing All Open PRs${NC}"
    echo "======================="
    
    # Get list of open PR numbers
    local pr_numbers=$(gh pr list --state open --json number | jq -r '.[].number')
    
    if [ -z "$pr_numbers" ]; then
        echo -e "${GREEN}✅ No open PRs to close!${NC}"
        return 0
    fi
    
    echo -e "${RED}⚠️  This will close ALL open PRs. Are you sure? (y/N)${NC}"
    read -r confirmation
    
    if [[ ! "$confirmation" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}❌ Operation cancelled${NC}"
        return 0
    fi
    
    echo -e "${YELLOW}Closing PRs...${NC}"
    echo "$pr_numbers" | xargs -P4 -I% sh -c 'echo "Closing PR #%" && gh pr close %'
    
    echo -e "${GREEN}✅ All open PRs have been closed!${NC}"
}

merge_all_prs() {
    echo -e "${YELLOW}🔀 Merging All Open PRs${NC}"
    echo "======================"
    
    # Get list of open PR numbers
    local pr_numbers=$(gh pr list --state open --json number | jq -r '.[].number')
    
    if [ -z "$pr_numbers" ]; then
        echo -e "${GREEN}✅ No open PRs to merge!${NC}"
        return 0
    fi
    
    echo -e "${RED}⚠️  This will merge ALL open PRs with squash. Are you sure? (y/N)${NC}"
    read -r confirmation
    
    if [[ ! "$confirmation" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}❌ Operation cancelled${NC}"
        return 0
    fi
    
    echo -e "${YELLOW}Merging PRs with squash...${NC}"
    echo "$pr_numbers" | xargs -P2 -I% sh -c 'echo "Merging PR #%" && gh pr merge % --squash --delete-branch --yes'
    
    echo -e "${GREEN}✅ All open PRs have been merged!${NC}"
}

show_status() {
    echo -e "${BLUE}📊 PR Status Summary${NC}"
    echo "==================="
    
    local open_count=$(gh pr list --state open --json number | jq length)
    local closed_count=$(gh pr list --state closed --limit 10 --json number | jq length)
    local merged_count=$(gh pr list --state merged --limit 10 --json number | jq length)
    
    echo -e "Open PRs:    ${YELLOW}$open_count${NC}"
    echo -e "Recent Closed: ${RED}$closed_count${NC} (last 10)"
    echo -e "Recent Merged: ${GREEN}$merged_count${NC} (last 10)"
    echo ""
    
    if [ "$open_count" -gt 0 ]; then
        echo -e "${YELLOW}Open PRs:${NC}"
        gh pr list --state open --json number,title,author | jq -r '.[] | "#\(.number) - \(.title) (@\(.author.login))"'
    fi
}

# Main script logic
case "${1:-help}" in
    "list")
        list_prs
        ;;
    "close-all")
        close_all_prs
        ;;
    "merge-all")
        merge_all_prs
        ;;
    "status")
        show_status
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac