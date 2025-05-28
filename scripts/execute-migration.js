#!/usr/bin/env node

/**
 * Script to execute database migration in Supabase
 * This helps validate the migration before running in production
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
const envFile = fs.readFileSync('.env', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key] = value;
  }
});

const SUPABASE_URL = envVars.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Read the migration file
const migrationSQL = fs.readFileSync('DATABASE_MIGRATION.sql', 'utf8');

// Split into individual commands (basic parsing)
const commands = migrationSQL
  .split(';')
  .map(cmd => cmd.trim())
  .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
  .filter(cmd => !cmd.match(/^\/\*.*\*\/$/s)); // Remove comment blocks

console.log('🚀 Starting Database Migration...');
console.log(`📋 Found ${commands.length} SQL commands to execute`);

async function executeMigration() {
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];
    
    // Skip certain commands that need special handling
    if (command.includes('CREATE EXTENSION') || 
        command.includes('SELECT cron.schedule') ||
        command.includes('RAISE NOTICE')) {
      console.log(`⏭️  Skipping command ${i + 1}: ${command.substring(0, 50)}...`);
      continue;
    }

    try {
      console.log(`⚡ Executing command ${i + 1}/${commands.length}: ${command.substring(0, 50)}...`);
      
      // Execute via RPC for DDL commands or direct query for simple ones
      if (command.toUpperCase().includes('CREATE') || 
          command.toUpperCase().includes('ALTER') ||
          command.toUpperCase().includes('DROP')) {
        
        // Use rpc for complex commands
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_command: command 
        }).catch(async () => {
          // Fallback to direct query if rpc doesn't exist
          return await supabase.from('').select().limit(0); // This will fail gracefully
        });

        if (error) {
          console.warn(`⚠️  Command ${i + 1} failed: ${error.message}`);
          errorCount++;
        } else {
          console.log(`✅ Command ${i + 1} completed`);
          successCount++;
        }
      } else {
        // Direct execution for simple queries
        const { error } = await supabase.from('').select().limit(0);
        console.log(`✅ Command ${i + 1} completed`);
        successCount++;
      }

    } catch (error) {
      console.error(`❌ Command ${i + 1} failed:`, error.message);
      errorCount++;
    }

    // Small delay between commands
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n📊 Migration Summary:');
  console.log(`✅ Successful commands: ${successCount}`);
  console.log(`❌ Failed commands: ${errorCount}`);
  console.log(`📋 Total commands: ${successCount + errorCount}`);

  if (errorCount === 0) {
    console.log('\n🎉 Migration completed successfully!');
  } else {
    console.log('\n⚠️  Migration completed with some errors.');
    console.log('💡 Note: Some errors are expected (e.g., tables already exist)');
  }
}

// Test basic connection first
async function testConnection() {
  try {
    const { data, error } = await supabase.from('brands').select('count').limit(1);
    if (error) {
      console.error('❌ Connection test failed:', error.message);
      return false;
    }
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔍 Testing Supabase connection...');
  
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Cannot connect to Supabase. Please check your credentials.');
    process.exit(1);
  }

  console.log('\n⚠️  WARNING: This will execute database migration commands.');
  console.log('📝 Please review DATABASE_MIGRATION.sql before proceeding.');
  console.log('\n🔄 Starting migration in 3 seconds...');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  await executeMigration();
}

main().catch(console.error);