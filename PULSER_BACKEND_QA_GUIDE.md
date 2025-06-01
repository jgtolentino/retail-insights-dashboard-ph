# Pulser Backend QA Guide

## Overview

This guide explains how to run backend QA tests using Pulser for the retail-insights-dashboard-ph project.

## Available Pulser Executables

| Binary                       | Purpose              | Usage                   |
| ---------------------------- | -------------------- | ----------------------- |
| `./pulser`                   | Interactive UI mode  | Opens TUI interface     |
| `./pulser-simple.js`         | Simple CLI runner    | Basic task execution    |
| `./pulser-task-runner.js`    | Original task runner | Legacy CLI              |
| `./pulser-task-runner-v2.js` | Enhanced task runner | **Recommended for CLI** |

## Running Backend QA

### Option 1: Using the Wrapper Script (Recommended)

```bash
# Run backend QA with automatic Pulser detection
./pulser-qa-backend.sh
```

### Option 2: Direct Pulser Execution

```bash
# Using the v2 task runner
node ./pulser-task-runner-v2.js run backend-qa

# Or with debug logging
PULSER_LOG_LEVEL=debug node ./pulser-task-runner-v2.js run backend-qa
```

### Option 3: Standalone Script

```bash
# Run without Pulser orchestration
./run-backend-qa.sh
```

## What Backend QA Tests

1. **Database Connection** (`scripts/test-db-connection.js`)

   - Verifies Supabase connection
   - Lists available tables
   - Counts products

2. **SQL Functions** (`scripts/test-sql-functions.js`)

   - Tests custom SQL functions
   - Validates views and stored procedures

3. **Backend Unit Tests** (`npm run test:unit`)

   - Service layer tests
   - Utility function tests

4. **Integration Tests** (`npm run test:integration`)

   - API endpoint tests
   - Full stack integration

5. **Filter Tests** (`scripts/comprehensive-filter-test.js`)
   - Filter logic validation
   - Query performance checks

## Environment Variables

Required for database tests:

```bash
export SUPABASE_DB_URL="your_connection_string"
```

Optional:

```bash
export PULSER_LOG_LEVEL=debug  # Enable debug logging
export NODE_ENV=test           # Set test environment
```

## Agent System

The backend-qa task uses Pulser's agent system:

- **BasherExec**: Executes shell commands
- **Caca**: Analyzes errors and suggests fixes
- **Patcha**: Attempts automatic fixes (when safe)

## Composite Tasks

```bash
# Run only backend QA
node ./pulser-task-runner-v2.js run qa-backend

# Run full QA suite (lint + test + backend-qa)
node ./pulser-task-runner-v2.js run qa-full
```

## Troubleshooting

1. **"No Pulser executable found"**

   - Ensure you're in the project root directory
   - Check file permissions: `chmod +x ./pulser-*`

2. **"SUPABASE_DB_URL not set"**

   - Database tests will fail without this
   - Get the URL from your Supabase project settings

3. **Interactive UI opens instead of CLI**
   - Use `pulser-task-runner-v2.js` instead of `pulser`
   - Or use the wrapper script: `./pulser-qa-backend.sh`

## Adding New Tests

To add new backend tests to the QA suite:

1. Create your test script in `scripts/` or `tests/`
2. Update `pulser.yaml` to include the new test in the `backend-qa` task
3. Test locally: `node ./pulser-task-runner-v2.js run backend-qa`
