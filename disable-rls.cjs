const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function disableRLS() {
  console.log('🔧 Disabling RLS on brands and stores tables...');
  
  const { error: brandsError } = await supabase.rpc('exec_sql', {
    query: 'ALTER TABLE brands DISABLE ROW LEVEL SECURITY;'
  });
  
  const { error: storesError } = await supabase.rpc('exec_sql', {
    query: 'ALTER TABLE stores DISABLE ROW LEVEL SECURITY;'
  });
  
  if (brandsError) console.error('Error disabling RLS on brands:', brandsError);
  if (storesError) console.error('Error disabling RLS on stores:', storesError);
  
  if (!brandsError && !storesError) {
    console.log('✅ RLS disabled successfully');
  }
}

disableRLS();