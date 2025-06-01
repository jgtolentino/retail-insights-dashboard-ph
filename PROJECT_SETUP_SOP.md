# Project Setup SOP - Retail Insights Dashboard PH

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the project root with:

```bash
# Supabase Configuration (ALREADY PROVIDED)
VITE_SUPABASE_URL=https://lcoxtanyckjzyxxcsjzz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY4ODU3NjMsImV4cCI6MjAzMjQ2MTc2M30.GcLZ8W2ipQKn_BdahJlITME49IITWNkEzBcRPx_BTWM
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY4ODU3NjMsImV4cCI6MjAzMjQ2MTc2M30.GcLZ8W2ipQKn_BdahJlITME49IITWNkEzBcRPx_BTWM

# For Database Direct Connection (if needed)
SUPABASE_DB_URL=postgresql://postgres:[password]@db.lcoxtanyckjzyxxcsjzz.supabase.co:5432/postgres

# Optional: Sentry Configuration
VITE_SENTRY_DSN=your_sentry_dsn

# Optional: Azure OpenAI Configuration
VITE_AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint
VITE_AZURE_OPENAI_KEY=your_azure_openai_key
```

## Dependencies Status

### ✅ Already Installed Dependencies

All dependencies are already installed via `npm install`. Key packages include:

**Frontend:**

- React 18.3.1
- Vite 6.0.8
- TypeScript 5.3.3
- @supabase/supabase-js 2.49.8
- Tailwind CSS 3.4.1
- shadcn/ui components

**Backend:**

- Express 4.18.2
- Drizzle ORM 0.39.1

**Testing:**

- Vitest 2.0.5
- Playwright 1.48.2
- @testing-library/react 16.1.0

**Build Tools:**

- ESBuild 0.24.2
- PostCSS 8.4.35

## Database Information

### Supabase Project Details

- **Project URL**: https://lcoxtanyckjzyxxcsjzz.supabase.co
- **Database**: PostgreSQL
- **Verified Tables**:
  - `products` (109 records confirmed)
  - `transactions`
  - `stores`
  - `brands`
  - `customers`

### SQL Functions Available

- `get_filter_options()` - Returns categories, brands, locations
- `get_age_distribution()` - Customer age demographics
- Additional RPC functions for analytics

## Pulser Configuration

### Available Pulser Executables

- `./pulser` - Interactive UI (opens TUI)
- `./pulser-simple.js` - Simple CLI
- `./pulser-task-runner.js` - Legacy CLI
- `./pulser-task-runner-v2.js` - **RECOMMENDED CLI**

### Pulser Tasks

```bash
# Individual Tasks
./pulser-task-runner-v2.js run build-css    # Compile Tailwind
./pulser-task-runner-v2.js run lint         # ESLint
./pulser-task-runner-v2.js run test         # Jest tests
./pulser-task-runner-v2.js run backend-qa   # Backend QA suite
./pulser-task-runner-v2.js run deploy       # Vercel deploy

# Composite Tasks
./pulser-task-runner-v2.js run ci           # build → lint → test
./pulser-task-runner-v2.js run qa-backend   # Backend QA only
./pulser-task-runner-v2.js run qa-full      # Full QA suite
```

### Pulser Agents

- **BasherExec** - Command execution
- **Caca** - Error analysis & suggestions
- **Patcha** - Auto-fix attempts
- **MayaPlan** - Feature planning
- **Claudia** - GitHub integration

## Running Tests

### Quick Test Commands

```bash
# Backend QA with Supabase connection (no additional setup needed)
./pulser-qa-backend.sh

# Individual test suites
node scripts/test-supabase-connection-simple.js  # ✅ Works
node scripts/test-sql-functions.js               # Needs .env file
node scripts/comprehensive-filter-test.js        # ✅ Works partially

# NPM test scripts
npm run test:unit          # Unit tests
npm run test:integration   # Integration tests
npm run test:e2e          # Playwright E2E
```

### Known Issues

1. DNS resolution errors in test environment (localhost)
2. Some SQL functions missing in database
3. Shell script syntax showing duplicate pass/fail messages

## Project Structure

```
retail-insights-dashboard-ph/
├── client/                 # Frontend React app
├── server/                 # Express backend
├── scripts/               # Test & utility scripts
├── pulser_agents/         # Pulser agent configs
├── tests/                 # Test suites
├── .env                   # Environment variables (create this)
├── pulser.yaml           # Pulser task configuration
└── package.json          # Dependencies (all installed)
```

## Quick Start

1. **Environment is ready** - All dependencies installed
2. **Create .env file** - Copy the variables from above
3. **Run tests**: `./pulser-qa-backend.sh`
4. **Run dev server**: `npm run dev`

## Support Information

- **Supabase Dashboard**: https://app.supabase.com/project/lcoxtanyckjzyxxcsjzz
- **GitHub Repo**: https://github.com/jgtolentino/retail-insights-dashboard-ph
- **Node Version**: 18.20.2 (via .nvmrc)
- **Package Manager**: npm (lockfile present)

---

**Note**: This document contains all necessary environment variables and confirms all dependencies are already installed. No additional setup required beyond creating the .env file.
