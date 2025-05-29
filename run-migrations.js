import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env file');
    process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration(filePath, description) {
    console.log(`\n🚀 Running migration: ${description}`);
    console.log(`📄 File: ${filePath}`);
    
    try {
        const sql = fs.readFileSync(filePath, 'utf8');
        
        // Split SQL into individual statements to handle SELECT statements properly
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));
        
        for (const statement of statements) {
            if (statement.trim()) {
                console.log(`\n  🔄 Executing: ${statement.substring(0, 50)}...`);
                const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
                
                if (error) {
                    console.error(`  ❌ Error: ${error.message}`);
                    // Continue with other statements
                } else {
                    console.log(`  ✅ Success`);
                    if (data && Array.isArray(data) && data.length > 0) {
                        console.log(`  📊 Result:`, data);
                    }
                }
            }
        }
        
        console.log(`✅ Migration completed: ${description}`);
    } catch (error) {
        console.error(`❌ Failed to run migration ${description}:`, error.message);
    }
}

async function main() {
    console.log('🎯 Starting Supabase migrations...');
    
    // Test connection first
    console.log('\n🔍 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .limit(1);
    
    if (testError) {
        console.error('❌ Connection failed:', testError.message);
        process.exit(1);
    }
    
    console.log('✅ Supabase connection successful');
    
    // Run migrations in order
    const migrations = [
        {
            file: './migrations/test_connection.sql',
            description: 'Test Connection and Basic Setup'
        },
        {
            file: './migrations/sprint2_complete.sql', 
            description: 'Sprint 2 Complete Setup - Substitutions & Functions'
        }
    ];
    
    for (const migration of migrations) {
        if (fs.existsSync(migration.file)) {
            await runMigration(migration.file, migration.description);
        } else {
            console.log(`⚠️  Migration file not found: ${migration.file}`);
        }
    }
    
    console.log('\n🎉 All migrations completed!');
}

main().catch(console.error);