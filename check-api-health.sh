#!/bin/bash
# Check multiple possible health endpoints
for endpoint in "/api/health" "/health" "/health.json" "/"; do
  if curl -s -f "http://localhost:8080${endpoint}" > /dev/null 2>&1; then
    exit 0
  fi
done
exit 1
