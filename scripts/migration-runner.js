#!/usr/bin/env node

/**
 * Smart Migration Runner with Duplicate Prevention
 * 
 * This script automatically tracks which SQL files have been executed
 * and prevents running the same migration twice.
 * 
 * Usage:
 * node scripts/migration-runner.js <sql-file>
 * npm run migrate <sql-file>
 * npm run migrate:status  # Show migration history
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve, basename } from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase configuration
const SUPABASE_URL = 'https://lcoxtanyckjzyxxcsjzz.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDUzMjcsImV4cCI6MjA2MzkyMTMyN30.W2JgvZdXubvWpKCNZ7TfjLiKANZO1Hlb164fBEKH2dA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Calculate MD5 checksum of file content
 */
function calculateChecksum(content) {
  return createHash('md5').update(content).digest('hex');
}

/**
 * Check if migration was already executed
 */
async function isMigrationExecuted(filename) {
  try {
    const { data, error } = await supabase.rpc('migration_executed', {
      migration_name: filename
    });
    
    if (error) {
      console.log('⚠️  Migration tracking not available (run bootstrap first)');
      return false;
    }
    
    return data === true;
  } catch (error) {
    console.log('⚠️  Could not check migration status:', error.message);
    return false;
  }
}

/**
 * Record migration execution in tracking table
 */
async function recordMigration(filename, checksum, success, errorMessage = null) {
  try {
    const { data, error } = await supabase.rpc('record_migration', {
      migration_name: filename,
      migration_checksum: checksum,
      migration_success: success,
      migration_error: errorMessage
    });
    
    if (error) {
      console.log('⚠️  Could not record migration:', error.message);
    }
  } catch (error) {
    console.log('⚠️  Failed to record migration:', error.message);
  }
}

/**
 * Execute SQL migration with tracking
 */
async function executeMigration(sqlFilePath, force = false) {
  try {
    console.log('🚀 Starting Migration Execution...\n');
    
    const fullPath = resolve(process.cwd(), sqlFilePath);
    const filename = basename(sqlFilePath);
    
    console.log(`📁 File: ${filename}`);
    console.log(`📍 Path: ${fullPath}`);
    
    if (!existsSync(fullPath)) {
      throw new Error(`Migration file not found: ${fullPath}`);
    }
    
    // Read and analyze file
    const sqlContent = readFileSync(fullPath, 'utf8');
    const checksum = calculateChecksum(sqlContent);
    
    console.log(`📊 Size: ${sqlContent.length} characters`);
    console.log(`🔐 Checksum: ${checksum}`);
    
    // Check if already executed (unless forced)
    if (!force) {
      const alreadyExecuted = await isMigrationExecuted(filename);
      if (alreadyExecuted) {
        console.log('✅ Migration already executed successfully');
        console.log('💡 Use --force flag to run again');
        return true;
      }
    }
    
    console.log('\n🔧 Executing migration...');
    
    // Split into statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements\n`);
    
    let successCount = 0;
    let errorMessages = [];
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`[${i + 1}/${statements.length}] Executing...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        });
        
        if (error) throw error;
        
        // Check if response indicates success
        if (data && data.success === false) {
          throw new Error(data.error || 'Unknown execution error');
        }
        
        console.log(`✅ Statement ${i + 1} completed`);
        successCount++;
        
      } catch (error) {
        const errorMsg = `Statement ${i + 1}: ${error.message}`;
        console.error(`❌ ${errorMsg}`);
        errorMessages.push(errorMsg);
      }
    }
    
    // Calculate results
    const allSuccessful = successCount === statements.length;
    const errorText = errorMessages.length > 0 ? errorMessages.join('; ') : null;
    
    // Record migration result
    await recordMigration(filename, checksum, allSuccessful, errorText);
    
    // Show summary
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successful: ${successCount}/${statements.length} statements`);
    
    if (allSuccessful) {
      console.log('🎉 Migration completed successfully!');
    } else {
      console.log(`❌ Migration completed with ${errorMessages.length} errors`);
      console.log('📝 Error details recorded in migration log');
    }
    
    return allSuccessful;
    
  } catch (error) {
    console.error('🚨 Fatal migration error:', error.message);
    
    // Record failed migration
    try {
      const filename = basename(sqlFilePath);
      await recordMigration(filename, 'unknown', false, error.message);
    } catch (recordError) {
      console.log('⚠️  Could not record migration failure');
    }
    
    return false;
  }
}

