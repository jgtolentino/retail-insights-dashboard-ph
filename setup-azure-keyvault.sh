#!/bin/bash

# Azure Key Vault Setup Script for Retail Insights Dashboard
# This script creates and configures Azure Key Vault with all required credentials

set -e  # Exit on any error

echo "🔐 Azure Key Vault Setup for Retail Insights Dashboard"
echo "=================================================="

# Configuration
RESOURCE_GROUP="retail-insights-rg"
LOCATION="East US"
KEYVAULT_NAME="retail-insights-kv-$(date +%s)"
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

echo "📋 Configuration:"
echo "   Resource Group: $RESOURCE_GROUP"
echo "   Location: $LOCATION"
echo "   Key Vault Name: $KEYVAULT_NAME"
echo "   Subscription: $SUBSCRIPTION_ID"
echo ""

# Check if Azure CLI is logged in
if ! az account show &> /dev/null; then
    echo "❌ Please login to Azure CLI first:"
    echo "   az login"
    exit 1
fi

echo "✅ Azure CLI authenticated"

# Create resource group if it doesn't exist
echo "📦 Creating resource group..."
az group create --name $RESOURCE_GROUP --location "$LOCATION" --output table

# Create Key Vault
echo "🔐 Creating Key Vault..."
az keyvault create \
  --name $KEYVAULT_NAME \
  --resource-group $RESOURCE_GROUP \
  --location "$LOCATION" \
  --enabled-for-template-deployment true \
  --enabled-for-disk-encryption true \
  --enabled-for-deployment true \
  --sku standard \
  --output table

echo "✅ Key Vault created: $KEYVAULT_NAME"

# Get current user object ID for access policy
USER_OBJECT_ID=$(az ad signed-in-user show --query objectId -o tsv)

echo "🔑 Setting access policy for current user..."
az keyvault set-policy \
  --name $KEYVAULT_NAME \
  --object-id $USER_OBJECT_ID \
  --secret-permissions get list set delete backup restore recover purge \
  --output table

