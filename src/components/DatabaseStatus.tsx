import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function DatabaseStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      // Simple query to test connection
      const { data, error } = await supabase.from('brands').select('count').limit(1);

      if (error) throw error;

      setStatus('connected');
      setMessage('Database connected');
    } catch (error) {
      setStatus('error');
      setMessage('Database connection failed');
    }
  };

  if (status === 'checking') return null;

  return (
    <div
      className={`fixed bottom-4 right-4 rounded px-3 py-1 text-xs ${
        status === 'connected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}
      style={{ zIndex: 9999 }}
    >
      {status === 'connected' ? '✅' : '❌'} {message}
    </div>
  );
}

export default DatabaseStatus;
