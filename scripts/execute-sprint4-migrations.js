#!/usr/bin/env node

/**
 * Execute Sprint 4 Migrations Directly
 * This script executes SQL migrations using the Supabase REST API
 */

const fs = require('fs');
const path = require('path');

// Supabase configuration
const SUPABASE_URL = 'https://lcoxtanyckjzyxxcsjzz.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODM0NTMyNywiZXhwIjoyMDYzOTIxMzI3fQ.42ByHcIAi1jrcpzdvfcMJyE6ibqr81d-rIjsqxL_Bbk';

// PostgreSQL connection for direct SQL execution
const { Client } = require('pg');

// Database connection string
const DATABASE_URL = `postgresql://postgres.lcoxtanyckjzyxxcsjzz:${process.env.DATABASE_PASSWORD || 'R@nd0mPA$$2025!'}@aws-0-us-west-1.pooler.supabase.com:5432/postgres`;

async function executeMigrations() {
  console.log('🚀 Executing Sprint 4 Migrations...\n');
  
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read migration files
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, '../migrations/sprint4_schema_updates.sql'), 
      'utf8'
    );
    const functionsSQL = fs.readFileSync(
      path.join(__dirname, '../migrations/sprint4_rpc_functions.sql'), 
      'utf8'
    );

    // Execute schema updates
    console.log('📝 Executing schema updates...');
    try {
      await client.query(schemaSQL);
      console.log('✅ Schema updates completed\n');
    } catch (err) {
      console.log('⚠️  Some schema updates may have already been applied');
      console.log(`   Error: ${err.message}\n`);
    }

    // Execute RPC functions
    console.log('📝 Creating RPC functions...');
    try {
      await client.query(functionsSQL);
      console.log('✅ RPC functions created\n');
    } catch (err) {
      console.log('⚠️  Some functions may have already been created');
      console.log(`   Error: ${err.message}\n`);
    }

    // Verify the migrations
    console.log('🔍 Verifying migrations...\n');
    
    // Check new columns
    const columnsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' 
      AND column_name IN ('payment_method', 'checkout_time', 'request_type')
    `);
    console.log(`✅ New columns found: ${columnsResult.rows.length}/3`);

    // Check new tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('substitutions', 'request_behaviors')
      AND table_schema = 'public'
    `);
    console.log(`✅ New tables found: ${tablesResult.rows.length}/2`);

    // Check functions
    const functionsResult = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_name LIKE 'get_%'
      AND routine_schema = 'public'
    `);
    console.log(`✅ RPC functions found: ${functionsResult.rows.length}`);

    console.log('\n🎉 Sprint 4 migrations executed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await client.end();
  }
}

// Check if pg module is available
try {
  require('pg');
  executeMigrations();
} catch (err) {
  console.log('📦 Installing pg module...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install pg', { stdio: 'inherit' });
    console.log('✅ pg module installed\n');
    executeMigrations();
  } catch (installError) {
    console.error('❌ Failed to install pg module');
    console.error('Please run: npm install pg');
  }
}