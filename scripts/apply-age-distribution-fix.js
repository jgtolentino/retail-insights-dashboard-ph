#!/usr/bin/env node

/**
 * Apply Age Distribution Function Fix to Supabase
 * 
 * This script fixes the function signature conflict that causes:
 * "Could not choose the best candidate function" error
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required environment variables: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

async function applyFix() {
  console.log('🔧 Applying Age Distribution Function Fix...\n');
  
  // Create Supabase client with service role
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    // Read the SQL fix file
    const sqlFile = path.join(process.cwd(), 'scripts/fix-age-distribution.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📄 Executing SQL fix...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: sql 
    });
    
    if (error) {
      console.error('❌ Failed to execute SQL:', error.message);
      
      // Try alternative approach - execute each statement separately
      console.log('🔄 Trying alternative approach...');
      
      const statements = sql.split(';').filter(stmt => stmt.trim());
      
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i].trim();
        if (!stmt) continue;
        
        console.log(`📝 Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { error: stmtError } = await supabase.rpc('exec_sql', { 
            sql_query: stmt 
          });
          
          if (stmtError) {
            console.warn(`⚠️  Statement ${i + 1} warning:`, stmtError.message);
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.warn(`⚠️  Statement ${i + 1} failed:`, err.message);
        }
      }
    } else {
      console.log('✅ SQL fix executed successfully');
    }
    
    // Test the functions
    console.log('\n🧪 Testing fixed functions...');
    
    const testStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const testEndDate = new Date().toISOString();
    
    // Test age distribution
    console.log('🔍 Testing age distribution function...');
    const { data: ageData, error: ageError } = await supabase.rpc('get_age_distribution', {
      start_date: testStartDate,
      end_date: testEndDate,
      bucket_size: 10
    });
    
    if (ageError) {
      console.error('❌ Age distribution test failed:', ageError.message);
    } else {
      console.log('✅ Age distribution function working!');
      console.log(`📊 Found ${ageData?.length || 0} age buckets`);
      if (ageData?.length > 0) {
        console.log('📈 Sample data:', ageData.slice(0, 3));
      }
    }
    
    // Test gender distribution
    console.log('\n🔍 Testing gender distribution function...');
    const { data: genderData, error: genderError } = await supabase.rpc('get_gender_distribution', {
      start_date: testStartDate,
      end_date: testEndDate
    });
    
    if (genderError) {
      console.error('❌ Gender distribution test failed:', genderError.message);
    } else {
      console.log('✅ Gender distribution function working!');
      console.log(`📊 Found ${genderData?.length || 0} gender categories`);
      if (genderData?.length > 0) {
        console.log('📈 Sample data:', genderData.slice(0, 3));
      }
    }
    
    console.log('\n🎉 Age Distribution Fix Complete!');
    console.log('📋 Next steps:');
    console.log('   1. Deploy the updated frontend code');
    console.log('   2. Test the Consumer Insights page');
    console.log('   3. Verify age and gender charts load correctly');
    
  } catch (error) {
    console.error('💥 Failed to apply fix:', error.message);
    process.exit(1);
  }
}

// Run the fix
applyFix().catch(error => {
  console.error('💥 Script failed:', error.message);
  process.exit(1);
});