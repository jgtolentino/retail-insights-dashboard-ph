# Supabase CLI Setup Guide

This guide will help you set up Supabase CLI to run SQL scripts directly.

## Step 1: Login to Supabase

Run this command and follow the browser prompt:

```bash
supabase login
```

This will:
1. Open your browser
2. Ask you to login to Supabase
3. Generate an access token
4. Save it locally

## Step 2: Get Your Project Reference

1. Go to your Supabase Dashboard
2. Look at the URL: `https://app.supabase.com/project/[PROJECT-REF]`
3. Or go to Settings → General → Reference ID
4. Copy the project reference (looks like: `xyzabc123456`)

## Step 3: Link Your Project

In your project directory, run:

```bash
cd /Users/tbwa/Documents/GitHub/retail-insights-dashboard-ph
supabase link --project-ref YOUR_PROJECT_REF
```

When prompted, enter your database password.

## Step 4: Create Configuration File

Create `.supabase/.env` file:

```bash
# .supabase/.env
POSTGRES_PASSWORD=your-database-password
```

## Step 5: Test Connection

```bash
# Test with a simple query
echo "SELECT current_database();" | supabase db push

# Or test with status
supabase db remote status
```

## Usage Examples

### Run SQL File
```bash
supabase db push < migrations/create_tables.sql
```

### Run Inline SQL
```bash
echo "SELECT * FROM brands LIMIT 5;" | supabase db push
```

### Create and Run Migration
```bash
# Create new migration
supabase migration new add_substitutions_table

# Edit the file in supabase/migrations/
# Then run all migrations
supabase db push
```

## Troubleshooting

### "Access token not provided"
Run `supabase login` again

### "Project not linked"
Run `supabase link --project-ref YOUR_PROJECT_REF`

### "Invalid database password"
Check your database password in Supabase Dashboard → Settings → Database

## Security Notes

- Never commit `.supabase/.env` to git
- The `.supabase` directory is already in `.gitignore`
- Access tokens expire after 1 year