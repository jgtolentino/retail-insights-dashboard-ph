#!/bin/bash

echo "🔐 Setting up local environment from Azure Key Vault..."

# Login to Azure
az login

# Set Key Vault name
KV_NAME="retail-insights-kv"

# Create .env.local file
cat > .env.local << EOF
# Auto-generated from Azure Key Vault
# Generated: $(date)

# Supabase
VITE_SUPABASE_URL=$(az keyvault secret show --vault-name $KV_NAME --name supabase-url --query value -o tsv)
VITE_SUPABASE_ANON_KEY=$(az keyvault secret show --vault-name $KV_NAME --name supabase-anon-key --query value -o tsv)
SUPABASE_SERVICE_ROLE_KEY=$(az keyvault secret show --vault-name $KV_NAME --name supabase-service-role-key --query value -o tsv)

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=$(az keyvault secret show --vault-name $KV_NAME --name azure-openai-endpoint --query value -o tsv)
AZURE_OPENAI_API_KEY=$(az keyvault secret show --vault-name $KV_NAME --name azure-openai-key --query value -o tsv)
AZURE_OPENAI_DEPLOYMENT_NAME=$(az keyvault secret show --vault-name $KV_NAME --name azure-openai-deployment --query value -o tsv)

# Azure Key Vault
AZURE_KEYVAULT_URL=https://$KV_NAME.vault.azure.net/
AZURE_KEYVAULT_NAME=$KV_NAME

# Optional: Service Principal (if using)
# AZURE_CLIENT_ID=$(az keyvault secret show --vault-name $KV_NAME --name azure-client-id --query value -o tsv)
# AZURE_CLIENT_SECRET=$(az keyvault secret show --vault-name $KV_NAME --name azure-client-secret --query value -o tsv)
# AZURE_TENANT_ID=$(az keyvault secret show --vault-name $KV_NAME --name azure-tenant-id --query value -o tsv)

# Sentry (if enabled)
VITE_SENTRY_DSN=$(az keyvault secret show --vault-name $KV_NAME --name sentry-dsn --query value -o tsv)

# Build Info
VITE_BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
EOF

echo "✅ Environment file created successfully!"
echo "⚠️  Remember: Never commit .env.local to git!"

# Make the script executable
chmod +x scripts/setup-local-env.sh 