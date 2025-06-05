import { runBenchmarks } from '@/scripts/benchmark-dashboard';

export async function GET() {
  try {
    const results = await runBenchmarks();

    // Calculate overall metrics from the detailed results
    const endpointNames = Object.keys(results);
    const overallAvgDuration =
      endpointNames.reduce((sum, name) => sum + results[name].duration, 0) / endpointNames.length;

    // For percentiles and success rate, it's better to use the individual benchmark results
    // The runBenchmarks script already prints detailed results, which is sufficient for now.
    // If needed, we can modify runBenchmarks to return more structured data including percentiles.

    // For simplicity, returning the raw results from runBenchmarks for now.
    // The frontend can process this to show individual endpoint stats.

    return Response.json(results);
  } catch (error) {
    console.error('Error running benchmarks:', error);
    return new Response(JSON.stringify({ error: 'Failed to run benchmarks' }), { status: 500 });
  }
}
