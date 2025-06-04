#!/bin/bash

###############################################################################
# Project Scout Edge Device Automated Provisioning Script
# 
# This script automates the deployment of edge devices for Project Scout
# retail analytics platform.
#
# Usage: ./edge-device-provisioning.sh [OPTIONS]
# 
# Author: Project Scout Development Team
# Version: 1.0
# Date: 2025-06-04
###############################################################################

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="/tmp/edge-provisioning-$(date +%Y%m%d-%H%M%S).log"
EDGE_USER="projectscout"
EDGE_HOME="/home/$EDGE_USER"
EDGE_CLIENT_DIR="$EDGE_HOME/edge-client"

# Default configuration
ENABLE_NLP=${ENABLE_NLP:-false}
STORE_ID=${STORE_ID:-""}
STORE_LOCATION=${STORE_LOCATION:-""}
SUPABASE_URL="https://lcoxtanyckjzyxxcsjzz.supabase.co"
DEVICE_TYPE="RaspberryPi5"
FIRMWARE_VERSION="2.1.0"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

# Function to check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root"
        print_error "Run as the projectscout user instead"
        exit 1
    fi
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if we're on Raspberry Pi
    if ! grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null; then
        print_warning "This doesn't appear to be a Raspberry Pi"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Check internet connectivity
    if ! ping -c 1 google.com &> /dev/null; then
        print_error "No internet connectivity detected"
        exit 1
    fi
    
    # Check if user exists
    if ! id "$EDGE_USER" &>/dev/null; then
        print_error "User $EDGE_USER does not exist"
        print_error "Please create the user first: sudo adduser $EDGE_USER"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to update system packages
update_system() {
    print_status "Updating system packages..."
    
    sudo apt update -y | tee -a "$LOG_FILE"
    sudo apt upgrade -y | tee -a "$LOG_FILE"
    
    # Install required packages
    sudo apt install -y \
        python3-pip \
        python3-venv \
        git \
        curl \
        htop \
        vim \
        unzip \
        wget \
        build-essential \
        | tee -a "$LOG_FILE"
    
    print_success "System packages updated"
}

# Function to create project directories
create_directories() {
    print_status "Creating project directories..."
    
    mkdir -p "$EDGE_CLIENT_DIR"
    mkdir -p "$EDGE_CLIENT_DIR/logs"
    mkdir -p "$EDGE_CLIENT_DIR/data"
    mkdir -p "$EDGE_CLIENT_DIR/config"
    
    if [[ "$ENABLE_NLP" == "true" ]]; then
        mkdir -p "$EDGE_CLIENT_DIR/nlp"
        mkdir -p "$EDGE_CLIENT_DIR/models"
    fi
    
    print_success "Directories created"
}

# Function to install Python dependencies
install_python_deps() {
    print_status "Installing Python dependencies..."
    
    # Create virtual environment
    python3 -m venv "$EDGE_CLIENT_DIR/venv"
    source "$EDGE_CLIENT_DIR/venv/bin/activate"
    
    # Upgrade pip
    pip install --upgrade pip | tee -a "$LOG_FILE"
    
    # Install core dependencies
    pip install \
        psutil \
        supabase-py \
        python-dotenv \
        requests \
        aiohttp \
        asyncio \
        | tee -a "$LOG_FILE"
    
    # Install NLP dependencies if enabled
    if [[ "$ENABLE_NLP" == "true" ]]; then
        print_status "Installing NLP dependencies..."
        pip install \
            transformers \
            torch \
            ollama-python \
            nltk \
            spacy \
            | tee -a "$LOG_FILE"
        
        # Download spaCy model
        python -m spacy download en_core_web_sm | tee -a "$LOG_FILE"
    fi
    
    deactivate
    print_success "Python dependencies installed"
}

# Function to install Ollama (if NLP enabled)
install_ollama() {
    if [[ "$ENABLE_NLP" != "true" ]]; then
        return 0
    fi
    
    print_status "Installing Ollama for local LLM processing..."
    
    # Install Ollama
    curl -fsSL https://ollama.ai/install.sh | sh | tee -a "$LOG_FILE"
    
    # Wait for service to start
    sleep 5
    
    # Start Ollama service
    sudo systemctl enable ollama
    sudo systemctl start ollama
    
    # Download lightweight models
    print_status "Downloading LLM models (this may take a while)..."
    ollama pull phi3:mini | tee -a "$LOG_FILE"
    ollama pull llama3.2:1b | tee -a "$LOG_FILE"
    ollama pull nomic-embed-text | tee -a "$LOG_FILE"
    
    print_success "Ollama and models installed"
}

