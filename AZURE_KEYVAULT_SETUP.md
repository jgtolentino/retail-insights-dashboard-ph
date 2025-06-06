# Azure Key Vault Setup for Retail Insights Dashboard

## Overview

This guide sets up Azure Key Vault to securely manage all credentials for the retail insights dashboard, replacing .env files with enterprise-grade secret management.

## 🔐 Azure Key Vault Benefits

- **Security**: Encrypted storage with access policies
- **Compliance**: Meets enterprise security requirements
- **Auditing**: Complete access logging and monitoring
- **Integration**: Seamless Azure ecosystem integration
- **Rotation**: Automated secret rotation capabilities
- **Cost Effective**: Pay-per-operation model

## 📋 Prerequisites

1. Azure subscription with contributor access
2. Azure CLI installed and configured
3. Node.js application with Azure SDK

## 🚀 Setup Instructions

### Step 1: Create Azure Key Vault

```bash
# Login to Azure
az login

# Set variables
RESOURCE_GROUP="retail-insights-rg"
KEYVAULT_NAME="retail-insights-kv-$(date +%s)"
LOCATION="East US"

# Create resource group
az group create --name $RESOURCE_GROUP --location "$LOCATION"

# Create Key Vault
az keyvault create \
  --name $KEYVAULT_NAME \
  --resource-group $RESOURCE_GROUP \
  --location "$LOCATION" \
  --enabled-for-template-deployment true \
  --sku standard
```

### Step 2: Store Credentials

```bash
# Supabase credentials
az keyvault secret set --vault-name $KEYVAULT_NAME --name "supabase-url" --value "https://lcoxtanyckjzyxxcsjzz.supabase.co"
az keyvault secret set --vault-name $KEYVAULT_NAME --name "supabase-anon-key" --value "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
az keyvault secret set --vault-name $KEYVAULT_NAME --name "supabase-service-key" --value "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Azure OpenAI credentials
az keyvault secret set --vault-name $KEYVAULT_NAME --name "azure-openai-endpoint" --value "https://your-openai.openai.azure.com/"
az keyvault secret set --vault-name $KEYVAULT_NAME --name "azure-openai-key" --value "your-azure-openai-key"

# Database credentials
az keyvault secret set --vault-name $KEYVAULT_NAME --name "database-password" --value "pYadCB3HnyT0z0t4"

# IoT credentials
az keyvault secret set --vault-name $KEYVAULT_NAME --name "iot-device-key" --value "your-iot-device-key"
az keyvault secret set --vault-name $KEYVAULT_NAME --name "iot-connection-string" --value "your-iot-connection-string"

# API keys
az keyvault secret set --vault-name $KEYVAULT_NAME --name "vercel-token" --value "your-vercel-token"
```

### Step 3: Configure Access Policies

```bash
# Get your object ID
USER_OBJECT_ID=$(az ad signed-in-user show --query objectId -o tsv)

# Set access policy for your user
az keyvault set-policy \
  --name $KEYVAULT_NAME \
  --object-id $USER_OBJECT_ID \
  --secret-permissions get list set delete

# For application service principal (if using)
# az keyvault set-policy \
#   --name $KEYVAULT_NAME \
#   --spn "your-app-service-principal" \
#   --secret-permissions get list
```

## 💻 Application Integration

### Install Azure SDK

```bash
npm install @azure/keyvault-secrets @azure/identity
```

### Azure Key Vault Client

