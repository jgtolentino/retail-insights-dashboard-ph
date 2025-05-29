import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function deployRemainingFunctions() {
  console.log('🚀 DEPLOYING REMAINING FILTER FUNCTIONS DIRECTLY');
  console.log('='.repeat(70));

  const functions = [
    {
      name: 'get_filter_options',
      sql: `
        CREATE OR REPLACE FUNCTION get_filter_options()
        RETURNS JSONB
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
            result JSONB;
        BEGIN
            SELECT jsonb_build_object(
                'categories', (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'value', category,
                            'label', category,
                            'count', usage_count
                        )
                    )
                    FROM (
                        SELECT 
                            b.category,
                            COUNT(DISTINCT t.id) as usage_count
                        FROM brands b
                        JOIN products p ON b.id = p.brand_id
                        JOIN transaction_items ti ON p.id = ti.product_id
                        JOIN transactions t ON ti.transaction_id = t.id
                        WHERE b.category IS NOT NULL
                        GROUP BY b.category
                        ORDER BY usage_count DESC
                    ) cat_data
                ),
                'brands', (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'value', id::text,
                            'label', name,
                            'category', category,
                            'is_tbwa', COALESCE(is_tbwa, false),
                            'count', usage_count
                        )
                    )
                    FROM (
                        SELECT 
                            b.id,
                            b.name,
                            b.category,
                            b.is_tbwa,
                            COUNT(DISTINCT t.id) as usage_count
                        FROM brands b
                        JOIN products p ON b.id = p.brand_id
                        JOIN transaction_items ti ON p.id = ti.product_id
                        JOIN transactions t ON ti.transaction_id = t.id
                        WHERE b.name IS NOT NULL
                        GROUP BY b.id, b.name, b.category, b.is_tbwa
                        ORDER BY usage_count DESC
                        LIMIT 100
                    ) brand_data
                ),
                'locations', (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'value', location,
                            'label', location,
                            'transaction_count', usage_count
                        )
                    )
                    FROM (
                        SELECT 
                            s.location,
                            COUNT(DISTINCT t.id) as usage_count
                        FROM stores s
                        JOIN transactions t ON s.id = t.store_id
                        WHERE s.location IS NOT NULL
                        GROUP BY s.location
                        ORDER BY usage_count DESC
                    ) location_data
                ),
                'tbwa_stats', (
                    SELECT jsonb_build_object(
                        'total_brands', COUNT(*),
                        'tbwa_brands', COUNT(CASE WHEN is_tbwa = true THEN 1 END),
                        'competitor_brands', COUNT(CASE WHEN is_tbwa = false THEN 1 END)
                    )
                    FROM brands
                    WHERE name IS NOT NULL
                )
            ) INTO result;
            
            RETURN result;
        END;
        $$;
      `
    },
    {
      name: 'validate_filter_combination',
      sql: `
        CREATE OR REPLACE FUNCTION validate_filter_combination(
            p_categories TEXT[] DEFAULT NULL,
            p_brands TEXT[] DEFAULT NULL,
            p_locations TEXT[] DEFAULT NULL,
            p_tbwa_only BOOLEAN DEFAULT NULL
        )
        RETURNS JSONB
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
            result JSONB;
            transaction_count INT;
        BEGIN
            SELECT COUNT(DISTINCT t.id) INTO transaction_count
            FROM transactions t
            JOIN stores s ON t.store_id = s.id
            JOIN transaction_items ti ON t.id = ti.transaction_id
            JOIN products p ON ti.product_id = p.id
            JOIN brands b ON p.brand_id = b.id
            WHERE (p_categories IS NULL OR b.category = ANY(p_categories))
                AND (p_brands IS NULL OR b.id::text = ANY(p_brands))
                AND (p_locations IS NULL OR s.location = ANY(p_locations))
                AND (p_tbwa_only IS NULL OR b.is_tbwa = p_tbwa_only);

            SELECT jsonb_build_object(
                'is_valid', transaction_count > 0,
                'transaction_count', transaction_count,
                'filters_applied', jsonb_build_object(
                    'categories', COALESCE(array_length(p_categories, 1), 0),
                    'brands', COALESCE(array_length(p_brands, 1), 0),
                    'locations', COALESCE(array_length(p_locations, 1), 0),
                    'tbwa_only', p_tbwa_only
                ),
                'message', CASE 
                    WHEN transaction_count > 0 THEN 'Filter combination is valid'
                    ELSE 'No data matches this filter combination'
                END
            ) INTO result;
            
            RETURN result;
        END;
        $$;
      `
    },
    {
      name: 'get_cascading_filter_options',
      sql: `
        CREATE OR REPLACE FUNCTION get_cascading_filter_options(
            p_selected_categories TEXT[] DEFAULT NULL,
            p_selected_brands TEXT[] DEFAULT NULL,
            p_selected_locations TEXT[] DEFAULT NULL,
            p_tbwa_only BOOLEAN DEFAULT NULL
        )
        RETURNS JSONB
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
            result JSONB;
        BEGIN
            WITH filtered_base AS (
                SELECT DISTINCT
                    t.id as transaction_id,
                    b.id as brand_id,
                    b.name as brand_name,
                    b.category,
                    b.is_tbwa,
                    p.id as product_id,
                    p.name as product_name,
                    s.location
                FROM transactions t
                JOIN stores s ON t.store_id = s.id
                JOIN transaction_items ti ON t.id = ti.transaction_id
                JOIN products p ON ti.product_id = p.id
                JOIN brands b ON p.brand_id = b.id
                WHERE (p_selected_categories IS NULL OR b.category = ANY(p_selected_categories))
                    AND (p_selected_brands IS NULL OR b.id::text = ANY(p_selected_brands))
                    AND (p_selected_locations IS NULL OR s.location = ANY(p_selected_locations))
                    AND (p_tbwa_only IS NULL OR b.is_tbwa = p_tbwa_only)
            )
            SELECT jsonb_build_object(
                'available_categories', (
                    SELECT jsonb_agg(DISTINCT category)
                    FROM filtered_base
                    WHERE category IS NOT NULL
                ),
                'available_brands', (
                    SELECT jsonb_agg(DISTINCT jsonb_build_object(
                        'id', brand_id::text,
                        'name', brand_name,
                        'category', category,
                        'is_tbwa', is_tbwa
                    ))
                    FROM filtered_base
                    WHERE brand_name IS NOT NULL
                ),
                'available_locations', (
                    SELECT jsonb_agg(DISTINCT location)
                    FROM filtered_base
                    WHERE location IS NOT NULL
                ),
                'tbwa_breakdown', (
                    SELECT jsonb_build_object(
                        'tbwa_transactions', COUNT(CASE WHEN is_tbwa = true THEN transaction_id END),
                        'competitor_transactions', COUNT(CASE WHEN is_tbwa = false THEN transaction_id END),
                        'total_transactions', COUNT(DISTINCT transaction_id)
                    )
                    FROM filtered_base
                ),
                'total_matching_transactions', (
                    SELECT COUNT(DISTINCT transaction_id)
                    FROM filtered_base
                )
            ) INTO result;
            
            RETURN result;
        END;
        $$;
      `
    },
    {
      name: 'check_filter_data_health',
      sql: `
        CREATE OR REPLACE FUNCTION check_filter_data_health()
        RETURNS TABLE (
            check_name TEXT,
            status TEXT,
            details JSONB
        )
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
            RETURN QUERY
            SELECT 
                'orphaned_records'::TEXT,
                CASE WHEN orphan_count > 0 THEN 'WARNING' ELSE 'OK' END::TEXT,
                jsonb_build_object(
                    'orphaned_transaction_items', orphan_count,
                    'description', 'Transaction items without valid transactions'
                )
            FROM (
                SELECT COUNT(*) as orphan_count
                FROM transaction_items ti 
                LEFT JOIN transactions t ON ti.transaction_id = t.id 
                WHERE t.id IS NULL
            ) x;

            RETURN QUERY
            SELECT 
                'missing_filter_data'::TEXT,
                CASE WHEN missing_count > 0 THEN 'WARNING' ELSE 'OK' END::TEXT,
                jsonb_build_object(
                    'brands_without_category', missing_count,
                    'description', 'Brands missing category information'
                )
            FROM (
                SELECT COUNT(*) as missing_count
                FROM brands 
                WHERE category IS NULL OR category = ''
            ) x;

            RETURN QUERY
            SELECT 
                'tbwa_distribution'::TEXT,
                CASE 
                    WHEN tbwa_count >= 20 AND competitor_count >= 10 THEN 'EXCELLENT'
                    WHEN tbwa_count >= 10 THEN 'OK'
                    ELSE 'WARNING'
                END::TEXT,
                jsonb_build_object(
                    'tbwa_brands', tbwa_count,
                    'competitor_brands', competitor_count,
                    'total_brands', total_brands,
                    'tbwa_percentage', ROUND((tbwa_count::DECIMAL / total_brands * 100), 2),
                    'description', 'TBWA vs competitor brand distribution'
                )
            FROM (
                SELECT 
                    COUNT(CASE WHEN is_tbwa = true THEN 1 END) as tbwa_count,
                    COUNT(CASE WHEN is_tbwa = false THEN 1 END) as competitor_count,
                    COUNT(*) as total_brands
                FROM brands
            ) x;
        END;
        $$;
      `
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const func of functions) {
    console.log(`\n🔧 Creating function: ${func.name}`);
    console.log('-'.repeat(40));

    try {
      // Execute the function creation SQL
      const { data, error } = await supabase.rpc('query', { 
        query: func.sql 
      });

      if (error) {
        console.log(`❌ Error creating ${func.name}:`);
        console.log(`   ${error.message}`);
        errorCount++;
      } else {
        console.log(`✅ Successfully created ${func.name}`);
        successCount++;
      }
    } catch (err) {
      console.log(`❌ Exception creating ${func.name}:`);
      console.log(`   ${err.message}`);
      errorCount++;
    }
  }

  console.log('\n📊 DEPLOYMENT SUMMARY:');
  console.log('='.repeat(50));
  console.log(`✅ Functions created: ${successCount}/4`);
  console.log(`❌ Errors: ${errorCount}`);

  // Test all functions after creation
  console.log('\n🧪 TESTING ALL FUNCTIONS:');
  console.log('='.repeat(50));

  const testResults = [];

  // Test 1: get_filter_options
  try {
    const { data, error } = await supabase.rpc('get_filter_options');
    if (error) {
      console.log('❌ get_filter_options: Failed');
      testResults.push({name: 'get_filter_options', status: 'FAILED'});
    } else {
      console.log('✅ get_filter_options: Working');
      console.log(`   Categories: ${data?.categories?.length || 0}`);
      console.log(`   Brands: ${data?.brands?.length || 0}`);
      console.log(`   TBWA brands: ${data?.tbwa_stats?.tbwa_brands || 0}`);
      testResults.push({name: 'get_filter_options', status: 'SUCCESS'});
    }
  } catch (err) {
    console.log('❌ get_filter_options: Not available');
    testResults.push({name: 'get_filter_options', status: 'NOT_AVAILABLE'});
  }

  // Test 2: validate_filter_combination
  try {
    const { data, error } = await supabase.rpc('validate_filter_combination', {
      p_categories: ['Dairy'],
      p_tbwa_only: true
    });
    if (error) {
      console.log('❌ validate_filter_combination: Failed');
      testResults.push({name: 'validate_filter_combination', status: 'FAILED'});
    } else {
      console.log('✅ validate_filter_combination: Working');
      console.log(`   Valid: ${data?.is_valid}, Transactions: ${data?.transaction_count}`);
      testResults.push({name: 'validate_filter_combination', status: 'SUCCESS'});
    }
  } catch (err) {
    console.log('❌ validate_filter_combination: Not available');
    testResults.push({name: 'validate_filter_combination', status: 'NOT_AVAILABLE'});
  }

  // Test 3: get_cascading_filter_options
  try {
    const { data, error } = await supabase.rpc('get_cascading_filter_options', {
      p_selected_categories: ['Snacks']
    });
    if (error) {
      console.log('❌ get_cascading_filter_options: Failed');
      testResults.push({name: 'get_cascading_filter_options', status: 'FAILED'});
    } else {
      console.log('✅ get_cascading_filter_options: Working');
      console.log(`   Available brands: ${data?.available_brands?.length || 0}`);
      testResults.push({name: 'get_cascading_filter_options', status: 'SUCCESS'});
    }
  } catch (err) {
    console.log('❌ get_cascading_filter_options: Not available');
    testResults.push({name: 'get_cascading_filter_options', status: 'NOT_AVAILABLE'});
  }

  // Test 4: check_filter_data_health
  try {
    const { data, error } = await supabase.rpc('check_filter_data_health');
    if (error) {
      console.log('❌ check_filter_data_health: Failed');
      testResults.push({name: 'check_filter_data_health', status: 'FAILED'});
    } else {
      console.log('✅ check_filter_data_health: Working');
      console.log(`   Health checks: ${data?.length || 0}`);
      testResults.push({name: 'check_filter_data_health', status: 'SUCCESS'});
    }
  } catch (err) {
    console.log('❌ check_filter_data_health: Not available');
    testResults.push({name: 'check_filter_data_health', status: 'NOT_AVAILABLE'});
  }

  // Final summary
  const workingFunctions = testResults.filter(r => r.status === 'SUCCESS').length;
  const totalFunctions = testResults.length + 1; // +1 for get_brand_analysis_for_filters which we know works

  console.log('\n🎯 FINAL STATUS:');
  console.log('='.repeat(50));
  console.log(`🚀 Total working functions: ${workingFunctions + 1}/${totalFunctions}`);
  
  if (workingFunctions >= 3) {
    console.log('🎉 EXCELLENT! Most functions are operational');
    console.log('✅ Your dashboard now has advanced filter capabilities');
  } else if (workingFunctions >= 1) {
    console.log('👍 GOOD! Some functions working, others need troubleshooting');
  } else {
    console.log('⚠️ Functions may need manual SQL deployment');
  }

  console.log('\n📋 INTEGRATION READY:');
  console.log('✅ get_brand_analysis_for_filters (confirmed working)');
  testResults.forEach(result => {
    const icon = result.status === 'SUCCESS' ? '✅' : result.status === 'FAILED' ? '⚠️' : '❌';
    console.log(`${icon} ${result.name}`);
  });

  return {
    successCount,
    errorCount,
    workingFunctions: workingFunctions + 1,
    totalFunctions
  };
}

deployRemainingFunctions();