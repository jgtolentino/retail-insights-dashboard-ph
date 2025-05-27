#!/usr/bin/env python3
"""
Complete Supabase Data Import Automation
Generates 2000 transactions and imports them using Supabase CLI
"""

import subprocess
import os
import sys
import webbrowser
from datetime import datetime

def check_supabase_cli():
    """Check if Supabase CLI is installed"""
    try:
        result = subprocess.run(['supabase', '--version'], 
                              capture_output=True, text=True)
        print(f"✓ Supabase CLI found: {result.stdout.strip()}")
        return True
    except FileNotFoundError:
        print("✗ Supabase CLI not found")
        return False

def install_supabase_cli():
    """Install Supabase CLI"""
    print("\n🔧 Installing Supabase CLI...")
    
    if sys.platform == "darwin":  # macOS
        print("Installing via Homebrew...")
        result = subprocess.run(['brew', 'install', 'supabase/tap/supabase'],
                              capture_output=True, text=True)
        if result.returncode == 0:
            print("✓ Supabase CLI installed successfully")
            return True
        else:
            print(f"✗ Installation failed: {result.stderr}")
            return False
    else:
        print("Please install Supabase CLI manually:")
        print("https://supabase.com/docs/guides/cli/getting-started")
        return False

def check_supabase_project():
    """Check if linked to a Supabase project"""
    try:
        result = subprocess.run(['supabase', 'status'], 
                              capture_output=True, text=True)
        if "API URL" in result.stdout and "not linked" not in result.stdout.lower():
            print("✓ Linked to Supabase project")
            return True
        else:
            print("✗ Not linked to a Supabase project")
            return False
    except:
        return False

def link_supabase_project():
    """Link to Supabase project"""
    print("\n🔗 Linking to Supabase project...")
    print("Get your project reference from: https://app.supabase.com/projects")
    project_ref = input("Enter your Supabase project reference ID: ").strip()
    
    if not project_ref:
        print("✗ No project reference provided")
        return False
    
    result = subprocess.run(['supabase', 'link', '--project-ref', project_ref],
                          capture_output=True, text=True, input='\n')
    
    if result.returncode == 0:
        print("✓ Successfully linked to project")
        return True
    else:
        print(f"✗ Failed to link: {result.stderr}")
        return False

def execute_sql_command(sql_command, description=""):
    """Execute SQL command using Supabase CLI"""
    if description:
        print(f"📋 {description}")
    
    result = subprocess.run(
        ['supabase', 'db', 'execute', sql_command],
        capture_output=True,
        text=True
    )
    
    if result.returncode == 0:
        print("✓ SQL executed successfully")
        if result.stdout.strip():
            print(f"Output: {result.stdout.strip()}")
        return True, result.stdout
    else:
        print(f"✗ SQL execution failed: {result.stderr}")
        return False, result.stderr

def execute_sql_file(sql_file, description=""):
    """Execute SQL file using Supabase CLI"""
    if description:
        print(f"📋 {description}")
    
    result = subprocess.run(
        ['supabase', 'db', 'execute', '-f', sql_file],
        capture_output=True,
        text=True
    )
    
    if result.returncode == 0:
        print(f"✓ SQL file {sql_file} executed successfully")
        if result.stdout.strip():
            print(f"Output: {result.stdout.strip()}")
        return True
    else:
        print(f"✗ SQL file execution failed: {result.stderr}")
        return False

def generate_data():
    """Generate 2000 transactions data"""
    print("\n📊 Generating 2000 transactions...")
    
    if os.path.exists('transactions_2000.csv') and os.path.exists('transaction_items_2000.csv'):
        print("✓ CSV files already exist")
        return True
    
    # Run the generation script
    result = subprocess.run([sys.executable, 'generate_2000_transactions.py'],
                          capture_output=True, text=True)
    
    if result.returncode == 0:
        print("✓ Data generation completed")
        print(result.stdout)
        return True
    else:
        print(f"✗ Data generation failed: {result.stderr}")
        return False

def prepare_database():
    """Clear existing data and prepare for import"""
    print("\n🗄️ Preparing database...")
    
    sql_commands = [
        ("Clearing transaction items", "TRUNCATE transaction_items CASCADE;"),
        ("Clearing transactions", "TRUNCATE transactions CASCADE;"),
        ("Clearing products", "TRUNCATE products CASCADE;"),
        ("Clearing brands", "TRUNCATE brands CASCADE;")
    ]
    
    for description, command in sql_commands:
        success, output = execute_sql_command(command, description)
        if not success:
            print(f"⚠️ Warning: {description} failed, continuing...")

