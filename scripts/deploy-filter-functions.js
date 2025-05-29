import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function deployFilterFunctions() {
  console.log('🚀 DEPLOYING FILTER SYNCHRONIZATION FUNCTIONS');
  console.log('='.repeat(70));

  console.log('⚠️ IMPORTANT: These SQL functions need to be created in Supabase SQL Editor');
  console.log('📋 Copy and paste the SQL from: scripts/implement-filter-sync-functions.sql');
  console.log('🔗 Go to: https://app.supabase.com → SQL Editor\n');

  // Test if functions exist by trying to call them
  console.log('🔍 TESTING EXISTING FUNCTIONS:');
  console.log('-'.repeat(50));

  // Test 1: get_filter_options
  try {
    const { data, error } = await supabase.rpc('get_filter_options');
    
    if (error) {
      console.log('❌ get_filter_options: NOT DEPLOYED');
      console.log(`   Error: ${error.message}`);
    } else {
      console.log('✅ get_filter_options: WORKING');
      
      // Display key stats
      const categories = data?.categories?.length || 0;
      const brands = data?.brands?.length || 0;
      const products = data?.products?.length || 0;
      const locations = data?.locations?.length || 0;
      const tbwaStats = data?.tbwa_analysis;
      
      console.log(`   📊 Categories: ${categories}`);
      console.log(`   🏷️ Brands: ${brands}`);
      console.log(`   📦 Products: ${products}`);
      console.log(`   🏪 Locations: ${locations}`);
      
      if (tbwaStats) {
        console.log(`   ✨ TBWA Brands: ${tbwaStats.tbwa_brands}/${tbwaStats.total_brands}`);
        console.log(`   🏢 Competitors: ${tbwaStats.competitor_brands}`);
        console.log(`   📊 Categories with TBWA: ${tbwaStats.categories_with_tbwa}`);
      }
    }
  } catch (err) {
    console.log('❌ get_filter_options: FUNCTION NOT FOUND');
  }

  // Test 2: validate_filter_combination
  try {
    const { data, error } = await supabase.rpc('validate_filter_combination', {
      p_categories: ['Dairy', 'Snacks'],
      p_tbwa_only: true
    });
    
    if (error) {
      console.log('❌ validate_filter_combination: NOT DEPLOYED');
      console.log(`   Error: ${error.message}`);
    } else {
      console.log('✅ validate_filter_combination: WORKING');
      console.log(`   📊 Valid combination: ${data.is_valid}`);
      console.log(`   📈 Matching transactions: ${data.transaction_count}`);
    }
  } catch (err) {
    console.log('❌ validate_filter_combination: FUNCTION NOT FOUND');
  }

  // Test 3: get_cascading_filter_options
  try {
    const { data, error } = await supabase.rpc('get_cascading_filter_options', {
      p_selected_categories: ['Dairy'],
      p_tbwa_only: true
    });
    
    if (error) {
      console.log('❌ get_cascading_filter_options: NOT DEPLOYED');
      console.log(`   Error: ${error.message}`);
    } else {
      console.log('✅ get_cascading_filter_options: WORKING');
      const availableCategories = data?.available_categories?.length || 0;
      const availableBrands = data?.available_brands?.length || 0;
      const totalTransactions = data?.total_matching_transactions || 0;
      
      console.log(`   📊 Available categories: ${availableCategories}`);
      console.log(`   🏷️ Available brands: ${availableBrands}`);
      console.log(`   📈 Matching transactions: ${totalTransactions}`);
    }
  } catch (err) {
    console.log('❌ get_cascading_filter_options: FUNCTION NOT FOUND');
  }

  // Test 4: check_filter_data_health
  try {
    const { data, error } = await supabase.rpc('check_filter_data_health');
    
    if (error) {
      console.log('❌ check_filter_data_health: NOT DEPLOYED');
      console.log(`   Error: ${error.message}`);
    } else {
      console.log('✅ check_filter_data_health: WORKING');
      
      if (data && Array.isArray(data)) {
        data.forEach(check => {
          const statusIcon = check.status === 'OK' ? '✅' : 
                           check.status === 'EXCELLENT' ? '🌟' : '⚠️';
          console.log(`   ${statusIcon} ${check.check_name}: ${check.status}`);
        });
      }
    }
  } catch (err) {
    console.log('❌ check_filter_data_health: FUNCTION NOT FOUND');
  }

  // Test 5: get_brand_analysis_for_filters
  try {
    const { data, error } = await supabase.rpc('get_brand_analysis_for_filters', {
      p_category: 'Dairy',
      p_tbwa_only: true
    });
    
    if (error) {
      console.log('❌ get_brand_analysis_for_filters: NOT DEPLOYED');
      console.log(`   Error: ${error.message}`);
    } else {
      console.log('✅ get_brand_analysis_for_filters: WORKING');
      
      const summary = data?.summary;
      if (summary) {
        console.log(`   📊 Dairy TBWA brands: ${summary.total_brands}`);
        console.log(`   💰 Total revenue: ₱${summary.total_revenue?.toLocaleString()}`);
        console.log(`   🏆 Top brand: ${summary.top_brand}`);
      }
    }
  } catch (err) {
    console.log('❌ get_brand_analysis_for_filters: FUNCTION NOT FOUND');
  }

  // Summary
  console.log('\n🎯 DEPLOYMENT STATUS SUMMARY');
  console.log('='.repeat(70));
  
  // Check which functions are working
  const functionsToTest = [
    'get_filter_options',
    'validate_filter_combination', 
    'get_cascading_filter_options',
    'check_filter_data_health',
    'get_brand_analysis_for_filters'
  ];

  let workingFunctions = 0;
  for (const funcName of functionsToTest) {
    try {
      const { error } = await supabase.rpc(funcName);
      if (!error || !error.message.includes('function') || !error.message.includes('does not exist')) {
        workingFunctions++;
      }
    } catch (err) {
      // Function doesn't exist
    }
  }

  console.log(`📊 Functions Status: ${workingFunctions}/${functionsToTest.length} deployed`);
  
  if (workingFunctions === functionsToTest.length) {
    console.log('🎉 ALL FUNCTIONS DEPLOYED SUCCESSFULLY!');
    console.log('✅ Your dashboard now has advanced filter synchronization');
    console.log('🔄 Filters will automatically sync with real database data');
    console.log('📊 Cascading filters will show only valid combinations');
    console.log('🏷️ TBWA vs competitor analysis is ready');
  } else {
    console.log(`⚠️ ${functionsToTest.length - workingFunctions} functions need to be deployed`);
    console.log('\n📋 TO DEPLOY MISSING FUNCTIONS:');
    console.log('1. Open Supabase Dashboard → SQL Editor');
    console.log('2. Copy/paste scripts/implement-filter-sync-functions.sql');
    console.log('3. Run the SQL script');
    console.log('4. Re-run this script to verify');
  }

  // Generate sample usage examples
  console.log('\n💡 SAMPLE FUNCTION USAGE:');
  console.log('-'.repeat(40));
  console.log('// Get all available filter options');
  console.log('const options = await supabase.rpc("get_filter_options");');
  console.log('');
  console.log('// Validate a filter combination');
  console.log('const isValid = await supabase.rpc("validate_filter_combination", {');
  console.log('  p_categories: ["Dairy", "Snacks"],');
  console.log('  p_tbwa_only: true');
  console.log('});');
  console.log('');
  console.log('// Get cascading options based on current selection');
  console.log('const cascading = await supabase.rpc("get_cascading_filter_options", {');
  console.log('  p_selected_categories: ["Dairy"]');
  console.log('});');
  console.log('');
  console.log('// Check data health');
  console.log('const health = await supabase.rpc("check_filter_data_health");');
}

deployFilterFunctions();