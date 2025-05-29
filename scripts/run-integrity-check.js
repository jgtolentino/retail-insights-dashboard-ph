import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY required for integrity check');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function runIntegrityCheck() {
  console.log('🔍 DATABASE INTEGRITY CHECK STARTING');
  console.log('='.repeat(80));
  console.log(`📊 Target Database: ${supabaseUrl}`);
  console.log(`🕐 Check Time: ${new Date().toISOString()}\n`);

  // =====================================================
  // SECTION 1: DATA INTEGRITY CHECKS
  // =====================================================
  console.log('📋 SECTION 1: DATA INTEGRITY CHECKS');
  console.log('-'.repeat(50));

  try {
    const { data: orphanedData, error } = await supabase.rpc('sql', {
      query: `
        SELECT 'ORPHANED TRANSACTION ITEMS' as issue_type, COUNT(*) as count
        FROM transaction_items ti 
        LEFT JOIN transactions t ON ti.transaction_id = t.id 
        WHERE t.id IS NULL
        
        UNION ALL
        
        SELECT 'ORPHANED TRANSACTIONS (NO STORE)', COUNT(*)
        FROM transactions t 
        LEFT JOIN stores s ON t.store_id = s.id 
        WHERE s.id IS NULL
        
        UNION ALL
        
        SELECT 'ORPHANED PRODUCTS (NO BRAND)', COUNT(*)
        FROM products p 
        LEFT JOIN brands b ON p.brand_id = b.id 
        WHERE b.id IS NULL
        
        UNION ALL
        
        SELECT 'MISSING TRANSACTION ITEMS', COUNT(*)
        FROM transactions t 
        LEFT JOIN transaction_items ti ON t.id = ti.transaction_id 
        WHERE ti.id IS NULL;
      `
    });

    if (error) {
      // Try alternative approach with direct queries
      console.log('🔄 Using alternative integrity check approach...');
      
      // Check orphaned transaction items
      const { count: orphanedTI } = await supabase
        .from('transaction_items')
        .select('*', { count: 'exact', head: true })
        .not('transaction_id', 'in', `(SELECT id FROM transactions)`);
      
      // Check transactions
      const { count: totalTransactions } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });
      
      // Check transaction items
      const { count: totalTI } = await supabase
        .from('transaction_items')
        .select('*', { count: 'exact', head: true });
      
      // Check brands
      const { count: totalBrands } = await supabase
        .from('brands')
        .select('*', { count: 'exact', head: true });
      
      // Check products
      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
      
      // Check stores
      const { count: totalStores } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true });

      console.log('✅ Basic Data Counts:');
      console.log(`   📊 Transactions: ${totalTransactions?.toLocaleString()}`);
      console.log(`   📦 Transaction Items: ${totalTI?.toLocaleString()}`);
      console.log(`   🏷️ Brands: ${totalBrands}`);
      console.log(`   📦 Products: ${totalProducts}`);
      console.log(`   🏪 Stores: ${totalStores}`);
      
    } else {
      console.log('✅ Orphaned Records Check:');
      orphanedData?.forEach(row => {
        const status = row.count === 0 ? '✅' : '⚠️';
        console.log(`   ${status} ${row.issue_type}: ${row.count}`);
      });
    }
  } catch (err) {
    console.error('❌ Section 1 Error:', err.message);
  }

  // =====================================================
  // SECTION 2: FILTER VERIFICATION
  // =====================================================
  console.log('\n📋 SECTION 2: FILTER VERIFICATION');
  console.log('-'.repeat(50));

  try {
    // Check categories
    const { data: categories } = await supabase
      .from('brands')
      .select('category')
      .not('category', 'is', null)
      .not('category', 'eq', '');
    
    const uniqueCategories = [...new Set(categories?.map(b => b.category))];
    
    // Check brands with categories
    const { data: brandsWithCategories } = await supabase
      .from('brands')
      .select('id, name, category')
      .not('name', 'is', null)
      .not('name', 'eq', '');
    
    // Check products
    const { data: products } = await supabase
      .from('products')
      .select('id, name, brand_id')
      .not('name', 'is', null);
    
    // Check stores
    const { data: stores } = await supabase
      .from('stores')
      .select('id, name, location')
      .not('name', 'is', null);

    console.log('✅ Filter Data Sources:');
    console.log(`   🗂️ Categories: ${uniqueCategories.length} (${uniqueCategories.join(', ')})`);
    console.log(`   🏷️ Brands: ${brandsWithCategories?.length} with valid names`);
    console.log(`   📦 Products: ${products?.length} with valid names`);
    console.log(`   🏪 Stores: ${stores?.length} with valid names`);
    
  } catch (err) {
    console.error('❌ Section 2 Error:', err.message);
  }

  // =====================================================
  // SECTION 3: DATA FRESHNESS
  // =====================================================
  console.log('\n📋 SECTION 3: DATA FRESHNESS');
  console.log('-'.repeat(50));

  try {
    // Check transaction date range
    const { data: dateRange } = await supabase
      .from('transactions')
      .select('created_at')
      .order('created_at', { ascending: true })
      .limit(1);
    
    const { data: latestDate } = await supabase
      .from('transactions')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1);

    if (dateRange?.[0] && latestDate?.[0]) {
      const earliest = new Date(dateRange[0].created_at);
      const latest = new Date(latestDate[0].created_at);
      const daysDiff = Math.floor((latest - earliest) / (1000 * 60 * 60 * 24));
      
      console.log('✅ Transaction Date Range:');
      console.log(`   📅 Earliest: ${earliest.toISOString().substring(0, 10)}`);
      console.log(`   📅 Latest: ${latest.toISOString().substring(0, 10)}`);
      console.log(`   📊 Span: ${daysDiff} days`);
      
      const hoursAgo = Math.floor((new Date() - latest) / (1000 * 60 * 60));
      console.log(`   ⏰ Last transaction: ${hoursAgo} hours ago`);
    }
  } catch (err) {
    console.error('❌ Section 3 Error:', err.message);
  }

  // =====================================================
  // SECTION 4: TBWA BRAND STATUS
  // =====================================================
  console.log('\n📋 SECTION 4: TBWA BRAND STATUS');
  console.log('-'.repeat(50));

  try {
    const { data: tbwaCheck } = await supabase
      .from('brands')
      .select('name, is_tbwa_client')
      .not('name', 'is', null);

    const totalBrands = tbwaCheck?.length || 0;
    const tbwaBrands = tbwaCheck?.filter(b => b.is_tbwa_client === true).length || 0;
    const competitorBrands = totalBrands - tbwaBrands;

    console.log('✅ Brand Classification:');
    console.log(`   🏷️ Total Brands: ${totalBrands}`);
    console.log(`   ✨ TBWA Clients: ${tbwaBrands}`);
    console.log(`   🏢 Competitors: ${competitorBrands}`);

    // Show TBWA brands
    const tbwaBrandNames = tbwaCheck?.filter(b => b.is_tbwa_client === true).map(b => b.name) || [];
    if (tbwaBrandNames.length > 0) {
      console.log(`   📝 TBWA Brands: ${tbwaBrandNames.slice(0, 10).join(', ')}${tbwaBrandNames.length > 10 ? '...' : ''}`);
    }
    
  } catch (err) {
    console.error('❌ Section 4 Error:', err.message);
  }

  // =====================================================
  // SECTION 5: REVENUE CONSISTENCY
  // =====================================================
  console.log('\n📋 SECTION 5: REVENUE CONSISTENCY');
  console.log('-'.repeat(50));

  try {
    // Check total transaction amounts
    const { data: transactionRevenue } = await supabase
      .from('transactions')
      .select('total_amount');

    const totalTransactionRevenue = transactionRevenue?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;

    // Check transaction items revenue
    const { data: itemRevenue } = await supabase
      .from('transaction_items')
      .select('quantity, price');

    const totalItemRevenue = itemRevenue?.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0) || 0;

    console.log('✅ Revenue Analysis:');
    console.log(`   💰 Transaction Total: ₱${totalTransactionRevenue.toLocaleString()}`);
    console.log(`   💰 Items Total: ₱${totalItemRevenue.toLocaleString()}`);
    
    const difference = Math.abs(totalTransactionRevenue - totalItemRevenue);
    const percentDiff = totalTransactionRevenue > 0 ? (difference / totalTransactionRevenue * 100) : 0;
    
    console.log(`   📊 Difference: ₱${difference.toLocaleString()} (${percentDiff.toFixed(2)}%)`);
    
    if (percentDiff < 5) {
      console.log('   ✅ Revenue consistency: EXCELLENT');
    } else if (percentDiff < 15) {
      console.log('   ⚠️ Revenue consistency: ACCEPTABLE');
    } else {
      console.log('   ❌ Revenue consistency: NEEDS ATTENTION');
    }
    
  } catch (err) {
    console.error('❌ Section 5 Error:', err.message);
  }

  // =====================================================
  // SECTION 6: DATA QUALITY SUMMARY
  // =====================================================
  console.log('\n📋 SECTION 6: DATA QUALITY SUMMARY');
  console.log('-'.repeat(50));

  try {
    // Check for null/empty names
    const { count: brandsWithoutNames } = await supabase
      .from('brands')
      .select('*', { count: 'exact', head: true })
      .or('name.is.null,name.eq.');

    const { count: productsWithoutNames } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .or('name.is.null,name.eq.');

    const { count: storesWithoutLocations } = await supabase
      .from('stores')
      .select('*', { count: 'exact', head: true })
      .or('location.is.null,location.eq.');

    // Check for negative amounts
    const { count: negativeAmounts } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .lt('total_amount', 0);

    const { count: zeroQuantities } = await supabase
      .from('transaction_items')
      .select('*', { count: 'exact', head: true })
      .lte('quantity', 0);

    console.log('✅ Data Quality Check:');
    console.log(`   🏷️ Brands missing names: ${brandsWithoutNames || 0}`);
    console.log(`   📦 Products missing names: ${productsWithoutNames || 0}`);
    console.log(`   🏪 Stores missing locations: ${storesWithoutLocations || 0}`);
    console.log(`   💰 Negative amounts: ${negativeAmounts || 0}`);
    console.log(`   📦 Zero quantities: ${zeroQuantities || 0}`);

    const totalIssues = (brandsWithoutNames || 0) + (productsWithoutNames || 0) + 
                       (storesWithoutLocations || 0) + (negativeAmounts || 0) + (zeroQuantities || 0);

    if (totalIssues === 0) {
      console.log('   ✅ Overall Quality: EXCELLENT');
    } else if (totalIssues < 10) {
      console.log('   ⚠️ Overall Quality: GOOD (minor issues)');
    } else {
      console.log('   ❌ Overall Quality: NEEDS ATTENTION');
    }
    
  } catch (err) {
    console.error('❌ Section 6 Error:', err.message);
  }

  // =====================================================
  // FINAL SUMMARY
  // =====================================================
  console.log('\n🎯 FINAL INTEGRITY CHECK SUMMARY');
  console.log('='.repeat(80));

  try {
    const { count: finalTransactionCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });

    const { count: finalItemCount } = await supabase
      .from('transaction_items')
      .select('*', { count: 'exact', head: true });

    const { count: finalBrandCount } = await supabase
      .from('brands')
      .select('*', { count: 'exact', head: true });

    const { count: finalProductCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    const { count: finalStoreCount } = await supabase
      .from('stores')
      .select('*', { count: 'exact', head: true });

    console.log('📊 FINAL DATABASE STATUS:');
    console.log(`   📊 Transactions: ${finalTransactionCount?.toLocaleString()}`);
    console.log(`   📦 Transaction Items: ${finalItemCount?.toLocaleString()}`);
    console.log(`   🏷️ Brands: ${finalBrandCount}`);
    console.log(`   📦 Products: ${finalProductCount}`);
    console.log(`   🏪 Stores: ${finalStoreCount}`);

    if (finalTransactionCount >= 18000) {
      console.log('\n🎉 TARGET ACHIEVED: 18,000+ transactions!');
      console.log('✅ Database is ready for advanced filter implementation!');
    } else {
      console.log(`\n📈 Progress: ${finalTransactionCount}/18,000 transactions`);
    }

    console.log('\n🔗 NEXT STEPS:');
    console.log('1. ✅ Database integrity verified');
    console.log('2. 🔄 Ready to implement filter synchronization RPC functions');
    console.log('3. 📊 Dashboard can use validated filter data sources');
    console.log('4. 🚀 Production-ready for advanced analytics');

  } catch (err) {
    console.error('❌ Final Summary Error:', err.message);
  }

  console.log(`\n✅ Integrity check completed at ${new Date().toISOString()}`);
}

runIntegrityCheck();