# Store current credentials from .env file (if exists)
if [ -f ".env" ]; then
    echo "📁 Reading existing credentials from .env file..."
    
    # Source the .env file
    set -a
    source .env
    set +a
    
    echo "🔐 Storing credentials in Key Vault..."
    
    # Supabase credentials
    if [ ! -z "$VITE_SUPABASE_URL" ]; then
        az keyvault secret set --vault-name $KEYVAULT_NAME --name "supabase-url" --value "$VITE_SUPABASE_URL" > /dev/null
        echo "   ✅ Stored: supabase-url"
    fi
    
    if [ ! -z "$VITE_SUPABASE_ANON_KEY" ]; then
        az keyvault secret set --vault-name $KEYVAULT_NAME --name "supabase-anon-key" --value "$VITE_SUPABASE_ANON_KEY" > /dev/null
        echo "   ✅ Stored: supabase-anon-key"
    fi
    
    if [ ! -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        az keyvault secret set --vault-name $KEYVAULT_NAME --name "supabase-service-key" --value "$SUPABASE_SERVICE_ROLE_KEY" > /dev/null
        echo "   ✅ Stored: supabase-service-key"
    fi
    
    # Database credentials
    if [ ! -z "$DATABASE_PASSWORD" ]; then
        az keyvault secret set --vault-name $KEYVAULT_NAME --name "database-password" --value "$DATABASE_PASSWORD" > /dev/null
        echo "   ✅ Stored: database-password"
    fi
    
    # Placeholder for future credentials
    az keyvault secret set --vault-name $KEYVAULT_NAME --name "azure-openai-endpoint" --value "https://your-openai.openai.azure.com/" > /dev/null
    az keyvault secret set --vault-name $KEYVAULT_NAME --name "azure-openai-key" --value "your-azure-openai-key" > /dev/null
    az keyvault secret set --vault-name $KEYVAULT_NAME --name "azure-openai-deployment" --value "gpt-4" > /dev/null
    az keyvault secret set --vault-name $KEYVAULT_NAME --name "iot-device-key" --value "placeholder-iot-key" > /dev/null
    az keyvault secret set --vault-name $KEYVAULT_NAME --name "iot-connection-string" --value "placeholder-connection-string" > /dev/null
    
    echo "   ✅ Stored placeholder credentials for Azure OpenAI and IoT"
    
else
    echo "⚠️  No .env file found. Creating placeholder secrets..."
    
    # Create placeholder secrets
    az keyvault secret set --vault-name $KEYVAULT_NAME --name "supabase-url" --value "https://your-project.supabase.co" > /dev/null
    az keyvault secret set --vault-name $KEYVAULT_NAME --name "supabase-anon-key" --value "your-anon-key" > /dev/null
    az keyvault secret set --vault-name $KEYVAULT_NAME --name "supabase-service-key" --value "your-service-key" > /dev/null
    az keyvault secret set --vault-name $KEYVAULT_NAME --name "azure-openai-endpoint" --value "https://your-openai.openai.azure.com/" > /dev/null
    az keyvault secret set --vault-name $KEYVAULT_NAME --name "azure-openai-key" --value "your-azure-openai-key" > /dev/null
    az keyvault secret set --vault-name $KEYVAULT_NAME --name "azure-openai-deployment" --value "gpt-4" > /dev/null
    az keyvault secret set --vault-name $KEYVAULT_NAME --name "database-password" --value "your-database-password" > /dev/null
    az keyvault secret set --vault-name $KEYVAULT_NAME --name "iot-device-key" --value "placeholder-iot-key" > /dev/null
    az keyvault secret set --vault-name $KEYVAULT_NAME --name "iot-connection-string" --value "placeholder-connection-string" > /dev/null
    
    echo "   ✅ Created placeholder secrets (update with real values)"
fi

# Create a test secret for connectivity testing
az keyvault secret set --vault-name $KEYVAULT_NAME --name "connection-test" --value "OK" > /dev/null
echo "   ✅ Created test secret for connectivity verification"

# Enable diagnostic settings (optional)
echo "📊 Setting up monitoring and diagnostics..."

# Create Log Analytics workspace for monitoring
WORKSPACE_NAME="retail-insights-workspace"
az monitor log-analytics workspace create \
  --resource-group $RESOURCE_GROUP \
  --workspace-name $WORKSPACE_NAME \
  --location "$LOCATION" \
  --output table 2>/dev/null || echo "   ⚠️  Workspace already exists or requires different permissions"

# Get workspace resource ID
WORKSPACE_ID=$(az monitor log-analytics workspace show \
  --resource-group $RESOURCE_GROUP \
  --workspace-name $WORKSPACE_NAME \
  --query id -o tsv 2>/dev/null || echo "")

if [ ! -z "$WORKSPACE_ID" ]; then
    # Enable diagnostic settings
    az monitor diagnostic-settings create \
      --name "keyvault-diagnostics" \
      --resource "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.KeyVault/vaults/$KEYVAULT_NAME" \
      --logs '[{"category":"AuditEvent","enabled":true,"retentionPolicy":{"enabled":true,"days":30}}]' \
      --workspace "$WORKSPACE_ID" \
      --output table 2>/dev/null || echo "   ⚠️  Diagnostic settings require different permissions"
fi

# Output configuration for application
echo ""
echo "🎉 Azure Key Vault setup completed successfully!"
echo ""
echo "📋 Configuration Summary:"
echo "   Key Vault URL: https://$KEYVAULT_NAME.vault.azure.net/"
echo "   Resource Group: $RESOURCE_GROUP"
echo "   Location: $LOCATION"
echo ""
echo "🔧 Environment Variables for your application:"
echo "   AZURE_KEYVAULT_URL=https://$KEYVAULT_NAME.vault.azure.net/"
echo "   AZURE_KEYVAULT_NAME=$KEYVAULT_NAME"
echo ""
echo "📝 Next Steps:"
echo "   1. Update your .env file with the Key Vault URL:"
echo "      echo 'AZURE_KEYVAULT_URL=https://$KEYVAULT_NAME.vault.azure.net/' >> .env"
echo ""
echo "   2. Install Azure SDK dependencies:"
echo "      npm install @azure/keyvault-secrets @azure/identity"
echo ""
echo "   3. Update placeholder secrets with real values:"
echo "      az keyvault secret set --vault-name $KEYVAULT_NAME --name 'azure-openai-endpoint' --value 'YOUR_REAL_ENDPOINT'"
echo "      az keyvault secret set --vault-name $KEYVAULT_NAME --name 'azure-openai-key' --value 'YOUR_REAL_KEY'"
echo ""
echo "   4. Test the connection:"
echo "      node -e \"import('./src/lib/azure-keyvault.js').then(m => m.testKeyVaultConnection())\""
echo ""
echo "   5. For production deployment, create a service principal:"
echo "      az ad sp create-for-rbac --name 'retail-insights-app' --role contributor"
echo ""
echo "🔐 Security Notes:"
echo "   • Your current user has full access to this Key Vault"
echo "   • For production, use service principals with minimal permissions"
echo "   • Consider enabling network restrictions for production use"
echo "   • Monitor access logs through Azure Monitor"
echo ""
echo "💰 Cost Information:"
echo "   • Key Vault: \$0.03 per 10,000 operations (25,000 free/month)"
echo "   • Log Analytics: Pay-per-GB ingested"
echo "   • Estimated monthly cost: < \$5 for typical usage"

# Create a simple test script
cat > test-keyvault.js << 'EOF'
// Simple Key Vault connectivity test
const { SecretClient } = require('@azure/keyvault-secrets');
const { DefaultAzureCredential } = require('@azure/identity');

async function testKeyVault() {
  try {
    const vaultUrl = process.env.AZURE_KEYVAULT_URL;
    if (!vaultUrl) {
      console.log('❌ AZURE_KEYVAULT_URL not set');
      return;
    }

    console.log(`🔐 Testing connection to: ${vaultUrl}`);
    
    const credential = new DefaultAzureCredential();
    const client = new SecretClient(vaultUrl, credential);
    
    const secret = await client.getSecret('connection-test');
    
    if (secret.value === 'OK') {
      console.log('✅ Key Vault connection successful!');
    } else {
      console.log('❌ Unexpected test secret value');
    }
  } catch (error) {
    console.log('❌ Key Vault connection failed:', error.message);
  }
}

testKeyVault();
EOF

echo ""
echo "📄 Created test-keyvault.js for connection testing"
echo ""
echo "🎯 Ready to integrate Azure Key Vault with your retail insights dashboard!"