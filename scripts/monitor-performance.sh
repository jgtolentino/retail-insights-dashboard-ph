#!/bin/bash

# Database performance monitoring script
# Usage: ./monitor-performance.sh [interval_seconds]

INTERVAL=${1:-60}  # Default to 60 seconds if not specified
LOG_FILE="performance_$(date +%Y%m%d_%H%M%S).log"

echo "Starting performance monitoring (interval: ${INTERVAL}s)"
echo "Logging to: ${LOG_FILE}"

while true; do
    echo "=== $(date) ===" >> "$LOG_FILE"
    
    # Check slow queries
    echo "Slow Queries:" >> "$LOG_FILE"
    psql -d postgres -c "
        SELECT query, calls, total_time, mean_time, rows
        FROM pg_stat_statements
        WHERE mean_time > 1000
        ORDER BY mean_time DESC
        LIMIT 5;" >> "$LOG_FILE"
    
    # Check table sizes
    echo -e "\nTable Sizes:" >> "$LOG_FILE"
    psql -d postgres -c "
        SELECT 
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;" >> "$LOG_FILE"
    
    # Check connection stats
    echo -e "\nConnection Stats:" >> "$LOG_FILE"
    psql -d postgres -c "
        SELECT 
            datname,
            numbackends,
            xact_commit,
            xact_rollback,
            blks_read,
            blks_hit,
            tup_returned,
            tup_fetched,
            tup_inserted,
            tup_updated,
            tup_deleted
        FROM pg_stat_database
        WHERE datname = 'postgres';" >> "$LOG_FILE"
    
    # Check materialized view refresh status
    echo -e "\nMaterialized View Status:" >> "$LOG_FILE"
    psql -d postgres -c "
        SELECT 
            schemaname,
            matviewname,
            hasindexes,
            ispopulated,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) AS size
        FROM pg_matviews
        WHERE schemaname = 'public';" >> "$LOG_FILE"
    
    # Check index usage
    echo -e "\nIndex Usage:" >> "$LOG_FILE"
    psql -d postgres -c "
        SELECT 
            schemaname,
            tablename,
            indexname,
            idx_scan,
            idx_tup_read,
            idx_tup_fetch
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
        ORDER BY idx_scan DESC
        LIMIT 10;" >> "$LOG_FILE"
    
    echo -e "\n" >> "$LOG_FILE"
    sleep "$INTERVAL"
done 