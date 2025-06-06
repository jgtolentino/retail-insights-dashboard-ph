const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyDataExtension() {
  console.log('🔧 Applying data extension script...');
  
  try {
    // Read the extend-existing-data.sql file
    const sqlScript = fs.readFileSync('./database/extend-existing-data.sql', 'utf8');
    
    // Split into individual statements
    const statements = sqlScript
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    let executed = 0;
    let errors = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip empty statements and comments
      if (!statement || statement.startsWith('--')) continue;
      
      try {
        console.log(`   [${i + 1}/${statements.length}] Executing statement...`);
        
        const { error } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        });
        
        if (error) {
          console.log(`   ❌ Error: ${error.message}`);
          errors++;
        } else {
          executed++;
        }
      } catch (err) {
        console.log(`   ❌ Exception: ${err.message}`);
        errors++;
      }
      
      // Add small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n📊 Execution Summary:`);
    console.log(`   ✅ Executed: ${executed} statements`);
    console.log(`   ❌ Errors: ${errors} statements`);
    
    if (errors === 0) {
      console.log('\n🎉 Data extension completed successfully!');
    } else {
      console.log('\n⚠️  Some errors occurred during execution');
    }
    
  } catch (error) {
    console.error('❌ Failed to apply data extension:', error);
    process.exit(1);
  }
}

applyDataExtension();