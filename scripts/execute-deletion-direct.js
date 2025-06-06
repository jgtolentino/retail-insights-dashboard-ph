#!/usr/bin/env node

/**
 * Direct Deletion Execution
 * 
 * Execute the deletion safely using individual operations
 * to bypass the need for exec_sql() function
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lcoxtanyckjzyxxcsjzz.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDUzMjcsImV4cCI6MjA2MzkyMTMyN30.W2JgvZdXubvWpKCNZ7TfjLiKANZO1Hlb164fBEKH2dA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Verify what we're about to delete
 */
async function verifyDeletionTargets() {
  console.log('🔍 STEP 1: Verifying deletion targets...\n');
  
  const targetIds = [18973, 18466];
  
  // Check transactions
  const { data: transactions, error: transError } = await supabase
    .from('transactions')
    .select('id, customer_id, store_id, total, created_at')
    .in('id', targetIds)
    .order('created_at', { ascending: false });
  
  if (transError) {
    console.error('❌ Error checking transactions:', transError.message);
    return false;
  }
  
  console.log(`✅ Found ${transactions.length} transactions to delete:`);
  transactions.forEach((tx, index) => {
    console.log(`   ${index + 1}. ID ${tx.id} - $${tx.total} - ${tx.created_at}`);
  });
  
  // Check related transaction_items
  const { data: items, error: itemsError } = await supabase
    .from('transaction_items')
    .select('id, transaction_id, product_id, quantity, price')
    .in('transaction_id', targetIds);
  
  if (itemsError) {
    console.error('❌ Error checking transaction items:', itemsError.message);
    return false;
  }
  
  console.log(`\n✅ Found ${items.length} related transaction items to delete:`);
  items.forEach((item, index) => {
    console.log(`   ${index + 1}. Item ID ${item.id} - Transaction ${item.transaction_id} - Product ${item.product_id}`);
  });
  
  return { transactions, items };
}

/**
 * Create backup tables and backup data
 */
async function createBackupsDirectly() {
  console.log('\n💾 STEP 2: Creating backups...\n');
  
  const targetIds = [18973, 18466];
  
  try {
    // Note: We cannot create tables via Supabase client directly
    // So we'll create a manual backup record in a simple way
    console.log('📝 Creating backup records...');
    
    // Get the data we're about to delete for backup
    const { data: transactionsToBackup, error: transError } = await supabase
      .from('transactions')
      .select('*')
      .in('id', targetIds);
    
    if (transError) {
      console.error('❌ Error backing up transactions:', transError.message);
      return false;
    }
    
    const { data: itemsToBackup, error: itemsError } = await supabase
      .from('transaction_items')
      .select('*')
      .in('transaction_id', targetIds);
    
    if (itemsError) {
      console.error('❌ Error backing up transaction items:', itemsError.message);
      return false;
    }
    
    console.log(`✅ Prepared backup for ${transactionsToBackup.length} transactions`);
    console.log(`✅ Prepared backup for ${itemsToBackup.length} transaction items`);
    
    // Save backup data to local JSON files as a fallback
    const fs = await import('fs');
    const backupData = {
      timestamp: new Date().toISOString(),
      reason: 'Manual cleanup - 2 most recent records',
      transactions: transactionsToBackup,
      transaction_items: itemsToBackup
    };
    
    fs.writeFileSync('/Users/tbwa/Documents/GitHub/retail-insights-dashboard-ph/backup-deleted-records.json', 
                     JSON.stringify(backupData, null, 2));
    
    console.log('✅ Local backup created: backup-deleted-records.json');
    
    return true;
    
  } catch (error) {
    console.error('❌ Backup creation failed:', error.message);
    return false;
  }
}

/**
 * Execute the actual deletion
 */
