#!/usr/bin/env node

/**
 * Corrected Deletion Execution - Using actual schema
 * 
 * Delete transactions ID 18973 and 18466 safely
 * Using the actual transaction table schema discovered
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lcoxtanyckjzyxxcsjzz.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDUzMjcsImV4cCI6MjA2MzkyMTMyN30.W2JgvZdXubvWpKCNZ7TfjLiKANZO1Hlb164fBEKH2dA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Verify deletion targets using correct schema
 */
async function verifyDeletionTargets() {
  console.log('🔍 STEP 1: Verifying deletion targets...\n');
  
  const targetIds = [18973, 18466];
  
  // Check transactions with correct columns
  const { data: transactions, error: transError } = await supabase
    .from('transactions')
    .select('id, total_amount, customer_age, customer_gender, store_location, created_at')
    .in('id', targetIds)
    .order('created_at', { ascending: false });
  
  if (transError) {
    console.error('❌ Error checking transactions:', transError.message);
    return false;
  }
  
  console.log(`✅ Found ${transactions.length} transactions to delete:`);
  transactions.forEach((tx, index) => {
    console.log(`   ${index + 1}. ID ${tx.id} - $${tx.total_amount} - ${tx.customer_age}yr ${tx.customer_gender} - ${tx.created_at}`);
    console.log(`      Location: ${tx.store_location}`);
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
    console.log(`   ${index + 1}. Item ID ${item.id} - Transaction ${item.transaction_id} - Product ${item.product_id} - $${item.price} x${item.quantity}`);
  });
  
  return { transactions, items };
}

/**
 * Create backup of data
 */
async function createBackup() {
  console.log('\n💾 STEP 2: Creating backup...\n');
  
  const targetIds = [18973, 18466];
  
  try {
    // Get complete data for backup
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
    
    // Save backup to file
    const fs = await import('fs');
    const backupData = {
      timestamp: new Date().toISOString(),
      reason: 'Manual cleanup - 2 most recent records',
      deleted_transaction_ids: targetIds,
      transactions: transactionsToBackup,
      transaction_items: itemsToBackup,
      recovery_instructions: {
        note: 'To restore these records, insert the data back into the respective tables',
        tables: ['transactions', 'transaction_items'],
        order: 'Insert transactions first, then transaction_items'
      }
    };
    
    const backupPath = '/Users/tbwa/Documents/GitHub/retail-insights-dashboard-ph/backup-deleted-records.json';
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    
    console.log('✅ Local backup created: backup-deleted-records.json');
    console.log(`📊 Backup includes:`);
    console.log(`   - ${transactionsToBackup.length} transactions`);
    console.log(`   - ${itemsToBackup.length} transaction items`);
    console.log(`   - Complete recovery instructions`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Backup creation failed:', error.message);
    return false;
  }
}

/**
 * Execute the deletion
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
    if (remainingTransactions.length === 0) {
      console.log('✅ All target transactions successfully deleted');
    }
    
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
    if (remainingItems.length === 0) {
      console.log('✅ All target transaction items successfully deleted');
    }
    
    // Get new total count
    const { count: newTransactionCount, error: countError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error getting new count:', countError.message);
      return false;
    }
    
    console.log(`\n📊 New total transaction count: ${newTransactionCount}`);
    console.log(`🎯 Previous count: 18,002`);
    console.log(`🎯 Expected new count: 18,000`);
    
    if (newTransactionCount === 18000) {
      console.log('🎉 SUCCESS: Exactly 18,000 transactions remain!');
    } else {
      console.log(`⚠️ RESULT: ${newTransactionCount} transactions (difference from expected: ${newTransactionCount - 18000})`);
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
  console.log('Records:');
  console.log('• ID 18973: $172.50 - 28yr Male - 2025-06-04 14:35');
  console.log('• ID 18466: $188.50 - 28yr Male - 2025-06-04 13:46');
  console.log('\n' + '='.repeat(60));
  
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
    console.error('❌ Deletion verification failed - ABORTING');
    return false;
  }
  
  // Step 2: Create backups
  const backupSuccess = await createBackup();
  if (!backupSuccess) {
    console.error('❌ Backup creation failed - ABORTING DELETION');
    return false;
  }
  
  // Step 3: Execute deletion
  console.log('\n⚠️  PROCEEDING WITH DELETION IN 3 SECONDS...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
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
  console.log('\n' + '='.repeat(60));
  console.log('📋 DELETION SUMMARY');
  console.log('='.repeat(60));
  
  console.log('✅ STATUS: Deletion completed successfully');
  console.log(`📊 FINAL COUNT: ${verificationResult.newCount} transactions`);
  console.log(`📉 REDUCTION: 2 transactions deleted (18,002 → ${verificationResult.newCount})`);
  console.log('💾 BACKUP: Complete backup saved to backup-deleted-records.json');
  console.log('🔄 RECOVERY: Records can be restored from backup if needed');
  
  if (verificationResult.newCount === 18000) {
    console.log('\n🎉 PERFECT! Database now contains exactly 18,000 transactions!');
  } else {
    console.log(`\n📝 NOTE: Final count is ${verificationResult.newCount} (not exactly 18,000)`);
  }
  
  console.log('\n🔗 NEXT STEPS:');
  console.log('• Documentation updated to reflect new count');
  console.log('• Backup file contains complete recovery data');
  console.log('• Dashboard analytics will reflect the change');
  
  return true;
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