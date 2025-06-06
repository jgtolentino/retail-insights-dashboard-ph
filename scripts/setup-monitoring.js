#!/usr/bin/env node
/**
 * Production Monitoring Setup - Periodic validation and alerting
 */

const fs = require('fs');
const path = require('path');

function createMonitoringSystem() {
  console.log('📊 Setting up production monitoring system...');

  // Create monitoring script
  const monitorScript = `#!/usr/bin/env node
/**
 * Automated Data Quality Monitor
 * Runs periodic checks and alerts on data discrepancies
 */

const { ProductionValidator } = require('./production-validation-suite.js');
const fs = require('fs');

async function runMonitoring() {
  console.log(\`🔍 [\${new Date().toISOString()}] Running scheduled data validation...\`);
  
  const validator = new ProductionValidator();
  const success = await validator.runAllTests();
  
  const report = {
    timestamp: new Date().toISOString(),
    success,
    nextCheck: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() // 6 hours
  };
  
  // Log to monitoring file
  const logEntry = JSON.stringify(report) + '\\n';
  fs.appendFileSync('monitoring.log', logEntry);
  
  if (!success) {
    console.log('🚨 ALERT: Data validation issues detected!');
    // Here you could integrate with alerting systems like:
    // - Slack webhooks
    // - Email notifications  
    // - SMS alerts
    // - Dashboard status updates
  }
  
  return success;
}

if (require.main === module) {
  runMonitoring().catch(console.error);
}

module.exports = { runMonitoring };`;

  fs.writeFileSync('scripts/monitoring-daemon.js', monitorScript);
  fs.chmodSync('scripts/monitoring-daemon.js', '755');

  // Create cron job setup script
  const cronSetup = `#!/bin/bash
# Setup cron job for data validation monitoring
# Run every 6 hours to check data accuracy

echo "📅 Setting up monitoring cron job..."

# Add to crontab (every 6 hours)
(crontab -l 2>/dev/null; echo "0 */6 * * * cd $(pwd) && node scripts/monitoring-daemon.js >> monitoring.log 2>&1") | crontab -

echo "✅ Cron job installed: Every 6 hours"
echo "📝 Logs will be written to: monitoring.log"
echo "🔍 To check status: tail -f monitoring.log"
echo "🛑 To remove: crontab -e (then delete the monitoring line)"
`;

  fs.writeFileSync('scripts/setup-cron-monitoring.sh', cronSetup);
  fs.chmodSync('scripts/setup-cron-monitoring.sh', '755');

  // Create monitoring dashboard
  const monitoringDashboard = `<!DOCTYPE html>
<html>
<head>
    <title>Data Quality Monitoring Dashboard</title>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui; margin: 40px; }
        .status-good { color: #16a34a; }
        .status-warning { color: #ca8a04; }
        .status-error { color: #dc2626; }
        .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .metric { display: inline-block; margin: 10px 20px 10px 0; }
        .timestamp { color: #6b7280; font-size: 0.875rem; }
    </style>
</head>
<body>
    <h1>📊 Retail Insights Dashboard - Data Quality Monitor</h1>
    
    <div class="card">
        <h2>🎯 System Status</h2>
        <div class="metric">
            <strong>Last Check:</strong> <span id="lastCheck" class="timestamp">-</span>
        </div>
        <div class="metric">
            <strong>Status:</strong> <span id="status">-</span>
        </div>
        <div class="metric">
            <strong>Next Check:</strong> <span id="nextCheck" class="timestamp">-</span>
        </div>
    </div>

    <div class="card">
        <h2>📈 Key Metrics</h2>
        <div class="metric">
            <strong>Data Accuracy:</strong> <span id="accuracy">-</span>
        </div>
        <div class="metric">
            <strong>Query Performance:</strong> <span id="performance">-</span>
        </div>
        <div class="metric">
            <strong>Database Health:</strong> <span id="dbHealth">-</span>
        </div>
    </div>

    <div class="card">
        <h2>🔧 Pulser Auto-Fix Status</h2>
        <p>✅ Data display accuracy: <strong>Fixed</strong></p>
        <p>✅ Unique customers calculation: <strong>Corrected</strong></p>
        <p>✅ Validation system: <strong>Active</strong></p>
        <p>⚠️ Backend RPC function: <strong>Needs manual SQL update</strong></p>
    </div>

    <script>
        // Auto-refresh every 5 minutes
        setInterval(() => window.location.reload(), 5 * 60 * 1000);
        
        // Load latest monitoring data
        fetch('./monitoring.log')
            .then(response => response.text())
            .then(data => {
                const lines = data.trim().split('\\n').filter(Boolean);
                if (lines.length > 0) {
                    const latest = JSON.parse(lines[lines.length - 1]);
                    document.getElementById('lastCheck').textContent = new Date(latest.timestamp).toLocaleString();
                    document.getElementById('status').textContent = latest.success ? '✅ All Good' : '⚠️ Issues Detected';
                    document.getElementById('status').className = latest.success ? 'status-good' : 'status-warning';
                    document.getElementById('nextCheck').textContent = new Date(latest.nextCheck).toLocaleString();
                }
            })
            .catch(() => {
                document.getElementById('status').textContent = '❌ Monitoring data unavailable';
                document.getElementById('status').className = 'status-error';
            });
    </script>
</body>
</html>`;

  fs.writeFileSync('monitoring-dashboard.html', monitoringDashboard);

  console.log('✅ Monitoring system created!');
  console.log('📋 Components created:');
  console.log('   • scripts/monitoring-daemon.js - Automated validator');
  console.log('   • scripts/setup-cron-monitoring.sh - Cron job installer');  
  console.log('   • monitoring-dashboard.html - Status dashboard');
  console.log('');
  console.log('🚀 To activate monitoring:');
  console.log('   1. Run: ./scripts/setup-cron-monitoring.sh');
  console.log('   2. Open: monitoring-dashboard.html');
  console.log('   3. Monitor: tail -f monitoring.log');
}

if (require.main === module) {
  createMonitoringSystem();
}

module.exports = { createMonitoringSystem };