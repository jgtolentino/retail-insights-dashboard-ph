import fetch from 'node-fetch';
import fs from 'fs';

const SUPABASE_URL = 'https://lcoxtanyckjzyxxcsjzz.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDA0NzUsImV4cCI6MjA2Mzg3NjQ3NX0.O6beSaKNUanbvASudEeOVCo-i6BVNcX5X-qtb7zANpM';

async function runSQL() {
  // Read SQL files
  const createTablesSql = fs.readFileSync('./supabase/quick_setup.sql', 'utf8');
  const insertDataSql = fs.readFileSync('./supabase/insert_data.sql', 'utf8');

  console.log('🚀 Running SQL via Supabase API...\n');

  try {
    // First, create tables
    console.log('📋 Creating tables...');
    const createResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: createTablesSql })
    });

    if (!createResponse.ok) {
      // Try alternative approach - direct query
      console.log('Trying alternative approach...');
      
      // Split SQL into individual statements
      const statements = createTablesSql.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`Executing: ${statement.substring(0, 50)}...`);
          // For now, we'll need to use the SQL editor
        }
      }
    }

    console.log('\n❌ Direct SQL execution via API requires service role key.');
    console.log('\n📝 Please use one of these methods:\n');
    console.log('1. **Supabase Dashboard** (Easiest):');
    console.log('   - Go to: https://app.supabase.com/project/lcoxtanyckjzyxxcsjzz/sql');
    console.log('   - Copy and run the SQL files\n');
    
    console.log('2. **Using psql** (if you have PostgreSQL installed):');
    console.log('   psql "postgresql://postgres.lcoxtanyckjzyxxcsjzz:YOUR_DB_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres" -f supabase/quick_setup.sql\n');
    
    console.log('3. **Using a PostgreSQL client** (TablePlus, pgAdmin, etc):');
    console.log('   - Host: aws-0-us-east-1.pooler.supabase.com');
    console.log('   - Database: postgres');
    console.log('   - User: postgres.lcoxtanyckjzyxxcsjzz');
    console.log('   - Password: Get from Supabase dashboard\n');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

runSQL();