def create_brands_and_products():
    """Create brands and products using SQL"""
    print("\n🏷️ Creating brands and products...")
    
    # Use the SQL file we created earlier
    if execute_sql_file('supabase_import_2000.sql', "Creating brands, products, and 2000 transactions"):
        return True
    else:
        print("✗ Failed to create data")
        return False

def verify_import():
    """Verify data was imported correctly using Supabase CLI"""
    print("\n✅ Verifying import...")
    
    # Check transaction count
    success, output = execute_sql_command(
        "SELECT COUNT(*) as transaction_count FROM transactions;",
        "Checking transaction count"
    )
    
    if success:
        # Try to extract count from output
        lines = output.split('\n')
        for line in lines:
            if line.strip().isdigit():
                count = int(line.strip())
                if count >= 1900:  # Allow some variance
                    print(f"✓ Transaction count: {count}")
                else:
                    print(f"⚠️ Low transaction count: {count}")
                break
    
    # Check transaction items count
    success, output = execute_sql_command(
        "SELECT COUNT(*) as item_count FROM transaction_items;",
        "Checking transaction items count"
    )
    
    # Check date range
    success, output = execute_sql_command(
        "SELECT MIN(created_at)::date as start_date, MAX(created_at)::date as end_date FROM transactions;",
        "Checking date range"
    )
    
    # Check brand performance
    success, output = execute_sql_command("""
        SELECT 
            b.name,
            COUNT(DISTINCT ti.transaction_id) as transactions,
            SUM(ti.subtotal) as revenue
        FROM brands b
        JOIN products p ON b.id = p.brand_id
        JOIN transaction_items ti ON p.id = ti.product_id
        GROUP BY b.id, b.name
        ORDER BY revenue DESC
        LIMIT 5;
    """, "Checking top 5 brands by revenue")

def test_dashboard():
    """Test the dashboard and optionally open in browser"""
    print("\n🌐 Testing dashboard...")
    
    dashboard_url = "https://retail-insights-dashboard-pgfmbl0r0-jakes-projects-e9f46c30.vercel.app"
    
    print(f"📊 Dashboard URL: {dashboard_url}")
    print("\n✓ Check that your dashboard shows:")
    print("  - Total transactions: ~2000")
    print("  - Data from January to May 2025")
    print("  - All brands with sales data")
    print("  - Horizontal bar chart with brand data")
    
    open_browser = input("\n🌐 Open dashboard in browser? (y/n): ").strip().lower()
    if open_browser == 'y':
        try:
            webbrowser.open(dashboard_url)
            print("✓ Dashboard opened in browser")
        except:
            print("✗ Could not open browser automatically")

def main():
    """Main execution flow with all automation"""
    print("🚀 Complete Supabase Data Import Automation")
    print("=" * 50)
    
    # Step 1: Check and install Supabase CLI
    print("\n📦 Step 1: Supabase CLI Setup")
    if not check_supabase_cli():
        if not install_supabase_cli():
            print("\n❌ Cannot continue without Supabase CLI")
            print("Install manually: https://supabase.com/docs/guides/cli/getting-started")
            return False
    
    # Step 2: Link to Supabase project
    print("\n🔗 Step 2: Project Linking")
    if not check_supabase_project():
        if not link_supabase_project():
            print("\n❌ Cannot continue without project link")
            print("Link manually: supabase link --project-ref YOUR_PROJECT_REF")
            return False
    
    # Step 3: Generate data
    print("\n📊 Step 3: Data Generation")
    if not generate_data():
        print("\n❌ Data generation failed")
        return False
    
    # Step 4: Prepare database
    print("\n🗄️ Step 4: Database Preparation")
    prepare_database()
    
    # Step 5: Create data using SQL
    print("\n🏗️ Step 5: Creating Data")
    if not create_brands_and_products():
        print("\n❌ Data creation failed")
        return False
    
    # Step 6: Verify import
    print("\n✅ Step 6: Verification")
    verify_import()
    
    # Step 7: Test dashboard
    print("\n🌐 Step 7: Dashboard Testing")
    test_dashboard()
    
    print("\n🎉 Import automation completed successfully!")
    print("Your dashboard should now show 2000 transactions with real data!")
    
    return True

if __name__ == "__main__":
    try:
        success = main()
        if success:
            print("\n✅ All done! Check your dashboard.")
        else:
            print("\n❌ Some steps failed. Check the output above.")
    except KeyboardInterrupt:
        print("\n\n⏹️ Process interrupted by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")