
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lcoxtanyckjzyxxcsjzz.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY
);

async function countProducts() {
  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Total products:', count);
  }
}

countProducts();

