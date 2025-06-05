import { performance } from 'perf_hooks';
import { supabase } from '../src/integrations/supabase/client';

interface BenchmarkResult {
  name: string;
  duration: number;
  success: boolean;
  error?: string;
}

const THRESHOLD = 1000; // 1 second threshold for slow queries

const benchmarks = {
  'Dashboard Summary': async () => {
    const start = performance.now();
    try {
      const { data, error } = await supabase.rpc('get_dashboard_summary');
      if (error) throw error;
      return { success: true, duration: performance.now() - start };
    } catch (error) {
      return { 
        success: false, 
        duration: performance.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  'Brand Performance': async () => {
    const start = performance.now();
    try {
      const { data, error } = await supabase
        .from('mv_brand_performance')
        .select('*')
        .limit(15);
      if (error) throw error;
      return { success: true, duration: performance.now() - start };
    } catch (error) {
      return { 
        success: false, 
        duration: performance.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  'Store Performance': async () => {
    const start = performance.now();
    try {
      const { data, error } = await supabase
        .from('mv_store_performance')
        .select('*')
        .limit(20);
      if (error) throw error;
      return { success: true, duration: performance.now() - start };
    } catch (error) {
      return { 
        success: false, 
        duration: performance.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  'Time Series Data': async () => {
    const start = performance.now();
    try {
      const { data, error } = await supabase
        .from('mv_daily_dashboard_summary')
        .select('*')
        .order('day', { ascending: false })
        .limit(30);
      if (error) throw error;
      return { success: true, duration: performance.now() - start };
    } catch (error) {
      return { 
        success: false, 
        duration: performance.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

async function runBenchmarks() {
  console.log('🚀 Starting dashboard benchmarks...\n');
  
  const results: BenchmarkResult[] = [];
  
  for (const [name, benchmark] of Object.entries(benchmarks)) {
    console.log(`Running ${name}...`);
    const result = await benchmark();
    results.push({
      name,
      duration: result.duration,
      success: result.success,
      error: result.error
    });
    
    console.log(
      result.success
        ? `✅ ${name}: ${result.duration.toFixed(2)}ms`
        : `❌ ${name}: Failed (${result.error})`
    );
  }
  
  // Analyze results
  console.log('\n📊 Benchmark Results:');
  console.log('=====================');
  
  const slowQueries = results.filter(r => r.success && r.duration > THRESHOLD);
  const failedQueries = results.filter(r => !r.success);
  
  if (slowQueries.length > 0) {
    console.log('\n⚠️ Slow Queries Detected:');
    slowQueries.forEach(q => {
      console.log(`- ${q.name}: ${q.duration.toFixed(2)}ms`);
    });
  }
  
  if (failedQueries.length > 0) {
    console.log('\n❌ Failed Queries:');
    failedQueries.forEach(q => {
      console.log(`- ${q.name}: ${q.error}`);
    });
  }
  
  // Summary statistics
  const successfulQueries = results.filter(r => r.success);
  if (successfulQueries.length > 0) {
    const avgDuration = successfulQueries.reduce((sum, q) => sum + q.duration, 0) / successfulQueries.length;
    const maxDuration = Math.max(...successfulQueries.map(q => q.duration));
    
    console.log('\n📈 Performance Summary:');
    console.log(`- Average Duration: ${avgDuration.toFixed(2)}ms`);
    console.log(`- Maximum Duration: ${maxDuration.toFixed(2)}ms`);
    console.log(`- Success Rate: ${(successfulQueries.length / results.length * 100).toFixed(1)}%`);
  }
  
  // Exit with error if any queries failed
  if (failedQueries.length > 0) {
    process.exit(1);
  }
}

// Run benchmarks
runBenchmarks().catch(error => {
  console.error('❌ Benchmark error:', error);
  process.exit(1);
}); 