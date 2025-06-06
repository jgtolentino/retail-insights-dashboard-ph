# Automated SQL Execution Setup

## 🎉 You'll Never Need to Run SQL Manually Again!

This system provides **fully automated SQL execution** with tracking, duplicate prevention, and error handling.

## Quick Start (One-Time Setup)

### 1. Bootstrap the System (Required Once)

Copy and paste this SQL into **Supabase SQL Editor** → **Run**:

```sql
-- Copy the entire contents of: scripts/bootstrap-sql-executor.sql
```

**Or manually copy from:** `scripts/bootstrap-sql-executor.sql`

This creates the helper functions that enable automated execution.

### 2. Ready! Use These Commands

```bash
# Run any SQL file automatically
npm run sql scripts/your-file.sql

# Smart migration runner (prevents duplicates)
npm run migrate scripts/your-file.sql

# Show migration history
npm run migrate:status

# Run all pending migrations
npm run migrate:all

# Force re-run a migration
npm run migrate scripts/your-file.sql --force
```

## How It Works

### 🤖 Automated Execution

- **No manual copying** - scripts run directly from command line
- **Error handling** - continues on non-fatal errors
- **Progress tracking** - shows real-time execution status
- **Automatic retries** - handles connection issues

### 🛡️ Duplicate Prevention

- **Migration tracking** - remembers which scripts were run
- **Checksum verification** - detects file changes
- **Smart skipping** - won't run the same script twice
- **Force override** - can re-run when needed

### 📊 Status Monitoring

- **Execution history** - see all past migrations
- **Success/failure tracking** - identify problematic scripts
- **Error logging** - detailed error messages stored
- **Performance metrics** - execution time tracking

## Command Reference

### Basic SQL Execution

```bash
# Run a SQL file (basic runner)
npm run sql scripts/create-views.sql
npm run sql scripts/add-functions.sql

# Alternative syntax
node scripts/sql-runner.js scripts/your-file.sql
```

### Smart Migration System

```bash
# Run migration (with duplicate prevention)
npm run migrate scripts/create-views.sql

# Check migration status
npm run migrate:status

# Run all pending migrations in scripts/
npm run migrate:all

# Force re-run (ignores duplicate check)
npm run migrate scripts/create-views.sql --force
```

### Utility Commands

```bash
# Show what bootstrap SQL to run
npm run sql:bootstrap

# Test connection
node scripts/migration-runner.js status
```

## File Structure

```
retail-insights-dashboard-ph/
├── scripts/
│   ├── bootstrap-sql-executor.sql      # One-time setup (run in Supabase)
│   ├── sql-runner.js                   # Basic SQL executor
│   ├── migration-runner.js             # Smart migration system
│   ├── create-missing-rpc-functions.sql # Example migration
│   └── fix-views-correct-schema.sql    # Example migration
└── package.json                        # npm script definitions
```

## Migration Status Example

```
┌─────────────────────────────┬─────────────────────┬─────────┬─────────────────┐
│ Migration File              │ Executed At         │ Status  │ Error           │
├─────────────────────────────┼─────────────────────┼─────────┼─────────────────┤
│ create-missing-rpc-functions│ 2024-01-15 14:30:22│ ✅ Success│                 │
│ fix-views-correct-schema.sql│ 2024-01-15 14:31:15│ ✅ Success│                 │
│ add-new-analytics.sql       │ 2024-01-15 14:32:01│ ❌ Failed│ syntax error    │
└─────────────────────────────┴─────────────────────┴─────────┴─────────────────┘

📊 Summary: 2/3 migrations successful
```

## Error Handling

### Common Issues & Solutions

**Problem**: "exec_sql function does not exist"

- **Solution**: Run the bootstrap SQL first: `npm run sql:bootstrap`

**Problem**: "Migration already executed"

- **Expected**: System preventing duplicates (working correctly)
- **Override**: Use `--force` flag if needed

**Problem**: "Connection failed"

- **Check**: Environment variables are set correctly
- **Verify**: Supabase project URL and API key

### Debug Mode

```bash
# Enable verbose logging
SUPABASE_DEBUG=true npm run migrate scripts/your-file.sql

# Check connection
node -e "import('./scripts/migration-runner.js').then(m => console.log('✅ Import successful'))"
```

## Security Features

- ✅ **Service key isolation** - uses secure environment variables
- ✅ **SQL injection protection** - parameterized queries
- ✅ **Error containment** - fails gracefully without exposing secrets
- ✅ **Audit trail** - complete execution history

## Best Practices

### Migration File Naming

```
scripts/001-create-initial-views.sql
scripts/002-add-rpc-functions.sql
scripts/003-fix-permissions.sql
```

### SQL File Structure

```sql
-- Migration: Add analytics functions
-- Description: Creates RPC functions for dashboard analytics
-- Author: AI Assistant
-- Date: 2024-01-15

-- Function 1
CREATE OR REPLACE FUNCTION get_analytics_data()
...

-- Function 2
CREATE OR REPLACE FUNCTION calculate_metrics()
...
```

### Execution Workflow

1. **Write SQL file** in `scripts/` directory
2. **Test locally** (optional): `npm run sql scripts/your-file.sql`
3. **Run migration**: `npm run migrate scripts/your-file.sql`
4. **Verify success**: `npm run migrate:status`

## Advanced Usage

### Batch Operations

```bash
# Run all SQL files in scripts/ (skips already executed)
npm run migrate:all

# Force re-run all migrations (dangerous!)
find scripts -name "*.sql" -exec npm run migrate {} --force \;
```

### Environment Variables

```bash
# Use different Supabase project
SUPABASE_URL=https://other-project.supabase.co npm run migrate scripts/file.sql

# Use different API key
SUPABASE_SERVICE_KEY=your-key npm run migrate scripts/file.sql
```

### Integration with CI/CD

```yaml
# GitHub Actions example
- name: Run pending migrations
  run: npm run migrate:all
  env:
    SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
```

## Troubleshooting

### Reset Migration History

```sql
-- Run in Supabase SQL Editor if needed
DELETE FROM sql_migrations WHERE filename = 'problematic-file.sql';
```

### Manual Override

```bash
# Skip migration system entirely (basic execution)
npm run sql scripts/emergency-fix.sql
```

### Verify Setup

```bash
# Test all components
npm run migrate:status          # Should show migration table
node scripts/sql-runner.js --help  # Should show usage
```

---

## 🎯 Result: Zero Manual SQL Execution

You now have:

- ✅ **Automated SQL execution** from command line
- ✅ **Duplicate prevention** system
- ✅ **Migration tracking** and history
- ✅ **Error handling** and recovery
- ✅ **Audit trail** for compliance

**Never copy-paste SQL into Supabase again!** 🚀
