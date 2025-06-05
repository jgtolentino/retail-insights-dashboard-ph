import { performance } from 'perf_hooks';
import { supabase } from '../src/integrations/supabase/client';

interface Alert {
  endpoint: string;
  p95: number;
  threshold: number;
  severity: 'warning' | 'critical';
  timestamp: Date;
}

interface BenchmarkResult {
  name: string;
  duration: number;
  success: boolean;
  error?: string;
}

const THRESHOLDS = {
  'Dashboard Summary': 500,
  'Brand Performance': 800,
  'Store Performance': 600,
  'Time Series Data': 1000
};

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

async function sendSlackAlert(alert: Alert) {
  if (!SLACK_WEBHOOK_URL) {
    console.warn('SLACK_WEBHOOK_URL not configured');
    return;
  }

  const message = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🚨 Performance Alert: ${alert.severity.toUpperCase()}`
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Endpoint:*\n${alert.endpoint}`
          },
          {
            type: 'mrkdwn',
            text: `*Response Time:*\n${alert.p95.toFixed(2)}ms`
          },
          {
            type: 'mrkdwn',
            text: `*Threshold:*\n${alert.threshold}ms`
          },
          {
            type: 'mrkdwn',
            text: `*Time:*\n${alert.timestamp.toISOString()}`
          }
        ]
      }
    ]
  };

  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
  } catch (error) {
    console.error('Failed to send Slack alert:', error);
  }
}

async function checkPerformance() {
  console.log('🔍 Checking performance metrics...');
  
  const results: BenchmarkResult[] = [];
  const alerts: Alert[] = [];

  // Run benchmarks
  for (const [name, threshold] of Object.entries(THRESHOLDS)) {
    const start = performance.now();
    try {
      let data;
      switch (name) {
        case 'Dashboard Summary':
          const { data: summary } = await supabase.rpc('get_dashboard_summary');
          data = summary;
          break;
        case 'Brand Performance':
          const { data: brands } = await supabase
            .from('mv_brand_performance')
            .select('*')
            .limit(15);
          data = brands;
          break;
        case 'Store Performance':
          const { data: stores } = await supabase
            .from('mv_store_performance')
            .select('*')
            .limit(20);
          data = stores;
          break;
        case 'Time Series Data':
          const { data: timeSeries } = await supabase
            .from('mv_daily_dashboard_summary')
            .select('*')
            .order('day', { ascending: false })
            .limit(30);
          data = timeSeries;
          break;
      }

      const duration = performance.now() - start;
      results.push({ name, duration, success: true });

      // Check if performance exceeds threshold
      if (duration > threshold) {
        alerts.push({
          endpoint: name,
          p95: duration,
          threshold,
          severity: duration > threshold * 1.5 ? 'critical' : 'warning',
          timestamp: new Date()
        });
      }
    } catch (error) {
      results.push({
        name,
        duration: performance.now() - start,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Send alerts if any
  if (alerts.length > 0) {
    console.log(`⚠️ Sending ${alerts.length} performance alerts...`);
    await Promise.all(alerts.map(sendSlackAlert));
  }

  // Log results
  console.log('\n📊 Performance Check Results:');
  console.log('============================');
  results.forEach(result => {
    console.log(
      result.success
        ? `✅ ${result.name}: ${result.duration.toFixed(2)}ms`
        : `❌ ${result.name}: Failed (${result.error})`
    );
  });

  return { results, alerts };
}

// Run checks every 5 minutes
const CHECK_INTERVAL = 5 * 60 * 1000;

async function startMonitoring() {
  console.log('🚀 Starting performance monitoring...');
  
  // Initial check
  await checkPerformance();
  
  // Schedule regular checks
  setInterval(checkPerformance, CHECK_INTERVAL);
}

// Start monitoring if run directly
if (require.main === module) {
  startMonitoring().catch(error => {
    console.error('❌ Monitoring error:', error);
    process.exit(1);
  });
}

export { checkPerformance, startMonitoring }; 