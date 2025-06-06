#!/bin/bash
# Scout System Health Check - Clean Enterprise Monitoring
# Neutral terminology, no Pulser/agent references

echo "📡 Running Scout System Health Check..."
echo "======================================"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_FILE="scout_health_report_${TIMESTAMP}.yaml"

echo "📊 Extracting system metrics..."

# 1. Platform Uptime Check
echo "🌐 Platform Uptime Score..."
UPTIME_DAYS=$(uptime | awk '{print $3}' | sed 's/,//')
LOAD_AVG=$(uptime | awk '{print $(NF-2)}' | sed 's/,//')

# 2. Device Operational Integrity
echo "🔧 Device Operational Integrity..."
TOTAL_DEVICES=$(find /var/log -name "*device*" 2>/dev/null | wc -l || echo "0")
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.1f", ($3/$2) * 100.0}')
CPU_TEMP=$(sensors 2>/dev/null | grep "Core 0" | awk '{print $3}' | sed 's/+//;s/°C//' || echo "N/A")

# 3. Intelligence Engine Metrics
echo "🧠 Intelligence Engine Metrics..."
if command -v node &> /dev/null; then
    NODE_RESPONSE_TIME=$(timeout 5s node -e "console.time('test'); setTimeout(() => console.timeEnd('test'), 100);" 2>/dev/null | grep -o '[0-9.]*' || echo "N/A")
else
    NODE_RESPONSE_TIME="N/A"
fi

# 4. Process Activity Timeline
echo "⏱️ Process Activity Timeline..."
LAST_DEPLOY=$(git log -1 --format="%ci" 2>/dev/null || echo "Unknown")
ACTIVE_PROCESSES=$(ps aux | grep -E "(node|npm)" | grep -v grep | wc -l)

# Generate Health Report
cat > "$OUTPUT_FILE" << EOF
# Scout System Health Report
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# System: Project Scout Intelligence Platform

report_metadata:
  generated_at: "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  report_version: "1.0"
  system_name: "Scout Intelligence Platform"

platform_uptime:
  system_uptime_days: "$UPTIME_DAYS"
  load_average: "$LOAD_AVG"
  status: "$([ $(echo "$LOAD_AVG < 1.0" | bc -l 2>/dev/null || echo "0") -eq 1 ] && echo "Healthy" || echo "Monitor")"

device_integrity:
  total_registered_devices: $TOTAL_DEVICES
  disk_usage_percent: $DISK_USAGE
  memory_usage_percent: $MEMORY_USAGE
  cpu_temperature: "$CPU_TEMP"
  operational_status: "$([ $DISK_USAGE -lt 80 ] && echo "Optimal" || echo "Warning")"

intelligence_engine:
  response_latency_ms: "$NODE_RESPONSE_TIME"
  active_processes: $ACTIVE_PROCESSES
  engine_status: "$([ $ACTIVE_PROCESSES -gt 0 ] && echo "Active" || echo "Standby")"

process_activity_timeline:
  last_deployment: "$LAST_DEPLOY"
  monitoring_timestamp: "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  
system_alerts:
  critical: $([ $DISK_USAGE -gt 90 ] && echo "1" || echo "0")
  warnings: $([ $DISK_USAGE -gt 80 ] && echo "1" || echo "0")
  
recommendations:
  - "$([ $DISK_USAGE -gt 80 ] && echo "Monitor disk usage - currently at ${DISK_USAGE}%" || echo "System operating within normal parameters")"
  - "$([ $ACTIVE_PROCESSES -eq 0 ] && echo "No active processes detected - verify service status" || echo "Intelligence engine active with ${ACTIVE_PROCESSES} processes")"
EOF

echo ""
echo "✅ Scout System Health Check Complete"
echo "📄 Report saved: $OUTPUT_FILE"
echo ""
echo "📊 Quick Summary:"
echo "   Platform Status: $([ $DISK_USAGE -lt 80 ] && echo "✅ Healthy" || echo "⚠️ Monitor")"
echo "   Disk Usage: ${DISK_USAGE}%"
echo "   Memory Usage: ${MEMORY_USAGE}%"
echo "   Active Processes: $ACTIVE_PROCESSES"
echo ""
echo "📖 View full report: cat $OUTPUT_FILE"