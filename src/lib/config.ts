import { getKeyVaultClient } from './azure-keyvault';

interface AppConfig {
  supabase: {
    url: string;
    anonKey: string;
    serviceKey: string;
  };
  azureOpenAI: {
    endpoint: string;
    apiKey: string;
    deploymentName: string;
  };
  database: {
    password: string;
  };
  iot: {
    deviceKey: string;
    connectionString: string;
  };
  deployment: {
    environment: 'development' | 'staging' | 'production';
    vercelToken?: string;
  };
}

class ConfigManager {
  private config: AppConfig | null = null;
  private useKeyVault: boolean;

  constructor() {
    // Determine if we should use Key Vault based on environment
    this.useKeyVault = !!(
      process.env.AZURE_KEYVAULT_URL ||
      process.env.AZURE_KEYVAULT_NAME ||
      process.env.NODE_ENV === 'production'
    );

    console.log(
      `🔧 Config mode: ${this.useKeyVault ? 'Azure Key Vault' : 'Environment Variables'}`
    );
  }

  async getConfig(): Promise<AppConfig> {
    if (this.config) {
      return this.config;
    }

    if (this.useKeyVault) {
      return await this.loadFromKeyVault();
    } else {
      return await this.loadFromEnvironment();
    }
  }

  private async loadFromKeyVault(): Promise<AppConfig> {
    console.log('🔐 Loading configuration from Azure Key Vault...');

    try {
      const keyVault = getKeyVaultClient();

      const secrets = await keyVault.getMultipleSecrets([
        'supabase-url',
        'supabase-anon-key',
        'supabase-service-key',
        'azure-openai-endpoint',
        'azure-openai-key',
        'azure-openai-deployment',
        'database-password',
        'iot-device-key',
        'iot-connection-string',
        'vercel-token',
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
          deploymentName: secrets['azure-openai-deployment'] || 'gpt-4',
        },
        database: {
          password: secrets['database-password'],
        },
        iot: {
          deviceKey: secrets['iot-device-key'] || 'placeholder-key',
          connectionString: secrets['iot-connection-string'] || 'placeholder-connection',
        },
        deployment: {
          environment: (process.env.NODE_ENV as any) || 'development',
          vercelToken: secrets['vercel-token'],
        },
      };

      console.log('✅ Configuration loaded from Key Vault');
      return this.config;
    } catch (error) {
      console.error('❌ Failed to load from Key Vault, falling back to environment variables');
      return await this.loadFromEnvironment();
    }
  }

  private async loadFromEnvironment(): Promise<AppConfig> {
    console.log('📁 Loading configuration from environment variables...');

    // Validate required environment variables
    const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];

    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    this.config = {
      supabase: {
        url: process.env.VITE_SUPABASE_URL!,
        anonKey: process.env.VITE_SUPABASE_ANON_KEY!,
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      },
      azureOpenAI: {
        endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
        apiKey: process.env.AZURE_OPENAI_API_KEY || '',
        deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4',
      },
      database: {
        password: process.env.DATABASE_PASSWORD || '',
      },
      iot: {
        deviceKey: process.env.IOT_DEVICE_KEY || 'dev-placeholder-key',
        connectionString: process.env.IOT_CONNECTION_STRING || 'dev-placeholder-connection',
      },
      deployment: {
        environment: (process.env.NODE_ENV as any) || 'development',
        vercelToken: process.env.VERCEL_TOKEN,
      },
    };

    console.log('✅ Configuration loaded from environment variables');
    return this.config;
  }

  async refreshConfig(): Promise<void> {
    console.log('🔄 Refreshing configuration...');

    if (this.useKeyVault) {
      const keyVault = getKeyVaultClient();
      keyVault.clearCache();
    }

    this.config = null;
    await this.getConfig();
    console.log('✅ Configuration refreshed');
  }

  getConfigSummary(): any {
    if (!this.config) {
      return { status: 'not_loaded' };
    }

    return {
      status: 'loaded',
      source: this.useKeyVault ? 'key_vault' : 'environment',
      supabase: {
        url: this.config.supabase.url ? '✅ Set' : '❌ Missing',
        anonKey: this.config.supabase.anonKey ? '✅ Set' : '❌ Missing',
        serviceKey: this.config.supabase.serviceKey ? '✅ Set' : '❌ Missing',
      },
      azureOpenAI: {
        endpoint: this.config.azureOpenAI.endpoint ? '✅ Set' : '❌ Missing',
        apiKey: this.config.azureOpenAI.apiKey ? '✅ Set' : '❌ Missing',
        deployment: this.config.azureOpenAI.deploymentName,
      },
      iot: {
        deviceKey: this.config.iot.deviceKey !== 'placeholder-key' ? '✅ Set' : '⚠️  Placeholder',
        connectionString:
          this.config.iot.connectionString !== 'placeholder-connection'
            ? '✅ Set'
            : '⚠️  Placeholder',
      },
      environment: this.config.deployment.environment,
    };
  }
}

// Singleton instance
export const configManager = new ConfigManager();

// Helper function for Next.js API routes
export async function getServerConfig(): Promise<AppConfig> {
  return await configManager.getConfig();
}

// Helper function for client-side (limited config)
export function getClientConfig() {
  return {
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
    },
    environment: process.env.NODE_ENV || 'development',
  };
}
