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

console.log('📄 Environment check:');
console.log('URL found:', !!supabaseUrl, supabaseUrl?.substring(0, 30) + '...');
console.log('Service key found:', !!supabaseServiceKey, supabaseServiceKey?.substring(0, 30) + '...');

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing credentials');
    process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function testBasicQuery() {
    console.log('\n🔍 Testing basic Supabase query...');
    
    try {
        // First try to query existing tables to test connection
        console.log('Testing connection by trying to access existing data...');
        
        // Insert test data
        const { data: insertData, error: insertError } = await supabase
            .from('test_connection')
            .insert({ message: 'Test connection successful!' })
            .select();
        
        if (insertError) {
            console.error('❌ Insert failed:', insertError.message);
            return false;
        }
        
        console.log('✅ Insert successful:', insertData);
        
        // Query the data
        const { data: queryData, error: queryError } = await supabase
            .from('test_connection')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (queryError) {
            console.error('❌ Query failed:', queryError.message);
            return false;
        }
        
        console.log('✅ Query successful:', queryData);
        return true;
        
    } catch (err) {
        console.error('❌ Exception:', err.message);
        return false;
    }
}

async function main() {
    console.log('🎯 Testing Supabase connection and basic operations...');
    
    if (await testBasicQuery()) {
        console.log('\n🎉 Supabase is working! Ready to run migrations.');
    } else {
        console.log('\n❌ Supabase connection failed. Check credentials and permissions.');
        process.exit(1);
    }
}

main().catch(console.error);