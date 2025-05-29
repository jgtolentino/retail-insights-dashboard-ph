import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load environment variables from .env file manually
const envFile = fs.readFileSync('.env', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
    }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env file');
    console.log('Found URL:', !!supabaseUrl);
    console.log('Found Service Key:', !!supabaseServiceKey);
    process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function testConnection() {
    console.log('🔍 Testing Supabase connection...');
    
    try {
        // Simple query to test connection - try to access any existing table
        const { data, error } = await supabase
            .from('pg_tables')
            .select('tablename')
            .eq('schemaname', 'public')
            .limit(5);
        
        if (error) {
            console.error('❌ Connection test failed:', error.message);
            return false;
        }
        
        console.log('✅ Connection successful!');
        console.log('📋 Query result:', data);
        return true;
    } catch (err) {
        console.error('❌ Connection error:', err.message);
        return false;
    }
}

async function runSQL(sql, description) {
    console.log(`\n🔄 ${description}`);
    
    try {
        const { data, error } = await supabase.rpc('exec_sql', { 
            sql: sql 
        });
        
        if (error) {
            console.error(`❌ Error: ${error.message}`);
            return false;
        }
        
        console.log(`✅ Success: ${description}`);
        if (data) {
            console.log('📊 Result:', data);
        }
        return true;
    } catch (err) {
        console.error(`❌ Exception: ${err.message}`);
        return false;
    }
}

async function createBasicTable() {
    const sql = `
        CREATE TABLE IF NOT EXISTS test_migration (
            id SERIAL PRIMARY KEY,
            message TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        );
        
        INSERT INTO test_migration (message) VALUES ('Migration test successful');
        
        SELECT * FROM test_migration ORDER BY created_at DESC LIMIT 1;
    `;
    
    return await runSQL(sql, 'Creating test table and inserting data');
}

async function main() {
    console.log('🎯 Starting Supabase migration test...');
    
    // Test connection
    if (!(await testConnection())) {
        console.error('Cannot proceed without working connection');
        process.exit(1);
    }
    
    // Try to create a simple table first
    await createBasicTable();
    
    console.log('\n🎉 Basic migration test completed!');
    console.log('\nNext steps:');
    console.log('1. If this worked, we can proceed with the full migrations');
    console.log('2. Check the Supabase dashboard to see the test_migration table');
}

main().catch(err => {
    console.error('💥 Migration failed:', err);
    process.exit(1);
});