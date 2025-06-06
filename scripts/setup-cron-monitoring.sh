#!/bin/bash
# Setup cron job for data validation monitoring
# Run every 6 hours to check data accuracy

echo "📅 Setting up monitoring cron job..."

# Add to crontab (every 6 hours)
(crontab -l 2>/dev/null; echo "0 */6 * * * cd $(pwd) && node scripts/monitoring-daemon.js >> monitoring.log 2>&1") | crontab -

echo "✅ Cron job installed: Every 6 hours"
echo "📝 Logs will be written to: monitoring.log"
echo "🔍 To check status: tail -f monitoring.log"
echo "🛑 To remove: crontab -e (then delete the monitoring line)"
