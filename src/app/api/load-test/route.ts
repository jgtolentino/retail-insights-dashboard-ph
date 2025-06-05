import { runLoadTest } from '@/scripts/load-test';

export async function POST(request: Request) {
  try {
    const { concurrent, iterations } = await request.json();
    const results = await runLoadTest(concurrent, iterations);
    return Response.json(results);
  } catch (error) {
    console.error('Error running load test:', error);
    return new Response(JSON.stringify({ error: 'Failed to run load test' }), { status: 500 });
  }
}
