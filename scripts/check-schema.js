#!/usr/bin/env node

import pkg from 'pg';
const { Client } = pkg;

const connectionString = `postgresql://postgres.lcoxtanyckjzyxxcsjzz:R%40nd0mPA%24%242025%21@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`;

async function checkSchema() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔍 Checking Database Schema...\n');

    // Get all tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('📋 Available Tables:');
    for (const table of tables.rows) {
      console.log(`   • ${table.table_name}`);
      
      // Get columns for each table
      const columns = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `, [table.table_name]);
      
      columns.rows.forEach(col => {
        console.log(`     - ${col.column_name} (${col.data_type})`);
      });
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkSchema();