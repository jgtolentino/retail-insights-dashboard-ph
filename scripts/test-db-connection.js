#!/usr/bin/env node

// Direct database connection test
import pkg from 'pg';
const { Client } = pkg;

// Use environment variable for database connection
const connectionString = process.env.SUPABASE_DB_URL || (() => {
  console.error('❌ SUPABASE_DB_URL environment variable not set');
  console.log('Set it with: export SUPABASE_DB_URL="your_connection_string"');
  process.exit(1);
})();

async function testConnection() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!');

    // Test query - count products
    console.log('📊 Counting products...');
    const result = await client.query('SELECT COUNT(*) as total_products FROM products');
    console.log('📈 Result:', result.rows[0]);

    // List tables
    console.log('📋 Listing tables...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('🗂️ Tables:', tables.rows.map(r => r.table_name));

  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Connection closed');
  }
}

testConnection();