#!/usr/bin/env node

/**
 * Examine Current Database Data Structure
 * 
 * This script analyzes the current database to understand:
 * - Total record counts in each table
 * - Most recent records by timestamp
 * - Data structure and relationships
 * - Sample data overview
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lcoxtanyckjzyxxcsjzz.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDUzMjcsImV4cCI6MjA2MzkyMTMyN30.W2JgvZdXubvWpKCNZ7TfjLiKANZO1Hlb164fBEKH2dA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Get table record counts
 */
async function getTableCounts() {
  console.log('📊 Analyzing table record counts...\n');
  
  const tables = [
    'transactions', 
    'transaction_items', 
    'products', 
    'brands', 
    'stores', 
    'customers',
    'substitutions'
  ];
  
  const counts = {};
  let totalRecords = 0;
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        counts[table] = 'Error';
      } else {
        console.log(`📋 ${table}: ${count.toLocaleString()} records`);
        counts[table] = count;
        totalRecords += count || 0;
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
      counts[table] = 'Error';
    }
  }
  
  console.log(`\n🎯 Total Records: ${totalRecords.toLocaleString()}`);
  return { counts, totalRecords };
}

/**
 * Find most recent records in each table
 */
async function findRecentRecords() {
  console.log('\n🕐 Finding most recent records...\n');
  
  const tables = [
    { name: 'transactions', idField: 'id', dateField: 'created_at' },
    { name: 'transaction_items', idField: 'id', dateField: 'created_at' },
    { name: 'products', idField: 'id', dateField: 'created_at' },
    { name: 'customers', idField: 'id', dateField: 'created_at' },
    { name: 'stores', idField: 'id', dateField: 'created_at' },
    { name: 'brands', idField: 'id', dateField: 'created_at' }
  ];
  
  const recentRecords = {};
  
  for (const table of tables) {
    try {
      console.log(`🔍 Checking ${table.name} for recent records...`);
      
      // Get most recent records
      const { data, error } = await supabase
        .from(table.name)
        .select(`${table.idField}, ${table.dateField}`)
        .order(table.dateField, { ascending: false })
        .limit(5);
      
      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
        recentRecords[table.name] = null;
      } else if (data && data.length > 0) {
        console.log(`   ✅ Found ${data.length} recent records`);
        console.log(`   📅 Most recent: ${table.idField}=${data[0][table.idField]}, ${table.dateField}=${data[0][table.dateField]}`);
        recentRecords[table.name] = data;
      } else {
        console.log(`   ⚠️  No records found`);
        recentRecords[table.name] = [];
      }
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`);
      recentRecords[table.name] = null;
    }
  }
  
  return recentRecords;
}

/**
 * Analyze data relationships
 */
async function analyzeRelationships() {
  console.log('\n🔗 Analyzing data relationships...\n');
  
  try {
    // Get sample transaction with related data
    const { data: sampleTransaction, error } = await supabase
      .from('transactions')
      .select(`
        id,
        customer_id,
        store_id,
        total,
        created_at,
        transaction_items (
          id,
          product_id,
          quantity,
          price,
          products (
            id,
            name,
            category,
            brand_id,
            brands (
              id,
              name
            )
          )
        ),
        customers (
          id,
          name,
          email
        ),
        stores (
          id,
          name,
          location
        )
      `)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      console.log('❌ Could not analyze relationships:', error.message);
      return null;
    }
    
    console.log('✅ Sample transaction structure:');
    console.log(`   Transaction ID: ${sampleTransaction.id}`);
    console.log(`   Customer: ${sampleTransaction.customers?.name || 'N/A'}`);
    console.log(`   Store: ${sampleTransaction.stores?.name || 'N/A'}`);
    console.log(`   Items: ${sampleTransaction.transaction_items?.length || 0}`);
    console.log(`   Total: $${sampleTransaction.total}`);
    console.log(`   Date: ${sampleTransaction.created_at}`);
    
    if (sampleTransaction.transaction_items?.length > 0) {
      const firstItem = sampleTransaction.transaction_items[0];
      console.log(`   First item: ${firstItem.products?.name || 'N/A'} (${firstItem.products?.brands?.name || 'N/A'})`);
    }
    
    return sampleTransaction;
    
  } catch (err) {
    console.log('❌ Relationship analysis failed:', err.message);
    return null;
  }
}

/**
 * Generate data summary statistics
 */
async function generateDataSummary() {
  console.log('\n📈 Generating data summary statistics...\n');
  
  try {
    // Use our working RPC function
    const { data: summary, error } = await supabase.rpc('get_dashboard_summary');
    
    if (error) {
      console.log('❌ Could not get dashboard summary:', error.message);
      return null;
    }
    
    if (summary && summary.length > 0) {
      const stats = summary[0];
      console.log('✅ Dashboard Summary Statistics:');
      console.log(`   📊 Total Revenue: $${stats.total_revenue?.toLocaleString() || 'N/A'}`);
      console.log(`   🛒 Total Transactions: ${stats.total_transactions?.toLocaleString() || 'N/A'}`);
      console.log(`   💰 Average Transaction: $${stats.avg_transaction || 'N/A'}`);
      console.log(`   👥 Unique Customers: ${stats.unique_customers?.toLocaleString() || 'N/A'}`);
      console.log(`   🔄 Suggestion Acceptance Rate: ${(stats.suggestion_acceptance_rate * 100).toFixed(1)}%`);
      console.log(`   ⚡ Substitution Rate: ${(stats.substitution_rate * 100).toFixed(1)}%`);
      
      return stats;
    }
    
    return null;
    
  } catch (err) {
    console.log('❌ Summary generation failed:', err.message);
    return null;
  }
}

/**
 * Main analysis function
 */
async function main() {
  console.log('🔍 DATABASE DATA ANALYSIS\n');
  console.log('='.repeat(50));
  
  // Test connection
  try {
    const { data, error } = await supabase.from('brands').select('count', { count: 'exact', head: true });
    if (error) throw error;
    console.log('✅ Database connection verified\n');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return;
  }
  
  // Run analysis
  const tableData = await getTableCounts();
  const recentData = await findRecentRecords();
  const relationships = await analyzeRelationships();
  const summary = await generateDataSummary();
  
  // Generate report
  console.log('\n' + '='.repeat(50));
  console.log('📋 ANALYSIS COMPLETE');
  console.log('='.repeat(50));
  
  console.log(`\n🎯 OVERVIEW:`);
  console.log(`   Total Records: ${tableData.totalRecords.toLocaleString()}`);
  console.log(`   Expected: 18,002 records`);
  console.log(`   Difference: ${(tableData.totalRecords - 18002).toLocaleString()}`);
  
  if (summary) {
    console.log(`\n💰 BUSINESS METRICS:`);
    console.log(`   Revenue: $${summary.total_revenue?.toLocaleString()}`);
    console.log(`   Transactions: ${summary.total_transactions?.toLocaleString()}`);
    console.log(`   Customers: ${summary.unique_customers?.toLocaleString()}`);
  }
  
  console.log(`\n📊 TABLE BREAKDOWN:`);
  Object.entries(tableData.counts).forEach(([table, count]) => {
    console.log(`   ${table}: ${typeof count === 'number' ? count.toLocaleString() : count} records`);
  });
  
  // Find candidates for deletion
  console.log(`\n🎯 DELETION CANDIDATES:`);
  console.log(`Looking for 2 most recent records to delete...`);
  
  let deletionCandidates = [];
  Object.entries(recentData).forEach(([table, records]) => {
    if (records && records.length > 0) {
      records.slice(0, 2).forEach(record => {
        deletionCandidates.push({
          table,
          id: record.id || record.customer_id || record.store_id,
          date: record.created_at || record.updated_at
        });
      });
    }
  });
  
  // Sort by date to find truly most recent
  deletionCandidates.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  console.log(`Found ${deletionCandidates.length} deletion candidates:`);
  deletionCandidates.slice(0, 2).forEach((candidate, index) => {
    console.log(`   ${index + 1}. ${candidate.table} ID=${candidate.id} (${candidate.date})`);
  });
  
  return {
    tableData,
    recentData,
    relationships,
    summary,
    deletionCandidates: deletionCandidates.slice(0, 2)
  };
}

// Run if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch(console.error);
}

export { main, getTableCounts, findRecentRecords, analyzeRelationships, generateDataSummary };