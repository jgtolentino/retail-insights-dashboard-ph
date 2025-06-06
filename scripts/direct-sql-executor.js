#!/usr/bin/env node

/**
 * Direct SQL Executor - Bypasses RPC and executes SQL directly
 * 
 * This script creates the bootstrap functions by making direct
 * PostgreSQL-compatible requests to Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const SUPABASE_URL = 'https://lcoxtanyckjzyxxcsjzz.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDUzMjcsImV4cCI6MjA2MzkyMTMyN30.W2JgvZdXubvWpKCNZ7TfjLiKANZO1Hlb164fBEKH2dA';

/**
 * Execute SQL directly via PostgREST
 */
async function executeDirectSQL(sql) {
  try {
    console.log('🔧 Executing SQL directly...');
    
    // Use Supabase's PostgREST to execute raw SQL
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ sql_text: sql })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('⚠️  PostgREST exec failed, trying alternative method...');
      
      // Try using a simple table query to test connection
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      
      // Create the exec_sql function step by step
      console.log('📝 Creating exec_sql function manually...');
      
      // We'll try to execute this as a 'transaction' by creating it via the client
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error && error.message.includes('does not exist')) {
        console.log('✅ As expected - exec_sql does not exist yet');
        console.log('🔧 This means we need to create it manually in Supabase SQL Editor');
        return false;
      }
      
      return !error;
    }

    const result = await response.json();
    console.log('✅ SQL executed successfully via PostgREST');
    return true;
    
  } catch (error) {
    console.error('❌ Direct SQL execution failed:', error.message);
    return false;
  }
}

/**
 * Bootstrap the SQL execution system
 */
async function bootstrap() {
  console.log('🚀 Bootstrapping SQL Execution System...\n');
  
  // Test connection first
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data, error } = await supabase.from('brands').select('count', { count: 'exact', head: true });
    if (error) throw error;
    console.log('✅ Supabase connection verified\n');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }

  // Read bootstrap SQL
  const bootstrapPath = resolve(process.cwd(), 'scripts/bootstrap-sql-executor.sql');
  const bootstrapSQL = readFileSync(bootstrapPath, 'utf8');
  
  console.log('📁 Bootstrap SQL loaded');
  console.log(`📊 Size: ${bootstrapSQL.length} characters\n`);
  
  // The bootstrap creates a circular dependency - exec_sql function is needed to create exec_sql function
  // So we need to show the manual step
  console.log('🔄 BOOTSTRAP CIRCULAR DEPENDENCY DETECTED');
  console.log('');
  console.log('The automated SQL system cannot bootstrap itself because:');
  console.log('- It needs exec_sql() function to execute SQL automatically');
  console.log('- But exec_sql() function needs to be created first');
  console.log('');
  console.log('📋 MANUAL BOOTSTRAP REQUIRED (One Time Only):');
  console.log('');
  console.log('1. Open Supabase SQL Editor:');
  console.log('   → https://supabase.com/dashboard/project/lcoxtanyckjzyxxcsjzz/sql');
  console.log('');
  console.log('2. Copy this entire SQL block and click "RUN":');
  console.log('');
  console.log('┌─' + '─'.repeat(78) + '─┐');
  console.log('│ COPY THIS SQL BLOCK TO SUPABASE SQL EDITOR:' + ' '.repeat(36) + '│');
  console.log('├─' + '─'.repeat(78) + '─┤');
  
  // Show the SQL in a nice format
  const lines = bootstrapSQL.split('\n');
  lines.forEach(line => {
    const truncated = line.length > 76 ? line.substring(0, 73) + '...' : line;
    console.log('│ ' + truncated.padEnd(77) + '│');
  });
  
  console.log('└─' + '─'.repeat(78) + '─┘');
  console.log('');
  console.log('3. After running the SQL, test the system:');
  console.log('   npm run migrate:status');
  console.log('');
  console.log('4. Then you can use automated SQL execution:');
  console.log('   npm run migrate scripts/any-file.sql');
  console.log('');
  console.log('🎯 This is a ONE-TIME setup. After this, everything is automated!');
  
  return true;
}

// Run if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  bootstrap().catch(console.error);
}

export { executeDirectSQL, bootstrap };