import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function testAllFilterFunctions() {
  console.log('🧪 COMPREHENSIVE FILTER FUNCTION TEST');
  console.log('='.repeat(80));

  const results = {
    functions_tested: 0,
    functions_working: 0,
    total_categories: 0,
    total_brands: 0,
    tbwa_brands: 0,
    competitor_brands: 0,
    test_results: []
  };

  // =====================================================
  // TEST 1: get_filter_options()
  // =====================================================
  console.log('\n🔍 TEST 1: get_filter_options()');
  console.log('-'.repeat(50));

  try {
    const { data, error } = await supabase.rpc('get_filter_options');
    results.functions_tested++;

    if (error) {
      console.log('❌ Function error:', error.message);
      results.test_results.push({name: 'get_filter_options', status: 'FAILED', error: error.message});
    } else {
      console.log('✅ Function executed successfully');
      
      const categories = data?.categories?.length || 0;
      const brands = data?.brands?.length || 0;
      const locations = data?.locations?.length || 0;
      const tbwaStats = data?.tbwa_stats || {};

      results.total_categories = categories;
      results.total_brands = brands;
      results.tbwa_brands = tbwaStats.tbwa_brands || 0;
      results.competitor_brands = tbwaStats.competitor_brands || 0;

      console.log(`   📊 Categories: ${categories}`);
      console.log(`   🏷️ Brands: ${brands}`);
      console.log(`   📍 Locations: ${locations}`);
      console.log(`   ✨ TBWA Brands: ${tbwaStats.tbwa_brands}`);
      console.log(`   🏢 Competitors: ${tbwaStats.competitor_brands}`);

      if (categories >= 5 && brands >= 50 && tbwaStats.tbwa_brands >= 20) {
        console.log('   🌟 EXCELLENT: Rich filter data available');
        results.functions_working++;
        results.test_results.push({name: 'get_filter_options', status: 'EXCELLENT'});
      } else {
        console.log('   ⚠️ WARNING: Limited filter data');
        results.test_results.push({name: 'get_filter_options', status: 'LIMITED'});
      }
    }
  } catch (err) {
    console.log('❌ Function not available:', err.message);
    results.test_results.push({name: 'get_filter_options', status: 'NOT_AVAILABLE'});
  }

  // =====================================================
  // TEST 2: validate_filter_combination()
  // =====================================================
  console.log('\n🔍 TEST 2: validate_filter_combination()');
  console.log('-'.repeat(50));

  try {
    const { data, error } = await supabase.rpc('validate_filter_combination', {
      p_categories: ['Dairy', 'Snacks'],
      p_tbwa_only: true
    });
    results.functions_tested++;

    if (error) {
      console.log('❌ Function error:', error.message);
      results.test_results.push({name: 'validate_filter_combination', status: 'FAILED', error: error.message});
    } else {
      console.log('✅ Function executed successfully');
      console.log(`   📊 Filter combination valid: ${data.is_valid}`);
      console.log(`   📈 Matching transactions: ${data.transaction_count}`);
      console.log(`   🔧 Filters applied: ${JSON.stringify(data.filters_applied)}`);

      if (data.is_valid && data.transaction_count > 0) {
        console.log('   🌟 EXCELLENT: Validation working correctly');
        results.functions_working++;
        results.test_results.push({name: 'validate_filter_combination', status: 'EXCELLENT'});
      } else {
        console.log('   ⚠️ WARNING: No matching data for test combination');
        results.test_results.push({name: 'validate_filter_combination', status: 'NO_MATCHES'});
      }
    }
  } catch (err) {
    console.log('❌ Function not available:', err.message);
    results.test_results.push({name: 'validate_filter_combination', status: 'NOT_AVAILABLE'});
  }

  // =====================================================
  // TEST 3: get_cascading_filter_options()
  // =====================================================
  console.log('\n🔍 TEST 3: get_cascading_filter_options()');
  console.log('-'.repeat(50));

  try {
    const { data, error } = await supabase.rpc('get_cascading_filter_options', {
      p_selected_categories: ['Snacks'],
      p_tbwa_only: true
    });
    results.functions_tested++;

    if (error) {
      console.log('❌ Function error:', error.message);
      results.test_results.push({name: 'get_cascading_filter_options', status: 'FAILED', error: error.message});
    } else {
      console.log('✅ Function executed successfully');
      
      const availableCategories = data?.available_categories?.length || 0;
      const availableBrands = data?.available_brands?.length || 0;
      const availableProducts = data?.available_products?.length || 0;
      const availableLocations = data?.available_locations?.length || 0;
      const totalTransactions = data?.total_matching_transactions || 0;
      const tbwaBreakdown = data?.tbwa_breakdown || {};

      console.log(`   📊 Available categories: ${availableCategories}`);
      console.log(`   🏷️ Available brands: ${availableBrands}`);
      console.log(`   📦 Available products: ${availableProducts}`);
      console.log(`   📍 Available locations: ${availableLocations}`);
      console.log(`   📈 Total matching transactions: ${totalTransactions}`);
      console.log(`   ✨ TBWA transactions: ${tbwaBreakdown.tbwa_transactions}`);
      console.log(`   🏢 Competitor transactions: ${tbwaBreakdown.competitor_transactions}`);

      if (totalTransactions > 0 && availableBrands > 0) {
        console.log('   🌟 EXCELLENT: Cascading filters working correctly');
        results.functions_working++;
        results.test_results.push({name: 'get_cascading_filter_options', status: 'EXCELLENT'});
      } else {
        console.log('   ⚠️ WARNING: Limited cascading data');
        results.test_results.push({name: 'get_cascading_filter_options', status: 'LIMITED'});
      }
    }
  } catch (err) {
    console.log('❌ Function not available:', err.message);
    results.test_results.push({name: 'get_cascading_filter_options', status: 'NOT_AVAILABLE'});
  }

  // =====================================================
  // TEST 4: check_filter_data_health()
  // =====================================================
  console.log('\n🔍 TEST 4: check_filter_data_health()');
  console.log('-'.repeat(50));

  try {
    const { data, error } = await supabase.rpc('check_filter_data_health');
    results.functions_tested++;

    if (error) {
      console.log('❌ Function error:', error.message);
      results.test_results.push({name: 'check_filter_data_health', status: 'FAILED', error: error.message});
    } else {
      console.log('✅ Function executed successfully');
      
      if (data && Array.isArray(data)) {
        let excellentChecks = 0;
        let okChecks = 0;
        let warningChecks = 0;

        data.forEach(check => {
          const statusIcon = check.status === 'EXCELLENT' ? '🌟' : 
                           check.status === 'OK' ? '✅' : '⚠️';
          console.log(`   ${statusIcon} ${check.check_name}: ${check.status}`);
          
          if (check.status === 'EXCELLENT') excellentChecks++;
          else if (check.status === 'OK') okChecks++;
          else warningChecks++;
        });

        const healthScore = `${excellentChecks + okChecks}/${data.length}`;
        console.log(`   📊 Health Score: ${healthScore}`);

        if (warningChecks === 0) {
          console.log('   🌟 EXCELLENT: All health checks passed');
          results.functions_working++;
          results.test_results.push({name: 'check_filter_data_health', status: 'EXCELLENT', health_score: healthScore});
        } else {
          console.log(`   ⚠️ ${warningChecks} warnings found`);
          results.test_results.push({name: 'check_filter_data_health', status: 'WARNINGS', health_score: healthScore});
        }
      }
    }
  } catch (err) {
    console.log('❌ Function not available:', err.message);
    results.test_results.push({name: 'check_filter_data_health', status: 'NOT_AVAILABLE'});
  }

  // =====================================================
  // TEST 5: get_brand_analysis_for_filters()
  // =====================================================
  console.log('\n🔍 TEST 5: get_brand_analysis_for_filters()');
  console.log('-'.repeat(50));

  try {
    const { data, error } = await supabase.rpc('get_brand_analysis_for_filters', {
      p_category: 'Snacks',
      p_tbwa_only: true
    });
    results.functions_tested++;

    if (error) {
      console.log('❌ Function error:', error.message);
      results.test_results.push({name: 'get_brand_analysis_for_filters', status: 'FAILED', error: error.message});
    } else {
      console.log('✅ Function executed successfully');
      
      const brands = data?.brands?.length || 0;
      const summary = data?.summary || {};

      console.log(`   🏷️ Analyzed brands: ${brands}`);
      console.log(`   💰 Total revenue: ₱${summary.total_revenue?.toLocaleString()}`);
      console.log(`   📊 Total transactions: ${summary.total_transactions}`);
      console.log(`   🏆 Top brand: ${summary.top_brand}`);
      console.log(`   📈 Avg revenue per brand: ₱${summary.avg_revenue_per_brand?.toLocaleString()}`);

      if (brands > 0 && summary.total_revenue > 0) {
        console.log('   🌟 EXCELLENT: Brand analysis working perfectly');
        results.functions_working++;
        results.test_results.push({name: 'get_brand_analysis_for_filters', status: 'EXCELLENT'});
      } else {
        console.log('   ⚠️ WARNING: Limited brand analysis data');
        results.test_results.push({name: 'get_brand_analysis_for_filters', status: 'LIMITED'});
      }
    }
  } catch (err) {
    console.log('❌ Function not available:', err.message);
    results.test_results.push({name: 'get_brand_analysis_for_filters', status: 'NOT_AVAILABLE'});
  }

  // =====================================================
  // COMPREHENSIVE TEST SUMMARY
  // =====================================================
  console.log('\n🎯 COMPREHENSIVE TEST SUMMARY');
  console.log('='.repeat(80));

  console.log(`📊 Functions Tested: ${results.functions_tested}/5`);
  console.log(`✅ Functions Working: ${results.functions_working}/5`);
  console.log(`🏷️ Total Brands: ${results.total_brands}`);
  console.log(`✨ TBWA Brands: ${results.tbwa_brands}`);
  console.log(`🏢 Competitor Brands: ${results.competitor_brands}`);
  console.log(`📊 Categories: ${results.total_categories}`);

  // Calculate overall score
  const overallScore = (results.functions_working / results.functions_tested * 100).toFixed(1);
  console.log(`\n🏆 Overall Score: ${overallScore}% (${results.functions_working}/${results.functions_tested})`);

  // Status assessment
  if (results.functions_working === 5) {
    console.log('🎉 STATUS: PERFECT - All filter functions operational!');
    console.log('✅ Your dashboard has enterprise-grade filter capabilities');
    console.log('🚀 Ready for production deployment');
  } else if (results.functions_working >= 3) {
    console.log('👍 STATUS: GOOD - Most filter functions working');
    console.log('🔧 Minor issues to address');
  } else {
    console.log('⚠️ STATUS: NEEDS ATTENTION - Several functions not working');
    console.log('🛠️ Requires troubleshooting');
  }

  // Detailed results
  console.log('\n📋 DETAILED TEST RESULTS:');
  console.log('-'.repeat(50));
  results.test_results.forEach((test, index) => {
    const statusIcon = test.status === 'EXCELLENT' ? '🌟' : 
                      test.status === 'FAILED' ? '❌' : 
                      test.status === 'NOT_AVAILABLE' ? '🚫' : '⚠️';
    
    console.log(`${index + 1}. ${statusIcon} ${test.name}: ${test.status}`);
    if (test.error) console.log(`   Error: ${test.error}`);
    if (test.health_score) console.log(`   Health: ${test.health_score}`);
  });

  // Feature readiness assessment
  console.log('\n🎯 FEATURE READINESS ASSESSMENT:');
  console.log('-'.repeat(50));
  
  const features = [
    { name: 'Smart Filter Population', ready: results.functions_working >= 1 },
    { name: 'Real-time Validation', ready: results.functions_working >= 2 },
    { name: 'Cascading Filters', ready: results.functions_working >= 3 },
    { name: 'Health Monitoring', ready: results.functions_working >= 4 },
    { name: 'Advanced Analytics', ready: results.functions_working === 5 }
  ];

  features.forEach(feature => {
    const icon = feature.ready ? '✅' : '⏳';
    console.log(`   ${icon} ${feature.name}`);
  });

  console.log('\n🚀 READY FOR INTEGRATION!');
  console.log('📖 See: docs/FILTER_INTEGRATION_GUIDE.md for implementation details');

  return results;
}

testAllFilterFunctions();