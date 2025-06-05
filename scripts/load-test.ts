import { performance } from 'perf_hooks';
import { supabase } from '../src/integrations/supabase/client';

interface LoadTestResult {
  duration: number;
  success: boolean;
  error?: string;
}

interface LoadTestSummary {
  totalRequests: number;
  successRate: number;
  avgDuration: number;
  maxDuration: number;
  errorRate: number;
  percentiles: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
}

const SCENARIOS = [
  {
    name: 'Dashboard Summary',
    execute: async () => {
      const { data, error } = await supabase.rpc('get_dashboard_summary');
      if (error) throw error;
      return data;
    }
  },
  {
    name: 'Brand Performance',
    execute: async () => {
      const { data, error } = await supabase
        .from('mv_brand_performance')
        .select('*')
        .limit(15);
      if (error) throw error;
      return data;
    }
  },
  {
    name: 'Store Performance',
    execute: async () => {
      const { data, error } = await supabase
        .from('mv_store_performance')
        .select('*')
        .limit(20);
      if (error) throw error;
      return data;
    }
  },
  {
    name: 'Time Series Data',
    execute: async () => {
      const { data, error } = await supabase
        .from('mv_daily_dashboard_summary')
        .select('*')
        .order('day', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data;
    }
  }
];

function calculatePercentiles(durations: number[]): { p50: number; p90: number; p95: number; p99: number } {
  const sorted = [...durations].sort((a, b) => a - b);
  return {
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p90: sorted[Math.floor(sorted.length * 0.9)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)]
  };
}

async function runLoadTest(concurrent: number = 10, iterations: number = 100): Promise<LoadTestSummary> {
  console.log(`🚀 Starting load test with ${concurrent} concurrent users, ${iterations} iterations...`);
  
  const results: LoadTestResult[] = [];
  
  for (let i = 0; i < iterations; i++) {
    console.log(`\nIteration ${i + 1}/${iterations}`);
    
    const batch = Array(concurrent).fill(null).map(async () => {
      const scenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
      const start = performance.now();
      
      try {
        await scenario.execute();
        return {
          duration: performance.now() - start,
          success: true
        };
      } catch (error) {
        return {
          duration: performance.now() - start,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });
    
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
    
    // Log progress
    const successful = batchResults.filter(r => r.success).length;
    console.log(`Batch complete: ${successful}/${concurrent} successful`);
  }
  
  // Calculate statistics
  const successful = results.filter(r => r.success);
  const durations = successful.map(r => r.duration);
  
  const summary: LoadTestSummary = {
    totalRequests: results.length,
    successRate: (successful.length / results.length) * 100,
    avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
    maxDuration: Math.max(...durations),
    errorRate: ((results.length - successful.length) / results.length) * 100,
    percentiles: calculatePercentiles(durations)
  };
  
  // Print results
  console.log('\n📊 Load Test Results:');
  console.log('=====================');
  console.log(`Total Requests: ${summary.totalRequests}`);
  console.log(`Success Rate: ${summary.successRate.toFixed(2)}%`);
  console.log(`Error Rate: ${summary.errorRate.toFixed(2)}%`);
  console.log(`\nResponse Times:`);
  console.log(`- Average: ${summary.avgDuration.toFixed(2)}ms`);
  console.log(`- Maximum: ${summary.maxDuration.toFixed(2)}ms`);
  console.log(`- 50th percentile: ${summary.percentiles.p50.toFixed(2)}ms`);
  console.log(`- 90th percentile: ${summary.percentiles.p90.toFixed(2)}ms`);
  console.log(`- 95th percentile: ${summary.percentiles.p95.toFixed(2)}ms`);
  console.log(`- 99th percentile: ${summary.percentiles.p99.toFixed(2)}ms`);
  
  return summary;
}

// Run load test if executed directly
if (require.main === module) {
  const concurrent = parseInt(process.argv[2]) || 10;
  const iterations = parseInt(process.argv[3]) || 100;
  
  runLoadTest(concurrent, iterations).catch(error => {
    console.error('❌ Load test error:', error);
    process.exit(1);
  });
}

export { runLoadTest, LoadTestSummary }; 