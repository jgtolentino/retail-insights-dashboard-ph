import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential, ClientSecretCredential } from '@azure/identity';

interface CachedSecret {
  value: string;
  expires: number;
}

class AzureKeyVaultClient {
  private client: SecretClient;
  private cache = new Map<string, CachedSecret>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    const vaultUrl =
      process.env.AZURE_KEYVAULT_URL ||
      `https://${process.env.AZURE_KEYVAULT_NAME}.vault.azure.net/`;

    if (!vaultUrl || vaultUrl.includes('undefined')) {
      throw new Error(
        'Azure Key Vault URL not configured. Set AZURE_KEYVAULT_URL or AZURE_KEYVAULT_NAME'
      );
    }

    let credential;

    // Use service principal if configured, otherwise use default credential
    if (
      process.env.AZURE_CLIENT_ID &&
      process.env.AZURE_CLIENT_SECRET &&
      process.env.AZURE_TENANT_ID
    ) {
      credential = new ClientSecretCredential(
        process.env.AZURE_TENANT_ID,
        process.env.AZURE_CLIENT_ID,
        process.env.AZURE_CLIENT_SECRET
      );
    } else {
      credential = new DefaultAzureCredential();
    }

    this.client = new SecretClient(vaultUrl, credential);
  }

  async getSecret(secretName: string, useCache = true): Promise<string> {
    // Check cache first
    if (useCache && this.cache.has(secretName)) {
      const cached = this.cache.get(secretName)!;
      if (Date.now() < cached.expires) {
        return cached.value;
      }
    }

    try {
      console.log(`🔐 Retrieving secret: ${secretName}`);
      const secret = await this.client.getSecret(secretName);
      const value = secret.value || '';

      if (!value) {
        throw new Error(`Secret ${secretName} is empty`);
      }

      // Cache the secret
      if (useCache) {
        this.cache.set(secretName, {
          value,
          expires: Date.now() + this.cacheTimeout,
        });
      }

      console.log(`✅ Retrieved secret: ${secretName}`);
      return value;
    } catch (error: any) {
      console.error(`❌ Failed to get secret ${secretName}:`, error.message);

      // Fallback to environment variable if Key Vault fails
      const envFallback = this.getEnvironmentFallback(secretName);
      if (envFallback) {
        console.log(`🔄 Using environment fallback for ${secretName}`);
        return envFallback;
      }

      throw new Error(`Secret ${secretName} not found in Key Vault and no fallback available`);
    }
  }

  private getEnvironmentFallback(secretName: string): string | null {
    const fallbackMap: Record<string, string> = {
      'supabase-url': 'VITE_SUPABASE_URL',
      'supabase-anon-key': 'VITE_SUPABASE_ANON_KEY',
      'supabase-service-key': 'SUPABASE_SERVICE_ROLE_KEY',
      'azure-openai-endpoint': 'AZURE_OPENAI_ENDPOINT',
      'azure-openai-key': 'AZURE_OPENAI_API_KEY',
      'database-password': 'DATABASE_PASSWORD',
      'iot-device-key': 'IOT_DEVICE_KEY',
      'iot-connection-string': 'IOT_CONNECTION_STRING',
    };

    const envVarName = fallbackMap[secretName];
    return envVarName ? process.env[envVarName] || null : null;
  }

  async getMultipleSecrets(secretNames: string[]): Promise<Record<string, string>> {
    console.log(`🔐 Retrieving ${secretNames.length} secrets from Key Vault...`);

    const secrets = await Promise.allSettled(
      secretNames.map(async name => ({
        name,
        value: await this.getSecret(name),
      }))
    );

    const result: Record<string, string> = {};
    const failed: string[] = [];

    secrets.forEach((secret, index) => {
      const secretName = secretNames[index];
      if (secret.status === 'fulfilled') {
        result[secretName] = secret.value.value;
      } else {
        failed.push(secretName);
        console.error(`❌ Failed to retrieve ${secretName}:`, secret.reason);
      }
    });

    if (failed.length > 0) {
      console.warn(`⚠️  Failed to retrieve ${failed.length} secrets: ${failed.join(', ')}`);
    }

    console.log(
      `✅ Successfully retrieved ${Object.keys(result).length}/${secretNames.length} secrets`
    );
    return result;
  }

  clearCache(): void {
    this.cache.clear();
    console.log('🧹 Key Vault cache cleared');
  }

  getCacheStats(): { size: number; secrets: string[] } {
    return {
      size: this.cache.size,
      secrets: Array.from(this.cache.keys()),
    };
  }
}

// Singleton instance
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
    await client.getSecret('connection-test', false);
    return true;
  } catch (error) {
    console.error('Key Vault connection test failed:', error);
    return false;
  }
}
