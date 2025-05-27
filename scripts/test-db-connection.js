#!/usr/bin/env node

// Direct database connection test
import pkg from 'pg';
const { Client } = pkg;

const connectionString = `postgresql://postgres.lcoxtanyckjzyxxcsjzz:R%40nd0mPA%24%242025%21@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`;

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