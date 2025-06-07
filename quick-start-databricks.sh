#!/bin/bash

# ==============================================================================
# Databricks AI Genie Integration - Quick Start Script
# ==============================================================================
# This script provides a quick way to set up and test the Databricks integration
# ==============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ==============================================================================
# Utility Functions
# ==============================================================================

print_header() {
    echo
    echo -e "${BLUE}========================================================================"
    echo -e "  $1"
    echo -e "========================================================================${NC}"
    echo
}

print_step() {
    echo -e "${CYAN}➤ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# ==============================================================================
# Welcome and Overview
# ==============================================================================

show_welcome() {
    clear
    print_header "Databricks AI Genie Integration - Quick Start"
    
    echo -e "${PURPLE}🚀 Welcome to the Databricks AI Genie Integration Setup!${NC}"
    echo
    echo "This script will help you:"
    echo "  • Set up Databricks integration with your retail dashboard"
    echo "  • Configure AI Genie for natural language queries"
    echo "  • Test the integration"
    echo "  • Launch your enhanced dashboard"
    echo
    echo -e "${YELLOW}Prerequisites:${NC}"
    echo "  ✓ Node.js 18+ and npm installed"
    echo "  ✓ Databricks workspace (optional but recommended)"
    echo "  ✓ AI Genie enabled in Databricks (optional)"
    echo "  ✓ Existing Supabase setup"
    echo
    
    read -p "Press Enter to continue or Ctrl+C to exit..."
}

# ==============================================================================
# Environment Check
# ==============================================================================

check_prerequisites() {
    print_header "Checking Prerequisites"
    
    print_step "Checking Node.js and npm..."
    if command -v node &> /dev/null && command -v npm &> /dev/null; then
        local node_version=$(node --version)
        local npm_version=$(npm --version)
        print_success "Node.js $node_version and npm $npm_version found"
    else
        print_error "Node.js or npm not found. Please install Node.js 18+ first."
        exit 1
    fi
    
    print_step "Checking project structure..."
    if [[ -f "package.json" ]] && [[ -d "src" ]]; then
        print_success "Project structure looks good"
    else
        print_error "Please run this script from the project root directory"
        exit 1
    fi
    
    print_step "Checking existing environment..."
    if [[ -f ".env" ]] || [[ -f ".env.local" ]]; then
        print_success "Environment file found"
    else
        print_warning "No environment file found - we'll help you create one"
    fi
}

# ==============================================================================
# Integration Setup
# ==============================================================================

run_integration_setup() {
    print_header "Running Databricks Integration Setup"
    
    print_step "Making integration script executable..."
    chmod +x databricks-ai-genie-integration.sh
    chmod +x test-databricks-integration.sh
    chmod +x verify-databricks-deployment.sh
    print_success "Scripts are now executable"
    
    print_step "Running the integration setup..."
    if ./databricks-ai-genie-integration.sh; then
        print_success "Integration setup completed successfully!"
    else
        print_error "Integration setup failed. Check the logs for details."
        exit 1
    fi
}

# ==============================================================================
# Environment Configuration
# ==============================================================================

configure_environment() {
    print_header "Configuring Environment Variables"
    
    if [[ ! -f ".env.local" ]]; then
        print_step "Creating environment configuration file..."
        cp .env.databricks.template .env.local
        print_success "Environment template copied to .env.local"
    fi
    
    echo
    echo -e "${YELLOW}Environment Configuration Options:${NC}"
    echo
    echo "1. 📝 Configure Databricks manually (recommended)"
    echo "2. 🚀 Skip Databricks setup (Supabase-only mode)"
    echo "3. 📋 Show environment template"
    echo
    
    read -p "Choose an option (1-3): " choice
    
    case $choice in
        1)
            configure_databricks_manually
            ;;
        2)
            print_info "Skipping Databricks configuration. Dashboard will run in Supabase-only mode."
            ;;
        3)
            show_environment_template
            configure_environment
            ;;
        *)
            print_warning "Invalid choice. Skipping Databricks configuration."
            ;;
    esac
}

configure_databricks_manually() {
    echo
    print_step "Manual Databricks Configuration"
    echo
    echo "Please provide your Databricks credentials:"
    echo
    
    read -p "Databricks Host (e.g., https://dbc-12345678-abcd.cloud.databricks.com): " db_host
    read -p "Databricks Token: " db_token
    read -p "SQL Warehouse ID: " warehouse_id
    
    if [[ -n "$db_host" ]] && [[ -n "$db_token" ]] && [[ -n "$warehouse_id" ]]; then
        # Update .env.local with provided values
        sed -i.bak "s|DATABRICKS_HOST=.*|DATABRICKS_HOST=$db_host|" .env.local
        sed -i.bak "s|DATABRICKS_TOKEN=.*|DATABRICKS_TOKEN=$db_token|" .env.local
        sed -i.bak "s|DATABRICKS_WAREHOUSE_ID=.*|DATABRICKS_WAREHOUSE_ID=$warehouse_id|" .env.local
        sed -i.bak "s|PRIMARY_DATA_SOURCE=.*|PRIMARY_DATA_SOURCE=databricks|" .env.local
        
        print_success "Databricks configuration saved!"
        
        # Ask about AI Genie
        echo
        read -p "Do you have AI Genie enabled? (y/n): " ai_genie
        if [[ "$ai_genie" =~ ^[Yy]$ ]]; then
            read -p "AI Genie Space ID (optional): " space_id
            if [[ -n "$space_id" ]]; then
                sed -i.bak "s|DATABRICKS_GENIE_SPACE_ID=.*|DATABRICKS_GENIE_SPACE_ID=$space_id|" .env.local
                sed -i.bak "s|AI_GENIE_ENABLED=.*|AI_GENIE_ENABLED=true|" .env.local
                print_success "AI Genie configuration saved!"
            fi
        fi
        
        rm .env.local.bak 2>/dev/null || true
    else
        print_warning "Incomplete configuration. Please edit .env.local manually."
    fi
}

