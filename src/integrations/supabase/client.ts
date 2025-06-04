import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use the actual Supabase project values directly
const supabaseUrl = 'https://lcoxtanyckjzyxxcsjzz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDUzMjcsImV4cCI6MjA2MzkyMTMyN30.W2JgvZdXubvWpKCNZ7TfjLiKANZO1Hlb164fBEKH2dA';

// Export standard client for immediate compatibility
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Environment variables - these should be set in Vercel or your deployment platform
// Use the VITE_SUPABASE_MCP_URL for the Managed Connection Proxy endpoint
const MCP_URL = import.meta.env.VITE_SUPABASE_MCP_URL;

// Function to fetch the short-lived MCP token from our serverless endpoint
const fetchMcpToken = async () => {
  const resp = await fetch('/api/getMcpToken');
  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(`Failed to fetch MCP token: ${resp.status} - ${errorText}`);
  }
  const { token } = await resp.json();
  return token;
};

// Async function to get the Supabase client instance using the fetched token
export async function getSupabaseClient() {
  // If MCP is configured, use it
  if (MCP_URL) {
    try {
      const token = await fetchMcpToken();
      return createClient<Database>(MCP_URL, token);
    } catch (error) {
      console.error('Error initializing Supabase client with MCP:', error);
      // Fallback to standard client
      return supabase;
    }
  }

  // Otherwise use standard client
  return supabase;
}

// Note: You will need to update components and hooks that previously used a
// directly created Supabase client instance to now use the async getSupabaseClient() function.
// For example:
// import { getSupabaseClient } from '@/integrations/supabase/client';
// useEffect(() => {
//   (async () => {
//     try {
//       const supabase = await getSupabaseClient();
//       if (supabase) {
//         // Use the supabase client for queries
//         const { data, error } = await supabase.from('your_table').select('*');
//         if (error) console.error('Supabase query error:', error);
//         else console.log('Data:', data);
//       }
//     } catch (error) {
//       console.error('Failed to get Supabase client:', error);
//     }
//   })();
// }, []);
