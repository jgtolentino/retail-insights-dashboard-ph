import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential, ClientSecretCredential } from '@azure/identity';
import { logger } from '../utils/logger';

interface SecretCache {
  value: string;
  expiresAt: number;
}

class AzureKeyVaultClient {
  private client: SecretClient | null = null;
  private cache: Map<string, SecretCache> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    const keyVaultUrl = 
      process.env.AZURE_KEYVAULT_URL ||
      `https://${process.env.AZURE_KEYVAULT_NAME}.vault.azure.net/`;

    if (!keyVaultUrl) {
      throw new Error(
        'Azure Key Vault URL not configured. Set AZURE_KEYVAULT_URL or AZURE_KEYVAULT_NAME'
      );
    }

    try {
      const credential = new DefaultAzureCredential();
      this.client = new SecretClient(keyVaultUrl, credential);
      logger.info('Azure Key Vault client initialized');
    } catch (error) {
      logger.error('Failed to initialize Azure Key Vault client:', error);
      throw error;
    }
  }

  private async getSecret(name: string): Promise<string> {
    try {
      // Check cache first
      const cached = this.cache.get(name);
      if (cached && Date.now() < cached.expiresAt) {
        logger.debug(`Using cached secret: ${name}`);
        return cached.value;
      }

      if (!this.client) {
        throw new Error('Key Vault client not initialized');
      }

      const secret = await this.client.getSecret(name);
      if (!secret.value) {
        throw new Error(`Secret ${name} not found or has no value`);
      }

      // Cache the secret
      this.cache.set(name, {
        value: secret.value,
        expiresAt: Date.now() + this.CACHE_TTL,
      });

      return secret.value;
    } catch (error) {
      logger.error(`Failed to get secret ${name}:`, error);
      throw error;
    }
  }

  async getMultipleSecrets(names: string[]): Promise<Record<string, string>> {
    try {
      const secrets: Record<string, string> = {};
      await Promise.all(
        names.map(async (name) => {
          secrets[name] = await this.getSecret(name);
        })
      );
      return secrets;
    } catch (error) {
      logger.error('Failed to get multiple secrets:', error);
      throw error;
    }
  }

  clearCache(): void {
    this.cache.clear();
    logger.info('Key Vault cache cleared');
  }

  // Map environment variable names to Key Vault secret names
  private readonly envToSecretMap: Record<string, string> = {
    'VITE_SUPABASE_URL': 'supabase-url',
    'VITE_SUPABASE_ANON_KEY': 'supabase-anon-key',
    'SUPABASE_SERVICE_ROLE_KEY': 'supabase-service-role-key',
    'GROQ_API_KEY': 'groq-api-key',
    'AZURE_OPENAI_ENDPOINT': 'azure-openai-endpoint',
    'AZURE_OPENAI_API_KEY': 'azure-openai-key',
    'AZURE_OPENAI_DEPLOYMENT_NAME': 'azure-openai-deployment',
    'DATABRICKS_HOST': 'databricks-host',
    'DATABRICKS_TOKEN': 'databricks-token',
    'DATABRICKS_GENIE_SPACE_ID': 'databricks-genie-space-id',
    'EDGE_DEVICE_AUTH_TOKEN': 'edge-device-auth-token',
  };

  async syncEnvironmentVariables(): Promise<void> {
    try {
      const secrets = await this.getMultipleSecrets(Object.values(this.envToSecretMap));
      
      // Update environment variables
      Object.entries(this.envToSecretMap).forEach(([envVar, secretName]) => {
        if (secrets[secretName]) {
          process.env[envVar] = secrets[secretName];
          logger.info(`Updated environment variable: ${envVar}`);
        }
      });
    } catch (error) {
      logger.error('Failed to sync environment variables:', error);
      throw error;
    }
  }
}

let keyVaultClient: AzureKeyVaultClient | null = null;

export function getKeyVaultClient(): AzureKeyVaultClient {
  if (!keyVaultClient) {
    keyVaultClient = new AzureKeyVaultClient();
  }
  return keyVaultClient;
}

// Helper function for testing Key Vault connectivity
export async function testKeyVaultConnection(): Promise<boolean> {
  try {
    const client = getKeyVaultClient();
    // Try to get a known secret (you might need to create a test secret)
    await client.getSecret('connection-test');
    return true;
  } catch (error) {
    return false;
  }
}