show_environment_template() {
    print_header "Environment Configuration Template"
    
    echo -e "${CYAN}Here's what you need to configure in .env.local:${NC}"
    echo
    cat .env.databricks.template | head -20
    echo "..."
    echo
    echo -e "${YELLOW}Key Variables:${NC}"
    echo "  • DATABRICKS_HOST: Your workspace URL"
    echo "  • DATABRICKS_TOKEN: Personal access token"
    echo "  • DATABRICKS_WAREHOUSE_ID: SQL warehouse ID"
    echo "  • AI_GENIE_ENABLED: Enable AI features (true/false)"
    echo
    echo "Press Enter to continue..."
    read
}

# ==============================================================================
# Dependencies Installation
# ==============================================================================

install_dependencies() {
    print_header "Installing Dependencies"
    
    print_step "Installing npm dependencies..."
    if npm install; then
        print_success "Dependencies installed successfully!"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
}

# ==============================================================================
# Testing
# ==============================================================================

run_tests() {
    print_header "Testing the Integration"
    
    print_step "Running integration tests..."
    if ./test-databricks-integration.sh; then
        print_success "All tests passed!"
    else
        print_warning "Some tests failed, but the integration should still work"
        echo
        read -p "Continue anyway? (y/n): " continue_choice
        if [[ ! "$continue_choice" =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    print_step "Running deployment verification..."
    if ./verify-databricks-deployment.sh; then
        print_success "Deployment verification passed!"
    else
        print_warning "Deployment verification had issues"
    fi
}

# ==============================================================================
# Launch Dashboard
# ==============================================================================

launch_dashboard() {
    print_header "Launching Your Enhanced Dashboard"
    
    print_step "Building the application..."
    if npm run build; then
        print_success "Build completed successfully!"
    else
        print_error "Build failed"
        exit 1
    fi
    
    echo
    echo -e "${GREEN}🎉 Setup Complete! Your Databricks-enhanced dashboard is ready!${NC}"
    echo
    echo -e "${YELLOW}What's Available Now:${NC}"
    echo "  ✅ Enhanced dashboard with AI insights"
    echo "  ✅ Natural language query interface"
    echo "  ✅ System health monitoring"
    echo "  ✅ Hybrid data source support"
    echo "  ✅ Performance optimization"
    echo
    echo -e "${CYAN}Available Commands:${NC}"
    echo "  npm run dev                    # Start development server"
    echo "  npm run health:check          # Check system health"
    echo "  npm run test:databricks       # Run integration tests"
    echo "  npm run databricks:cache:clear # Clear cache"
    echo
    echo -e "${BLUE}Documentation:${NC}"
    echo "  📖 DATABRICKS_INTEGRATION_GUIDE.md"
    echo "  🚀 DATABRICKS_DEPLOYMENT_INSTRUCTIONS.md"
    echo "  📋 README_DATABRICKS_INTEGRATION.md"
    echo
    
    read -p "Would you like to start the development server now? (y/n): " start_server
    
    if [[ "$start_server" =~ ^[Yy]$ ]]; then
        print_step "Starting development server..."
        echo
        echo -e "${GREEN}🚀 Starting your enhanced retail insights dashboard...${NC}"
        echo
        echo "Your dashboard will be available at: http://localhost:5173"
        echo "Press Ctrl+C to stop the server"
        echo
        sleep 2
        npm run dev
    else
        echo
        echo -e "${GREEN}Setup complete! Run 'npm run dev' when you're ready to start.${NC}"
    fi
}

# ==============================================================================
# Error Handling
# ==============================================================================

handle_error() {
    print_error "An error occurred during setup"
    echo
    echo "Troubleshooting tips:"
    echo "  1. Check the logs for detailed error messages"
    echo "  2. Ensure all prerequisites are installed"
    echo "  3. Verify network connectivity"
    echo "  4. Check the integration guide: DATABRICKS_INTEGRATION_GUIDE.md"
    echo
    echo "For help, check:"
    echo "  📁 databricks-integration.log"
    echo "  📁 databricks-integration-test.log"
    echo "  📖 README_DATABRICKS_INTEGRATION.md"
    exit 1
}

# ==============================================================================
# Main Execution Flow
# ==============================================================================

main() {
    # Set up error handling
    trap handle_error ERR
    
    # Run the setup process
    show_welcome
    check_prerequisites
    run_integration_setup
    configure_environment
    install_dependencies
    run_tests
    launch_dashboard
}

# ==============================================================================
# Script Options
# ==============================================================================

case "${1:-}" in
    --help|-h)
        echo "Databricks AI Genie Integration - Quick Start"
        echo
        echo "Usage: $0 [options]"
        echo
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --fast         Skip interactive prompts (use defaults)"
        echo "  --test-only    Only run tests, don't launch dashboard"
        echo "  --skip-tests   Skip testing phase"
        echo
        echo "Examples:"
        echo "  $0              # Interactive setup"
        echo "  $0 --fast       # Quick setup with defaults"
        echo "  $0 --test-only  # Test existing setup"
        exit 0
        ;;
    --fast)
        export FAST_MODE=true
        ;;
    --test-only)
        export TEST_ONLY=true
        ;;
    --skip-tests)
        export SKIP_TESTS=true
        ;;
esac

# Run the main setup process
main "$@"