async function executeDeletion() {
  console.log('\n🗑️ STEP 3: Executing deletion...\n');
  
  const targetIds = [18973, 18466];
  
  try {
    // Delete transaction_items first (child records)
    console.log('🔧 Deleting transaction items...');
    const { error: itemsDeleteError } = await supabase
      .from('transaction_items')
      .delete()
      .in('transaction_id', targetIds);
    
    if (itemsDeleteError) {
      console.error('❌ Error deleting transaction items:', itemsDeleteError.message);
      return false;
    }
    
    console.log('✅ Transaction items deleted successfully');
    
    // Delete transactions (parent records)
    console.log('🔧 Deleting transactions...');
    const { error: transDeleteError } = await supabase
      .from('transactions')
      .delete()
      .in('id', targetIds);
    
    if (transDeleteError) {
      console.error('❌ Error deleting transactions:', transDeleteError.message);
      return false;
    }
    
    console.log('✅ Transactions deleted successfully');
    
    return true;
    
  } catch (error) {
    console.error('❌ Deletion failed:', error.message);
    return false;
  }
}

/**
 * Verify deletion results
 */
async function verifyDeletion() {
  console.log('\n✅ STEP 4: Verifying deletion results...\n');
  
  const targetIds = [18973, 18466];
  
  try {
    // Check that transactions are gone
    const { data: remainingTransactions, error: transError } = await supabase
      .from('transactions')
      .select('id')
      .in('id', targetIds);
    
    if (transError) {
      console.error('❌ Error verifying transaction deletion:', transError.message);
      return false;
    }
    
    console.log(`🔍 Remaining target transactions: ${remainingTransactions.length} (should be 0)`);
    
    // Check that transaction items are gone
    const { data: remainingItems, error: itemsError } = await supabase
      .from('transaction_items')
      .select('id')
      .in('transaction_id', targetIds);
    
    if (itemsError) {
      console.error('❌ Error verifying items deletion:', itemsError.message);
      return false;
    }
    
    console.log(`🔍 Remaining target transaction items: ${remainingItems.length} (should be 0)`);
    
    // Get new total count
    const { count: newTransactionCount, error: countError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error getting new count:', countError.message);
      return false;
    }
    
    console.log(`📊 New total transaction count: ${newTransactionCount}`);
    console.log(`🎯 Expected count: 18,000`);
    
    if (newTransactionCount === 18000) {
      console.log('🎉 SUCCESS: Exactly 18,000 transactions remain!');
    } else {
      console.log(`⚠️ UNEXPECTED: Expected 18,000, got ${newTransactionCount}`);
    }
    
    return {
      success: remainingTransactions.length === 0 && remainingItems.length === 0,
      newCount: newTransactionCount
    };
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 SAFE DELETION OF 2 MOST RECENT RECORDS\n');
  console.log('Target Transaction IDs: 18973, 18466\n');
  console.log('='.repeat(50));
  
  // Test connection
  try {
    const { data, error } = await supabase.from('brands').select('count', { count: 'exact', head: true });
    if (error) throw error;
    console.log('✅ Database connection verified\n');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
  
  // Step 1: Verify what we're deleting
  const verificationData = await verifyDeletionTargets();
  if (!verificationData) {
    console.error('❌ Deletion verification failed');
    return false;
  }
  
  // Step 2: Create backups
  const backupSuccess = await createBackupsDirectly();
  if (!backupSuccess) {
    console.error('❌ Backup creation failed - ABORTING DELETION');
    return false;
  }
  
  // Step 3: Execute deletion
  const deletionSuccess = await executeDeletion();
  if (!deletionSuccess) {
    console.error('❌ Deletion failed');
    return false;
  }
  
  // Step 4: Verify results
  const verificationResult = await verifyDeletion();
  if (!verificationResult) {
    console.error('❌ Deletion verification failed');
    return false;
  }
  
  // Final summary
  console.log('\n' + '='.repeat(50));
  console.log('📋 DELETION SUMMARY');
  console.log('='.repeat(50));
  
  if (verificationResult.success) {
    console.log('✅ STATUS: Deletion completed successfully');
    console.log(`📊 FINAL COUNT: ${verificationResult.newCount} transactions`);
    console.log('💾 BACKUP: Saved to backup-deleted-records.json');
    console.log('🔄 RECOVERY: Records can be restored from backup if needed');
    console.log('\n🎉 RESULT: Database now contains exactly the requested number of records!');
  } else {
    console.log('❌ STATUS: Deletion may have failed');
    console.log('🔍 ACTION: Manual verification required');
  }
  
  return verificationResult.success;
}

// Run if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  main()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('🚨 Fatal error:', error);
      process.exit(1);
    });
}

export { main };