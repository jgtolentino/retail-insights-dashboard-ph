#!/usr/bin/env python3

import json
import urllib.request
import urllib.error
import ssl
import sys

# Supabase credentials
SUPABASE_URL = 'https://lcoxtanyckjzyxxcsjzz.supabase.co'
SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODM0NTMyNywiZXhwIjoyMDYzOTIxMzI3fQ.42ByHcIAi1jrcpzdvfcMJyE6ibqr81d-rIjsqxL_Bbk'

# Migration files
MIGRATION_FILES = [
    '/Users/tbwa/Documents/GitHub/retail-insights-dashboard-ph/migrations/sprint4_schema_updates.sql',
    '/Users/tbwa/Documents/GitHub/retail-insights-dashboard-ph/migrations/sprint4_rpc_functions.sql'
]

def execute_sql(sql, description):
    """Execute SQL via Supabase REST API"""
    
    # Prepare the request
    url = f"{SUPABASE_URL}/rest/v1/rpc"
    
    headers = {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}'
    }
    
    # The Supabase REST API doesn't have a direct SQL execution endpoint
    # We'll need to use the Postgres REST API endpoint instead
    postgres_url = SUPABASE_URL.replace('https://', 'https://').replace('.supabase.co', '.supabase.co/rest/v1/')
    
    # Create SSL context to handle HTTPS
    ssl_context = ssl.create_default_context()
    
    try:
        # For direct SQL execution, we need to use the pg endpoint
        # This is a workaround since Supabase doesn't expose direct SQL execution via REST
        
        # Split the SQL into individual statements
        statements = [s.strip() for s in sql.split(';') if s.strip()]
        
        print(f"📝 Found {len(statements)} SQL statements in {description}")
        
        success_count = 0
        for i, statement in enumerate(statements, 1):
            if not statement or statement.startswith('--'):
                continue
                
            print(f"   Executing statement {i}/{len(statements)}...")
            
            # For now, we'll print the statements that would be executed
            # In production, you'd use Supabase CLI or a proper client library
            if len(statement) > 100:
                print(f"   Statement preview: {statement[:100]}...")
            else:
                print(f"   Statement: {statement}")
            
            success_count += 1
            
        print(f"✅ Would execute {success_count} statements from {description}")
        return True
        
    except Exception as e:
        print(f"❌ Error executing {description}: {str(e)}")
        return False

def apply_migrations():
    """Apply all migration files"""
    print("🚀 Starting Sprint 4 migrations...\n")
    
    for migration_file in MIGRATION_FILES:
        try:
            print(f"📄 Reading {migration_file}...")
            
            with open(migration_file, 'r') as f:
                sql_content = f.read()
            
            print(f"⚡ Processing migration...")
            
            # Execute the SQL
            success = execute_sql(sql_content, migration_file)
            
            if success:
                print(f"✅ Completed {migration_file}\n")
            else:
                print(f"❌ Failed {migration_file}\n")
                
        except FileNotFoundError:
            print(f"❌ File not found: {migration_file}")
        except Exception as e:
            print(f"❌ Error processing {migration_file}: {str(e)}")
    
    print("\n🎉 Migration process completed!")
    print("\n⚠️  Note: Direct SQL execution via REST API requires using Supabase CLI or client libraries.")
    print("📋 To apply these migrations, use one of these methods:\n")
    print("1. Supabase CLI:")
    print("   supabase db push --db-url postgresql://postgres:[YOUR-DB-PASSWORD]@db.lcoxtanyckjzyxxcsjzz.supabase.co:5432/postgres")
    print("\n2. psql command:")
    print("   psql postgresql://postgres:[YOUR-DB-PASSWORD]@db.lcoxtanyckjzyxxcsjzz.supabase.co:5432/postgres < migration_file.sql")
    print("\n3. Supabase Dashboard:")
    print("   Go to SQL Editor in your Supabase dashboard and paste the SQL content")

def create_combined_migration():
    """Create a single combined migration file for easier execution"""
    print("\n📦 Creating combined migration file...")
    
    combined_sql = []
    
    for migration_file in MIGRATION_FILES:
        try:
            with open(migration_file, 'r') as f:
                content = f.read()
                combined_sql.append(f"-- ========================================")
                combined_sql.append(f"-- Migration from: {migration_file}")
                combined_sql.append(f"-- ========================================\n")
                combined_sql.append(content)
                combined_sql.append("\n\n")
        except Exception as e:
            print(f"Error reading {migration_file}: {e}")
    
    combined_file = '/Users/tbwa/Documents/GitHub/retail-insights-dashboard-ph/migrations/sprint4_combined.sql'
    
    try:
        with open(combined_file, 'w') as f:
            f.write('\n'.join(combined_sql))
        
        print(f"✅ Created combined migration file: {combined_file}")
        print("   You can now run this single file using psql or Supabase SQL Editor")
        
    except Exception as e:
        print(f"❌ Error creating combined file: {e}")

if __name__ == "__main__":
    apply_migrations()
    create_combined_migration()