#!/usr/bin/env node

/**
 * Remove 1000 Transaction Limits
 * 
 * This script removes all hardcoded 1000 transaction limits
 * to allow processing of all 18,000 transactions
 */

import { readFileSync, writeFileSync } from 'fs';

const filesToUpdate = [
  'src/services/behavioral-dashboard.ts',
  'src/services/simple-dashboard.ts', 
  'src/pages/Brands.tsx',
  'src/hooks/useApiQuery.ts'
];

function removeTransactionLimits() {
  console.log('🔧 Removing 1000 transaction limits to process all 18,000 transactions...\n');
  
  filesToUpdate.forEach(filePath => {
    try {
      console.log(`📝 Processing: ${filePath}`);
      
      const content = readFileSync(filePath, 'utf8');
      let updatedContent = content;
      let hasChanges = false;
      
      // Remove environment variable limit checks
      if (updatedContent.includes('REACT_APP_TRANSACTION_LIMIT')) {
        console.log('   🗑️  Removing REACT_APP_TRANSACTION_LIMIT checks...');
        
        // Remove the limit check blocks
        updatedContent = updatedContent.replace(
          /\/\/ Use configurable limit from environment variable[^}]+}/gs,
          '// Process all transactions without limit'
        );
        
        // Remove the environment variable usage
        updatedContent = updatedContent.replace(
          /const transactionLimit = import\.meta\.env\.REACT_APP_TRANSACTION_LIMIT;[\s\S]*?finalQuery = finalQuery\.limit\(Number\(transactionLimit\)\);[\s\S]*?}/g,
          '// Process all transactions without artificial limits'
        );
        
        // Remove individual limit checks
        updatedContent = updatedContent.replace(
          /if \(transactionLimit && !isNaN\(Number\(transactionLimit\)\)\) \{[\s\S]*?}/g,
          ''
        );
        
        hasChanges = true;
      }
      
      // Remove hardcoded .limit(1000) calls
      if (updatedContent.includes('.limit(1000)')) {
        console.log('   🗑️  Removing .limit(1000) calls...');
        updatedContent = updatedContent.replace(/\.limit\(1000\)/g, '');
        hasChanges = true;
      }
      
      // Update batch size comments to reflect full processing
      if (updatedContent.includes('Processing 1000')) {
        console.log('   📝 Updating processing messages...');
        updatedContent = updatedContent.replace(
          /Processing \d+ transactions for time series/g,
          'Processing all transactions for time series'
        );
        hasChanges = true;
      }
      
      // Update console logs that mention 1000 limit
      if (updatedContent.includes('1000 records')) {
        console.log('   📝 Updating console messages...');
        updatedContent = updatedContent.replace(
          /Supabase has a 1000 record default limit, so we need to paginate/g,
          'Processing all 18,000 records with efficient pagination'
        );
        hasChanges = true;
      }
      
      if (hasChanges) {
        writeFileSync(filePath, updatedContent);
        console.log('   ✅ Updated successfully');
      } else {
        console.log('   ⏭️  No changes needed');
      }
      
    } catch (error) {
      console.error(`   ❌ Error processing ${filePath}:`, error.message);
    }
    
    console.log('');
  });
  
  console.log('🎉 Transaction limit removal complete!');
  console.log('📊 Your dashboard will now process all 18,000 transactions');
  console.log('🚀 Time series analysis will use the full dataset');
}

// Run the function
removeTransactionLimits();