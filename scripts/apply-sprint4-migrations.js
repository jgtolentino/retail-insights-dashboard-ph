#!/usr/bin/env node

const fs = require('fs').promises;
const https = require('https');

// Supabase credentials
const SUPABASE_URL = 'https://lcoxtanyckjzyxxcsjzz.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODM0NTMyNywiZXhwIjoyMDYzOTIxMzI3fQ.42ByHcIAi1jrcpzdvfcMJyE6ibqr81d-rIjsqxL_Bbk';

// Migration files
const MIGRATION_FILES = [
  '/Users/tbwa/Documents/GitHub/retail-insights-dashboard-ph/migrations/sprint4_schema_updates.sql',
  '/Users/tbwa/Documents/GitHub/retail-insights-dashboard-ph/migrations/sprint4_rpc_functions.sql'
];

// Function to execute SQL via Supabase REST API
async function executeSql(sql, fileName) {
  return new Promise((resolve, reject) => {
    const projectRef = 'lcoxtanyckjzyxxcsjzz';
    const hostname = `${projectRef}.supabase.co`;
    
    const postData = JSON.stringify({
      query: sql
    });

    const options = {
      hostname: hostname,
      port: 443,
      path: '/rest/v1/rpc/sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ Successfully executed ${fileName}`);
          resolve(data);
        } else {
          console.error(`❌ Error executing ${fileName}: ${res.statusCode}`);
          console.error('Response:', data);
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Request error for ${fileName}:`, error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Alternative approach using fetch if available (Node 18+)
async function executeSqlWithFetch(sql, fileName) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        query: sql
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    console.log(`✅ Successfully executed ${fileName}`);
    return await response.json();
  } catch (error) {
    console.error(`❌ Error executing ${fileName}:`, error);
    throw error;
  }
}

// Main function to apply all migrations
async function applyMigrations() {
  console.log('🚀 Starting Sprint 4 migrations...\n');

  for (const filePath of MIGRATION_FILES) {
    try {
      console.log(`📄 Reading ${filePath}...`);
      const sql = await fs.readFile(filePath, 'utf8');
      
      console.log(`⚡ Executing migration...`);
      
      // Split SQL into smaller chunks if needed (Supabase has limits)
      const statements = sql
        .split(/;\s*$/m)
        .filter(stmt => stmt.trim())
        .map(stmt => stmt + ';');

      console.log(`Found ${statements.length} SQL statements to execute`);

      // Execute statements in batches
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        
        // Skip empty statements or comments
        if (!statement.trim() || statement.trim().startsWith('--')) {
          continue;
        }

        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          // For Node.js < 18, use the https approach
          if (typeof fetch === 'undefined') {
            await executeSql(statement, `${filePath} (statement ${i + 1})`);
          } else {
            await executeSqlWithFetch(statement, `${filePath} (statement ${i + 1})`);
          }
        } catch (error) {
          console.error(`Failed to execute statement ${i + 1}:`, error.message);
          console.error('Statement:', statement.substring(0, 100) + '...');
          
          // Continue with next statement on error
          console.log('Continuing with next statement...');
        }
      }

      console.log(`✅ Completed ${filePath}\n`);
      
    } catch (error) {
      console.error(`❌ Failed to process ${filePath}:`, error);
      return;
    }
  }

  console.log('🎉 All migrations completed!');
}

// Alternative: Create a simpler approach using Supabase client
async function createSupabaseClientScript() {
  const clientScript = `#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;

const supabaseUrl = 'https://lcoxtanyckjzyxxcsjzz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODM0NTMyNywiZXhwIjoyMDYzOTIxMzI3fQ.42ByHcIAi1jrcpzdvfcMJyE6ibqr81d-rIjsqxL_Bbk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigrations() {
  const files = [
    '/Users/tbwa/Documents/GitHub/retail-insights-dashboard-ph/migrations/sprint4_schema_updates.sql',
    '/Users/tbwa/Documents/GitHub/retail-insights-dashboard-ph/migrations/sprint4_rpc_functions.sql'
  ];

  for (const file of files) {
    console.log(\`Executing \${file}...\`);
    const sql = await fs.readFile(file, 'utf8');
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', { query: sql });
      
      if (error) {
        console.error(\`Error: \${error.message}\`);
      } else {
        console.log(\`✅ Successfully executed \${file}\`);
      }
    } catch (error) {
      console.error(\`Failed: \${error.message}\`);
    }
  }
}

runMigrations().catch(console.error);
`;

  await fs.writeFile(
    '/Users/tbwa/Documents/GitHub/retail-insights-dashboard-ph/scripts/apply-sprint4-supabase-client.js',
    clientScript
  );
  
  console.log('Created alternative Supabase client script');
}

// Run the migration
applyMigrations().catch(console.error);