import React from 'react';
import { supabaseConfig } from '@/integrations/supabase/client';

export default function EnvTest() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Environment Variables Test</h1>
      
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Supabase Configuration</h2>
        <div className="space-y-3">
          <div>
            <strong>URL:</strong> 
            <code className="ml-2 bg-gray-100 px-2 py-1 rounded">
              {import.meta.env.VITE_SUPABASE_URL || 'NOT SET'}
            </code>
          </div>
          <div>
            <strong>Anon Key:</strong> 
            <code className="ml-2 bg-gray-100 px-2 py-1 rounded">
              {import.meta.env.VITE_SUPABASE_ANON_KEY ? 
                `${import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 30)}...` : 
                'NOT SET'}
            </code>
          </div>
          <div>
            <strong>Environment:</strong> 
            <code className="ml-2 bg-gray-100 px-2 py-1 rounded">
              {import.meta.env.MODE}
            </code>
          </div>
          <div>
            <strong>Has Anon Key:</strong> 
            <code className="ml-2 bg-gray-100 px-2 py-1 rounded">
              {supabaseConfig.hasAnonKey ? 'Yes' : 'No'}
            </code>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">All Environment Variables</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(import.meta.env).map(([key, value]) => (
            <div key={key} className="border-b pb-2">
              <strong className="text-sm">{key}:</strong>
              <div className="text-sm text-gray-600 break-all">
                {typeof value === 'string' ? 
                  (value.length > 50 ? `${value.substring(0, 50)}...` : value) : 
                  String(value)}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify({
            supabaseConfig,
            envVars: {
              VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
              VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
              MODE: import.meta.env.MODE,
              DEV: import.meta.env.DEV,
              PROD: import.meta.env.PROD
            }
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
}