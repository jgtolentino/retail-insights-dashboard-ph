#!/bin/bash

# Azure App Service Deployment Script
# Make sure you have Azure CLI installed: brew install azure-cli

echo "🚀 Starting Azure App Service deployment..."

# Variables - Update these!
RESOURCE_GROUP="rg-retail-dashboard"
LOCATION="Southeast Asia"
APP_NAME="retail-insights-dashboard-ph"
PLAN_NAME="asp-retail-dashboard"
NODE_VERSION="18-lts"

# Login to Azure
echo "📝 Logging into Azure..."
az login

# Create resource group
echo "📦 Creating resource group..."
az group create --name $RESOURCE_GROUP --location "$LOCATION"

# Create App Service plan (Linux, B1 tier)
echo "📋 Creating App Service plan..."
az appservice plan create \
  --name $PLAN_NAME \
  --resource-group $RESOURCE_GROUP \
  --location "$LOCATION" \
  --sku B1 \
  --is-linux

# Create Web App
echo "🌐 Creating Web App..."
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $PLAN_NAME \
  --name $APP_NAME \
  --runtime "NODE:$NODE_VERSION"

# Configure app settings
echo "⚙️ Configuring app settings..."
read -p "Enter your VITE_SUPABASE_URL: " SUPABASE_URL
read -p "Enter your VITE_SUPABASE_ANON_KEY: " SUPABASE_KEY

az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings \
    VITE_SUPABASE_URL=$SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$SUPABASE_KEY \
    NODE_ENV=production \
    WEBSITE_NODE_DEFAULT_VERSION=$NODE_VERSION

# Configure startup command
echo "🚀 Setting startup command..."
az webapp config set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --startup-file "node server.js"

# Enable CORS for all origins (update for production)
echo "🔓 Configuring CORS..."
az webapp cors add \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --allowed-origins "*"

# Build the application
echo "🔨 Building application..."
npm ci
npm run build

# Create deployment package
echo "📦 Creating deployment package..."
zip -r deploy.zip . -x "node_modules/*" ".git/*" "*.log" ".env*"

# Deploy using ZIP deploy
echo "🚢 Deploying to Azure..."
az webapp deployment source config-zip \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --src deploy.zip

# Get the app URL
APP_URL=$(az webapp show --resource-group $RESOURCE_GROUP --name $APP_NAME --query defaultHostName -o tsv)

echo "✅ Deployment complete!"
echo "🌐 Your app is available at: https://$APP_URL"
echo ""
echo "📝 To view logs, run:"
echo "   az webapp log tail --resource-group $RESOURCE_GROUP --name $APP_NAME"
echo ""
echo "🔄 To redeploy, run this script again or use GitHub Actions"

# Clean up
rm deploy.zip