# Function to download edge client files
download_edge_files() {
    print_status "Downloading edge client files..."
    
    cd "$EDGE_CLIENT_DIR"
    
    # Download main edge client
    curl -o edge_client.py \
        "https://raw.githubusercontent.com/tbwa-smp/project-scout/main/edge_client.py" \
        | tee -a "$LOG_FILE"
    
    # Download environment template
    curl -o .env.template \
        "https://raw.githubusercontent.com/tbwa-smp/project-scout/main/.env.edge" \
        | tee -a "$LOG_FILE"
    
    # Download device configuration
    curl -o device_config.json \
        "https://raw.githubusercontent.com/tbwa-smp/project-scout/main/edge_device_config.json" \
        | tee -a "$LOG_FILE"
    
    # Download NLP processor if enabled
    if [[ "$ENABLE_NLP" == "true" ]]; then
        curl -o edge_nlp_processor.py \
            "https://raw.githubusercontent.com/tbwa-smp/project-scout/main/edge_nlp_processor.py" \
            | tee -a "$LOG_FILE"
    fi
    
    # Make scripts executable
    chmod +x edge_client.py
    
    print_success "Edge client files downloaded"
}

# Function to configure environment
configure_environment() {
    print_status "Configuring environment..."
    
    cd "$EDGE_CLIENT_DIR"
    
    # Create .env file from template
    cp .env.template .env
    
    # Generate unique device ID
    DEVICE_MAC=$(cat /sys/class/net/*/address | head -n1 | tr -d ':')
    DEVICE_SERIAL=$(cat /proc/cpuinfo | grep Serial | cut -d ' ' -f 2)
    DEVICE_HASH=$(echo "${DEVICE_MAC}${DEVICE_SERIAL}" | sha256sum | cut -c1-12)
    DEVICE_ID="Pi5_Edge_${DEVICE_HASH}"
    
    # Update .env file
    sed -i "s/your_supabase_anon_key_here/${SUPABASE_ANON_KEY:-PLACEHOLDER}/" .env
    sed -i "s/your_supabase_service_role_key_here/${SUPABASE_SERVICE_ROLE_KEY:-PLACEHOLDER}/" .env
    
    # Update device configuration
    python3 -c "
import json
with open('device_config.json', 'r') as f:
    config = json.load(f)

config['device_settings']['device_id'] = '$DEVICE_ID'
config['device_settings']['store_id'] = '$STORE_ID'
config['device_settings']['location'] = '$STORE_LOCATION'

with open('device_config.json', 'w') as f:
    json.dump(config, f, indent=2)
"
    
    print_status "Device ID: $DEVICE_ID"
    print_success "Environment configured"
}

# Function to create NLP configuration
configure_nlp() {
    if [[ "$ENABLE_NLP" != "true" ]]; then
        return 0
    fi
    
    print_status "Configuring NLP processing..."
    
    cd "$EDGE_CLIENT_DIR"
    
    cat > nlp_config.json << 'EOF'
{
  "local_processing": {
    "enabled": true,
    "models": {
      "sentiment": "phi3:mini",
      "classification": "llama3.2:1b",
      "embeddings": "nomic-embed-text",
      "ner": "en_core_web_sm"
    },
    "fallback_to_cloud": true,
    "confidence_threshold": 0.7
  },
  "processing_tasks": {
    "customer_feedback": {
      "model": "phi3:mini",
      "prompt_template": "Analyze customer sentiment: {text}",
      "max_tokens": 100
    },
    "product_classification": {
      "model": "llama3.2:1b", 
      "prompt_template": "Classify product category: {text}",
      "max_tokens": 50
    },
    "brand_extraction": {
      "model": "en_core_web_sm",
      "use_spacy": true,
      "extract_entities": ["ORG", "PRODUCT"]
    }
  }
}
EOF
    
    print_success "NLP configuration created"
}

# Function to create systemd service
create_service() {
    print_status "Creating systemd service..."
    
    sudo tee /etc/systemd/system/edge-client.service > /dev/null << EOF
[Unit]
Description=Project Scout Edge Client
After=network.target
Wants=network.target

[Service]
Type=simple
User=$EDGE_USER
WorkingDirectory=$EDGE_CLIENT_DIR
Environment=PYTHONPATH=$EDGE_CLIENT_DIR
ExecStart=$EDGE_CLIENT_DIR/venv/bin/python edge_client.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
    
    # Reload systemd and enable service
    sudo systemctl daemon-reload
    sudo systemctl enable edge-client
    
    print_success "Systemd service created"
}

# Function to run device tests
run_tests() {
    print_status "Running device tests..."
    
    cd "$EDGE_CLIENT_DIR"
    source venv/bin/activate
    
    # Test device registration
    python3 -c "
import json
import sys
import subprocess

try:
    # Test Python environment
    import psutil, supabase, dotenv
    print('✅ Python dependencies OK')
    
    # Test device configuration
    with open('device_config.json', 'r') as f:
        config = json.load(f)
    print('✅ Device configuration OK')
    
    # Test system resources
    cpu_count = psutil.cpu_count()
    memory = psutil.virtual_memory()
    print(f'✅ System resources: {cpu_count} CPUs, {memory.total//1024//1024//1024}GB RAM')
    
    print('✅ All tests passed!')
    
except Exception as e:
    print(f'❌ Test failed: {e}')
    sys.exit(1)
" | tee -a "$LOG_FILE"
    
    deactivate
    print_success "Device tests completed"
}

# Function to start services
start_services() {
    print_status "Starting edge client service..."
    
    sudo systemctl start edge-client
    sleep 3
    
    # Check service status
    if sudo systemctl is-active --quiet edge-client; then
        print_success "Edge client service started successfully"
    else
        print_error "Failed to start edge client service"
        print_error "Check logs: sudo journalctl -u edge-client -n 20"
        exit 1
    fi
}

# Function to display summary
display_summary() {
    echo
    echo "═══════════════════════════════════════════════════════════════"
    echo "🎉 Project Scout Edge Device Provisioning Complete!"
    echo "═══════════════════════════════════════════════════════════════"
    echo
    echo "📋 Device Information:"
    echo "   Device ID: $(grep 'device_id' $EDGE_CLIENT_DIR/device_config.json | cut -d'"' -f4)"
    echo "   Store ID: ${STORE_ID:-'Not configured'}"
    echo "   Location: ${STORE_LOCATION:-'Not configured'}"
    echo "   NLP Enabled: ${ENABLE_NLP}"
    echo
    echo "🔧 Service Status:"
    echo "   Edge Client: $(sudo systemctl is-active edge-client)"
    if [[ "$ENABLE_NLP" == "true" ]]; then
        echo "   Ollama: $(sudo systemctl is-active ollama)"
    fi
    echo
    echo "📁 Installation Path: $EDGE_CLIENT_DIR"
    echo "📝 Log File: $LOG_FILE"
    echo
    echo "🚀 Next Steps:"
    echo "   1. Configure Supabase API keys in $EDGE_CLIENT_DIR/.env"
    echo "   2. Set store-specific information if not provided"
    echo "   3. Monitor service: sudo journalctl -u edge-client -f"
    echo "   4. Verify device registration in Project Scout dashboard"
    echo
    echo "🔍 Useful Commands:"
    echo "   Check status: sudo systemctl status edge-client"
    echo "   View logs: sudo journalctl -u edge-client -n 20"
    echo "   Restart service: sudo systemctl restart edge-client"
    echo "   Stop service: sudo systemctl stop edge-client"
    echo
    echo "📞 Support: support@projectscout.ph"
    echo "═══════════════════════════════════════════════════════════════"
}

# Function to show usage
show_usage() {
    cat << EOF
Project Scout Edge Device Provisioning Script

Usage: $0 [OPTIONS]

OPTIONS:
    --store-id ID          Set store identifier
    --store-location LOC   Set store location
    --enable-nlp          Enable local NLP processing
    --supabase-anon KEY   Set Supabase anonymous key
    --supabase-service KEY Set Supabase service role key
    --help                Show this help message

EXAMPLES:
    $0 --store-id "store_001" --store-location "Manila Store"
    $0 --enable-nlp --store-id "store_002"
    $0 --supabase-anon "your-key" --supabase-service "your-service-key"

ENVIRONMENT VARIABLES:
    STORE_ID               Store identifier
    STORE_LOCATION         Store location
    ENABLE_NLP             Enable NLP (true/false)
    SUPABASE_ANON_KEY      Supabase anonymous key
    SUPABASE_SERVICE_ROLE_KEY  Supabase service role key

EOF
}

# Main execution function
main() {
    echo "🚀 Starting Project Scout Edge Device Provisioning..."
    echo "📝 Log file: $LOG_FILE"
    echo
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --store-id)
                STORE_ID="$2"
                shift 2
                ;;
            --store-location)
                STORE_LOCATION="$2"
                shift 2
                ;;
            --enable-nlp)
                ENABLE_NLP="true"
                shift
                ;;
            --supabase-anon)
                SUPABASE_ANON_KEY="$2"
                shift 2
                ;;
            --supabase-service)
                SUPABASE_SERVICE_ROLE_KEY="$2"
                shift 2
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Execute provisioning steps
    check_root
    check_prerequisites
    update_system
    create_directories
    install_python_deps
    install_ollama
    download_edge_files
    configure_environment
    configure_nlp
    create_service
    run_tests
    start_services
    display_summary
    
    print_success "Edge device provisioning completed successfully!"
}

# Trap to handle script interruption
trap 'print_error "Script interrupted"; exit 1' INT TERM

# Execute main function with all arguments
main "$@"