```typescript
// src/lib/azure-keyvault.ts
import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';

class AzureKeyVaultClient {
  private client: SecretClient;
  private cache = new Map<string, { value: string; expires: number }>();

  constructor() {
    const vaultUrl =
      process.env.AZURE_KEYVAULT_URL ||
      `https://${process.env.AZURE_KEYVAULT_NAME}.vault.azure.net/`;

    const credential = new DefaultAzureCredential();
    this.client = new SecretClient(vaultUrl, credential);
  }

  async getSecret(secretName: string, useCache = true): Promise<string> {
    // Check cache first (5 minute TTL)
    if (useCache && this.cache.has(secretName)) {
      const cached = this.cache.get(secretName)!;
      if (Date.now() < cached.expires) {
        return cached.value;
      }
    }

    try {
      const secret = await this.client.getSecret(secretName);
      const value = secret.value || '';

      // Cache for 5 minutes
      if (useCache) {
        this.cache.set(secretName, {
          value,
          expires: Date.now() + 5 * 60 * 1000,
        });
      }

      return value;
    } catch (error) {
      console.error(`Failed to get secret ${secretName}:`, error);
      throw new Error(`Secret ${secretName} not found in Key Vault`);
    }
  }

  async getMultipleSecrets(secretNames: string[]): Promise<Record<string, string>> {
    const secrets = await Promise.all(
      secretNames.map(async name => ({
        name,
        value: await this.getSecret(name),
      }))
    );

    return secrets.reduce(
      (acc, { name, value }) => {
        acc[name] = value;
        return acc;
      },
      {} as Record<string, string>
    );
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const keyVaultClient = new AzureKeyVaultClient();
```

### Environment Configuration

```typescript
// src/lib/config.ts
import { keyVaultClient } from './azure-keyvault';

interface AppConfig {
  supabase: {
    url: string;
    anonKey: string;
    serviceKey: string;
  };
  azureOpenAI: {
    endpoint: string;
    apiKey: string;
  };
  database: {
    password: string;
  };
  iot: {
    deviceKey: string;
    connectionString: string;
  };
}

class ConfigManager {
  private config: AppConfig | null = null;

  async getConfig(): Promise<AppConfig> {
    if (this.config) {
      return this.config;
    }

    console.log('🔐 Loading configuration from Azure Key Vault...');

    const secrets = await keyVaultClient.getMultipleSecrets([
      'supabase-url',
      'supabase-anon-key',
      'supabase-service-key',
      'azure-openai-endpoint',
      'azure-openai-key',
      'database-password',
      'iot-device-key',
      'iot-connection-string',
    ]);

    this.config = {
      supabase: {
        url: secrets['supabase-url'],
        anonKey: secrets['supabase-anon-key'],
        serviceKey: secrets['supabase-service-key'],
      },
      azureOpenAI: {
        endpoint: secrets['azure-openai-endpoint'],
        apiKey: secrets['azure-openai-key'],
      },
      database: {
        password: secrets['database-password'],
      },
      iot: {
        deviceKey: secrets['iot-device-key'],
        connectionString: secrets['iot-connection-string'],
      },
    };

    console.log('✅ Configuration loaded successfully');
    return this.config;
  }

  async refreshConfig(): Promise<void> {
    keyVaultClient.clearCache();
    this.config = null;
    await this.getConfig();
  }
}

export const configManager = new ConfigManager();
```

### Updated Supabase Client

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { configManager } from './config';

let supabaseClient: any = null;

export async function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const config = await configManager.getConfig();

  supabaseClient = createClient(config.supabase.url, config.supabase.anonKey);

  return supabaseClient;
}

export async function getSupabaseServiceClient() {
  const config = await configManager.getConfig();

  return createClient(config.supabase.url, config.supabase.serviceKey);
}
```

### Updated Azure OpenAI Client

```typescript
// src/services/azure-openai.ts
import { OpenAIApi, Configuration } from 'openai';
import { configManager } from '@/lib/config';

class AzureOpenAIService {
  private openai: OpenAIApi | null = null;

  async getClient(): Promise<OpenAIApi> {
    if (this.openai) {
      return this.openai;
    }

    const config = await configManager.getConfig();

    const configuration = new Configuration({
      apiKey: config.azureOpenAI.apiKey,
      basePath: `${config.azureOpenAI.endpoint}/openai/deployments`,
      baseOptions: {
        headers: {
          'api-key': config.azureOpenAI.apiKey,
        },
        params: {
          'api-version': '2023-12-01-preview',
        },
      },
    });

    this.openai = new OpenAIApi(configuration);
    return this.openai;
  }

  async generateRetailInsights(salesData: any): Promise<any> {
    const client = await this.getClient();

    const response = await client.createChatCompletion({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are a retail analytics AI specializing in Filipino consumer behavior and TBWA client insights.',
        },
        {
          role: 'user',
          content: `Analyze this retail data: ${JSON.stringify(salesData)}`,
        },
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });

    return response.data.choices[0].message?.content;
  }
}

export const azureOpenAIService = new AzureOpenAIService();
```

## 🔧 Deployment Configuration

### Azure App Service Configuration

```bash
# Set Key Vault URL in App Service
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name "retail-insights-app" \
  --settings AZURE_KEYVAULT_URL="https://$KEYVAULT_NAME.vault.azure.net/"
```

### Vercel Configuration

```bash
# For Vercel deployment, set these environment variables:
# AZURE_KEYVAULT_URL=https://your-keyvault.vault.azure.net/
# AZURE_CLIENT_ID=your-client-id  (if using service principal)
# AZURE_CLIENT_SECRET=your-client-secret  (if using service principal)
# AZURE_TENANT_ID=your-tenant-id  (if using service principal)
```

## 🔒 Security Best Practices

### Access Policies

- Use least-privilege access
- Separate read/write permissions
- Regular access reviews

### Network Security

```bash
# Restrict Key Vault access to specific networks
az keyvault update \
  --name $KEYVAULT_NAME \
  --default-action Deny

# Allow specific IPs or VNets
az keyvault network-rule add \
  --name $KEYVAULT_NAME \
  --ip-address "your-ip-address"
```

### Monitoring

```bash
# Enable diagnostic settings
az monitor diagnostic-settings create \
  --name "keyvault-diagnostics" \
  --resource "/subscriptions/{subscription-id}/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.KeyVault/vaults/$KEYVAULT_NAME" \
  --logs '[{"category":"AuditEvent","enabled":true}]' \
  --workspace "/subscriptions/{subscription-id}/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.OperationalInsights/workspaces/retail-insights-workspace"
```

## 📊 Cost Optimization

- **Free Tier**: 25,000 operations/month
- **Standard Tier**: $0.03 per 10,000 operations
- **Premium Tier**: HSM-backed keys for extra security

## 🔄 Migration from .env

1. **Gradual Migration**: Update one service at a time
2. **Fallback Support**: Keep .env as backup during transition
3. **Testing**: Thoroughly test each credential migration
4. **Documentation**: Update all deployment docs

## 📋 Credential Inventory

Current credentials to migrate:

- ✅ Supabase URL & Keys
- ✅ Azure OpenAI Endpoint & Key
- ✅ Database Password
- ✅ IoT Device Keys
- ✅ Vercel Deployment Token
- 🔄 Future: Azure Service Bus, Storage Account keys

## 🎯 Next Steps

1. Create Azure Key Vault instance
2. Migrate critical credentials first (Supabase, Azure OpenAI)
3. Update application code to use Key Vault client
4. Test thoroughly in development
5. Deploy to production with Key Vault integration
6. Monitor and optimize access patterns

This setup provides enterprise-grade security while maintaining the cost efficiency of the Supabase + Vercel architecture.
