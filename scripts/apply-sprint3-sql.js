import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applySprint3SQL() {
  console.log('🚀 Applying Sprint 3 SQL functions...');
  
  try {
    // Read the SQL file
    const sqlContent = readFileSync(join(process.cwd(), 'migrations/sprint3_consumer_insights.sql'), 'utf8');
    
    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (stmt.trim()) {
        console.log(`📋 Executing statement ${i + 1}...`);
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: stmt + ';' 
        });
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error);
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      }
    }
    
    console.log('🎉 Sprint 3 SQL migration completed!');
    
    // Test the functions
    console.log('🧪 Testing age distribution function...');
    const { data: ageData, error: ageError } = await supabase
      .rpc('get_age_distribution', {
        start_date: '2025-04-30T00:00:00Z',
        end_date: '2025-05-30T23:59:59Z',
        bucket_size: 10
      });
    
    if (ageError) {
      console.error('❌ Age distribution test failed:', ageError);
    } else {
      console.log('✅ Age distribution test passed:', ageData?.slice(0, 3));
    }
    
    console.log('🧪 Testing gender distribution function...');
    const { data: genderData, error: genderError } = await supabase
      .rpc('get_gender_distribution', {
        start_date: '2025-04-30T00:00:00Z',
        end_date: '2025-05-30T23:59:59Z'
      });
    
    if (genderError) {
      console.error('❌ Gender distribution test failed:', genderError);
    } else {
      console.log('✅ Gender distribution test passed:', genderData);
    }
    
  } catch (error) {
    console.error('💥 Failed to apply SQL migration:', error);
  }
}

applySprint3SQL();