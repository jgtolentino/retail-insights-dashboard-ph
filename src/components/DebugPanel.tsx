import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function DebugPanel() {
  const [debugInfo, setDebugInfo] = useState({
    envVars: {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      mode: import.meta.env.MODE,
    },
    supabaseConnection: 'testing...',
    supabaseClient: null as any,
  });

  useEffect(() => {
    console.log('🔍 Debug Panel - Starting tests...');
    console.log('Environment Variables:', debugInfo.envVars);
    console.log('Supabase client:', supabase);

    // Test Supabase connection
    const testSupabaseConnection = async () => {
      try {
        console.log('🔍 Testing Supabase connection...');
        
        // Simple health check
        const { data, error } = await supabase
          .from('brands')
          .select('count')
          .limit(1);

        if (error) {
          console.error('❌ Supabase connection failed:', error);
          setDebugInfo(prev => ({
            ...prev,
            supabaseConnection: `Error: ${error.message}`,
          }));
        } else {
          console.log('✅ Supabase connected successfully');
          setDebugInfo(prev => ({
            ...prev,
            supabaseConnection: 'Connected successfully',
          }));
        }
      } catch (err: any) {
        console.error('❌ Supabase test exception:', err);
        setDebugInfo(prev => ({
          ...prev,
          supabaseConnection: `Exception: ${err.message}`,
        }));
      }
    };

    testSupabaseConnection();
  }, []);

  // Only show in development or if there's an error
  if (import.meta.env.MODE === 'production' && debugInfo.supabaseConnection === 'Connected successfully') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-md text-xs z-50">
      <h3 className="font-bold text-yellow-400 mb-2">🔍 Debug Info</h3>
      
      <div className="space-y-2">
        <div>
          <strong>Environment:</strong>
          <ul className="ml-2">
            <li>Mode: {debugInfo.envVars.mode}</li>
            <li>Supabase URL: {debugInfo.envVars.supabaseUrl ? 'Set' : 'Missing'}</li>
            <li>Anon Key: {debugInfo.envVars.hasAnonKey ? 'Set' : 'Missing'}</li>
          </ul>
        </div>
        
        <div>
          <strong>Supabase:</strong>
          <p className={debugInfo.supabaseConnection.includes('Error') ? 'text-red-400' : 'text-green-400'}>
            {debugInfo.supabaseConnection}
          </p>
        </div>
        
        <div>
          <strong>URL:</strong>
          <p className="break-all">{window.location.href}</p>
        </div>
      </div>
      
      <button 
        onClick={() => window.location.reload()}
        className="mt-3 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
      >
        Reload
      </button>
    </div>
  );
}