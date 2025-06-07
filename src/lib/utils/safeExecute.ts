export async function safeExecute<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error('Safe execution error:', error);
    throw error;
  }
}
EOF < /dev/null