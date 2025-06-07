#!/bin/bash

# Azure Key Vault Setup Script for Retail Insights Dashboard
# This script sets up Azure Key Vault with all required secrets for production deployment

set -e

echo "🔐 Setting up Azure Key Vault for Retail Insights Dashboard..."

# Configuration
RESOURCE_GROUP="retail-insights-rg"
KEYVAULT_NAME="retail-insights-kv-$(date +%s)"
LOCATION="East US"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    print_error "Azure CLI not found. Please install it first."
    exit 1
fi

# Check if user is logged in
if ! az account show &> /dev/null; then
    print_warning "Please log in to Azure:"
    az login
fi

print_step "Creating Azure Resource Group: $RESOURCE_GROUP"
az group create --name $RESOURCE_GROUP --location "$LOCATION" --output none

print_step "Creating Azure Key Vault: $KEYVAULT_NAME"
az keyvault create \
  --name $KEYVAULT_NAME \
  --resource-group $RESOURCE_GROUP \
  --location "$LOCATION" \
  --enabled-for-template-deployment true \
  --sku standard \
  --output none

# Get current user's object ID for access policy
USER_OBJECT_ID=$(az ad signed-in-user show --query objectId -o tsv)

print_step "Setting access policy for current user"
az keyvault set-policy \
  --name $KEYVAULT_NAME \
  --object-id $USER_OBJECT_ID \
  --secret-permissions get list set delete \
  --output none

echo ""
echo "🔑 Now you need to set the secrets. Please provide the following values:"
echo ""

# Function to prompt for secret and store it
store_secret() {
    local secret_name=$1
    local display_name=$2
    local is_required=${3:-true}
    
    echo -n "Enter $display_name: "
    read -s secret_value
    echo ""
    
    if [[ -z "$secret_value" ]] && [[ "$is_required" == "true" ]]; then
        print_error "$display_name is required!"
        return 1
    fi
    
    if [[ -n "$secret_value" ]]; then
        az keyvault secret set \
          --vault-name $KEYVAULT_NAME \
          --name $secret_name \
          --value "$secret_value" \
          --output none
        print_step "Stored: $display_name"
    else
        print_warning "Skipped: $display_name (optional)"
    fi
}

# Required secrets
echo "📋 Required Secrets:"
store_secret "supabase-url" "Supabase URL (e.g., https://xxx.supabase.co)" true
store_secret "supabase-anon-key" "Supabase Anonymous Key" true
store_secret "supabase-service-key" "Supabase Service Role Key" true
store_secret "groq-api-key" "Groq API Key (for StockBot AI)" true

echo ""
echo "📋 Optional Secrets (press Enter to skip):"
store_secret "azure-openai-endpoint" "Azure OpenAI Endpoint" false
store_secret "azure-openai-key" "Azure OpenAI API Key" false
store_secret "azure-openai-deployment" "Azure OpenAI Deployment Name (default: gpt-4)" false
store_secret "database-password" "Database Password" false
store_secret "iot-device-key" "IoT Device Key" false
store_secret "iot-connection-string" "IoT Connection String" false
store_secret "vercel-token" "Vercel Deployment Token" false

echo ""
print_step "Azure Key Vault setup completed!"

echo ""
echo "📋 Configuration Summary:"
echo "Resource Group: $RESOURCE_GROUP"
echo "Key Vault Name: $KEYVAULT_NAME"
echo "Key Vault URL: https://$KEYVAULT_NAME.vault.azure.net/"
echo ""

echo "🚀 Next Steps:"
echo "1. Set these environment variables in Vercel:"
echo "   AZURE_KEYVAULT_URL=https://$KEYVAULT_NAME.vault.azure.net/"
echo "   NODE_ENV=production"
echo ""
echo "2. For local development, create .env file with:"
echo "   AZURE_KEYVAULT_URL=https://$KEYVAULT_NAME.vault.azure.net/"
echo ""
echo "3. Ensure your deployment has Azure authentication configured"
echo "   (Managed Identity or Service Principal)"
echo ""

print_warning "Important: Store these details securely!"
echo "Key Vault Name: $KEYVAULT_NAME"
echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"

echo ""
print_step "Setup complete! 🎉"