/**
 * Show migration status and history
 */
async function showMigrationStatus() {
  try {
    console.log('📋 Migration History:\n');
    
    const { data, error } = await supabase.rpc('get_migration_status');
    
    if (error) {
      console.log('❌ Could not retrieve migration status:', error.message);
      console.log('💡 Run bootstrap-sql-executor.sql first to enable tracking');
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('📝 No migrations executed yet');
      return;
    }
    
    // Display migration history
    console.log('┌─────────────────────────────┬─────────────────────┬─────────┬─────────────────┐');
    console.log('│ Migration File              │ Executed At         │ Status  │ Error           │');
    console.log('├─────────────────────────────┼─────────────────────┼─────────┼─────────────────┤');
    
    data.forEach(migration => {
      const filename = migration.filename.padEnd(27);
      const date = new Date(migration.executed_at).toLocaleString().padEnd(19);
      const status = (migration.success ? '✅ Success' : '❌ Failed').padEnd(7);
      const error = (migration.error_message || '').substring(0, 15);
      
      console.log(`│ ${filename} │ ${date} │ ${status} │ ${error.padEnd(15)} │`);
    });
    
    console.log('└─────────────────────────────┴─────────────────────┴─────────┴─────────────────┘');
    
    const successCount = data.filter(m => m.success).length;
    const totalCount = data.length;
    
    console.log(`\n📊 Summary: ${successCount}/${totalCount} migrations successful`);
    
  } catch (error) {
    console.error('🚨 Error retrieving migration status:', error.message);
  }
}

/**
 * Run all pending migrations in scripts directory
 */
async function runPendingMigrations() {
  try {
    console.log('🔍 Scanning for SQL migrations...\n');
    
    const scriptsDir = resolve(process.cwd(), 'scripts');
    const files = readdirSync(scriptsDir)
      .filter(file => file.endsWith('.sql'))
      .filter(file => !file.includes('bootstrap'))
      .sort();
    
    console.log(`📁 Found ${files.length} SQL files in scripts/`);
    
    if (files.length === 0) {
      console.log('✅ No migrations to run');
      return;
    }
    
    let executed = 0;
    let skipped = 0;
    
    for (const file of files) {
      console.log(`\n🔍 Checking: ${file}`);
      
      const alreadyExecuted = await isMigrationExecuted(file);
      if (alreadyExecuted) {
        console.log('⏭️  Already executed, skipping');
        skipped++;
        continue;
      }
      
      console.log('🚀 Executing migration...');
      const success = await executeMigration(`scripts/${file}`);
      if (success) {
        executed++;
      }
    }
    
    console.log(`\n📊 Batch Migration Summary:`);
    console.log(`✅ Executed: ${executed} migrations`);
    console.log(`⏭️  Skipped: ${skipped} migrations`);
    
  } catch (error) {
    console.error('🚨 Error in batch migration:', error.message);
  }
}

// Main execution
async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];
  
  // Test connection first
  try {
    const { data, error } = await supabase.from('brands').select('count', { count: 'exact', head: true });
    if (error) throw error;
    console.log('✅ Supabase connection verified\n');
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    process.exit(1);
  }
  
  if (command === 'status') {
    await showMigrationStatus();
  } else if (command === 'all') {
    await runPendingMigrations();
  } else if (command && !command.startsWith('-')) {
    const force = process.argv.includes('--force');
    const success = await executeMigration(command, force);
    process.exit(success ? 0 : 1);
  } else {
    console.log('🔧 Smart Migration Runner\n');
    console.log('Usage:');
    console.log('  node scripts/migration-runner.js <sql-file>     # Run specific migration');
    console.log('  node scripts/migration-runner.js status        # Show migration history');
    console.log('  node scripts/migration-runner.js all           # Run all pending migrations');
    console.log('  node scripts/migration-runner.js <file> --force # Force re-run migration');
    console.log('\nExamples:');
    console.log('  npm run migrate scripts/create-missing-rpc-functions.sql');
    console.log('  npm run migrate:status');
    console.log('  npm run migrate:all');
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error('🚨 Unhandled error:', error);
    process.exit(1);
  });
}

export { executeMigration, showMigrationStatus };