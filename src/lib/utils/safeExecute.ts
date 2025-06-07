/**
 * Safe execution wrapper for tool functions
 * Provides consistent error handling and logging
 */
export async function safeExecute<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e: any) {
    console.error('Tool execution error:', e);
    throw new Error(`Tool error: ${e.message}`);
  }
}

export function safeSync<T>(fn: () => T): T {
  try {
    return fn();
  } catch (e: any) {
    console.error('Sync execution error:', e);
    throw new Error(`Sync error: ${e.message}`);
  }
}