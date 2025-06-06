export default async function handler(req, res) {
  try {
    // Try to connect to Supabase
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    );

    // Test database connection
    const { data, error, count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return res.status(500).json({
        status: 'error',
        message: error.message,
        env_check: {
          has_url: !!process.env.VITE_SUPABASE_URL,
          has_key: !!process.env.VITE_SUPABASE_ANON_KEY
        }
      });
    }

    // Test getting actual data
    const { data: sampleData } = await supabase
      .from('transactions')
      .select('total_amount, customer_age, store_location')
      .limit(5);

    return res.status(200).json({
      status: 'connected',
      total_transactions: count,
      sample_data: sampleData,
      timestamp: new Date().toISOString(),
      env_check: {
        has_url: !!process.env.VITE_SUPABASE_URL,
        has_key: !!process.env.VITE_SUPABASE_ANON_KEY,
        url_preview: process.env.VITE_SUPABASE_URL?.slice(0, 30) + '...'
      }
    });

  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}