#!/bin/bash
# Complete Supabase import automation using CLI
# This script will execute SQL commands directly via Supabase CLI

set -e  # Exit on any error

echo "🚀 Supabase Data Import with CLI"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

# Check if Supabase CLI is installed
check_supabase_cli() {
    if command -v supabase &> /dev/null; then
        local version=$(supabase --version)
        print_success "Supabase CLI found: $version"
        return 0
    else
        print_error "Supabase CLI not found"
        echo "Install with: brew install supabase/tap/supabase"
        return 1
    fi
}

# Check if linked to project
check_project_link() {
    if supabase status | grep -q "API URL"; then
        print_success "Linked to Supabase project"
        return 0
    else
        print_error "Not linked to Supabase project"
        echo "Link with: supabase link --project-ref YOUR_PROJECT_REF"
        return 1
    fi
}

# Execute SQL command
execute_sql() {
    local sql="$1"
    local description="$2"
    
    if [ -n "$description" ]; then
        print_step "$description"
    fi
    
    if supabase db execute "$sql" > /tmp/supabase_output 2>&1; then
        print_success "SQL executed successfully"
        if [ -s /tmp/supabase_output ]; then
            echo "Output:"
            cat /tmp/supabase_output
        fi
        return 0
    else
        print_error "SQL execution failed"
        cat /tmp/supabase_output
        return 1
    fi
}

# Execute SQL file
execute_sql_file() {
    local file="$1"
    local description="$2"
    
    if [ -n "$description" ]; then
        print_step "$description"
    fi
    
    if supabase db execute -f "$file" > /tmp/supabase_output 2>&1; then
        print_success "SQL file executed: $file"
        if [ -s /tmp/supabase_output ]; then
            echo "Output:"
            cat /tmp/supabase_output
        fi
        return 0
    else
        print_error "SQL file execution failed: $file"
        cat /tmp/supabase_output
        return 1
    fi
}

# Main execution
main() {
    echo
    print_step "Step 1: Checking Supabase CLI"
    if ! check_supabase_cli; then
        exit 1
    fi
    
    echo
    print_step "Step 2: Checking project link"
    if ! check_project_link; then
        exit 1
    fi
    
    echo
    print_step "Step 3: Executing import SQL"
    if [ -f "supabase_import_2000.sql" ]; then
        execute_sql_file "supabase_import_2000.sql" "Importing 2000 transactions"
    else
        print_error "supabase_import_2000.sql not found"
        exit 1
    fi
    
    echo
    print_step "Step 4: Verifying import"
    
    # Check transaction count
    execute_sql "SELECT COUNT(*) as transactions FROM transactions;" "Counting transactions"
    
    # Check transaction items count  
    execute_sql "SELECT COUNT(*) as items FROM transaction_items;" "Counting transaction items"
    
    # Check date range
    execute_sql "SELECT MIN(created_at)::date as start_date, MAX(created_at)::date as end_date FROM transactions;" "Checking date range"
    
    # Check brand performance
    execute_sql "
        SELECT 
            b.name,
            COUNT(DISTINCT ti.transaction_id) as transactions,
            ROUND(SUM(ti.subtotal)::numeric, 2) as revenue
        FROM brands b
        JOIN products p ON b.id = p.brand_id
        JOIN transaction_items ti ON p.id = ti.product_id
        GROUP BY b.id, b.name
        ORDER BY revenue DESC
        LIMIT 5;
    " "Top 5 brands by revenue"
    
    echo
    print_success "Import completed successfully!"
    echo
    echo "🌐 Test your dashboard:"
    echo "https://retail-insights-dashboard-pgfmbl0r0-jakes-projects-e9f46c30.vercel.app"
    echo
    echo "You should see:"
    echo "  - ~2000 transactions"
    echo "  - Data from January to May 2025"  
    echo "  - All brands with sales data"
    echo "  - Horizontal bar chart"
    
    # Ask if user wants to open dashboard
    echo
    read -p "🌐 Open dashboard in browser? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command -v open &> /dev/null; then
            open "https://retail-insights-dashboard-pgfmbl0r0-jakes-projects-e9f46c30.vercel.app"
            print_success "Dashboard opened in browser"
        elif command -v xdg-open &> /dev/null; then
            xdg-open "https://retail-insights-dashboard-pgfmbl0r0-jakes-projects-e9f46c30.vercel.app"
            print_success "Dashboard opened in browser"
        else
            print_warning "Could not open browser automatically"
        fi
    fi
}

# Run main function
main "$@"