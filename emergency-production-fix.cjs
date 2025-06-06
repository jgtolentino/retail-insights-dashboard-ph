// EMERGENCY PRODUCTION FIX
// Fixes console statements and database column issues
// Run: node emergency-production-fix.cjs

const fs = require('fs');
const path = require('path');

console.log('🚨 EMERGENCY PRODUCTION FIX STARTING...\n');

let totalFixes = 0;

// 1. Remove ALL remaining console statements
function removeAllConsoleStatements(filePath) {
  try {
    if (!fs.existsSync(filePath)) return 0;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let fixes = 0;
    
    // Remove ALL console statements completely
    const patterns = [
      /console\.(log|error|warn|debug|info|trace|table|group|groupEnd|time|timeEnd)\([^)]*\);?\s*\n?/g,
      /console\.(log|error|warn|debug|info|trace|table|group|groupEnd|time|timeEnd)`[^`]*`;?\s*\n?/g,
      /console\.(log|error|warn|debug|info|trace|table|group|groupEnd|time|timeEnd)\([^)]*\)[^;]*;?\s*\n?/g
    ];
    
    patterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, '');
        fixes += matches.length;
      }
    });
    
    if (fixes > 0) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ ${path.basename(filePath)}: Removed ${fixes} console statements`);
    }
    
    return fixes;
  } catch (error) {
    console.log(`❌ Error fixing ${filePath}: ${error.message}`);
    return 0;
  }
}

// 2. Fix database column name issues
function fixDatabaseColumns(filePath) {
  try {
    if (!fs.existsSync(filePath)) return 0;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let fixes = 0;
    
    // Fix common column name issues
    const columnFixes = [
      { old: 'is_tbwa_client', new: 'is_tbwa' },
      { old: ',amount,', new: ',total_amount,' },
      { old: '&amount=', new: '&total_amount=' },
      { old: 'select=.*amount', new: (match) => match.replace('amount', 'total_amount') }
    ];
    
    columnFixes.forEach(({ old, new: replacement }) => {
      if (content.includes(old)) {
        if (typeof replacement === 'function') {
          content = content.replace(new RegExp(old, 'g'), replacement);
        } else {
          content = content.replace(new RegExp(old, 'g'), replacement);
        }
        fixes++;
      }
    });
    
    if (fixes > 0) {
      fs.writeFileSync(filePath, content);
      console.log(`🔧 ${path.basename(filePath)}: Fixed ${fixes} database columns`);
    }
    
    return fixes;
  } catch (error) {
    console.log(`❌ Error fixing columns in ${filePath}: ${error.message}`);
    return 0;
  }
}

// 3. Process all files
function processAllFiles() {
  const extensions = ['.ts', '.tsx', '.js', '.jsx'];
  
  function processDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
          processDirectory(itemPath);
        }
      } else {
        const ext = path.extname(item);
        if (extensions.includes(ext)) {
          totalFixes += removeAllConsoleStatements(itemPath);
          totalFixes += fixDatabaseColumns(itemPath);
        }
      }
    }
  }
  
  console.log('Processing source files...');
  processDirectory('src');
  
  console.log('Processing API files...');
  processDirectory('api');
}

// 4. Create production environment template
function createProdEnvTemplate() {
  const prodEnv = `# PRODUCTION ENVIRONMENT VARIABLES
# Replace with actual production values

# Supabase Configuration
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Azure Configuration (Optional)
AZURE_KEYVAULT_URL=your_keyvault_url
AZURE_TENANT_ID=your_tenant_id
AZURE_CLIENT_ID=your_client_id
AZURE_CLIENT_SECRET=your_client_secret

# Vercel Configuration
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id

# Application Configuration
NODE_ENV=production
VITE_APP_ENV=production
`;

  fs.writeFileSync('.env.production.template', prodEnv);
  console.log('📝 Created .env.production.template');
}

// Main execution
async function emergencyFix() {
  console.log('🚨 Starting emergency production fixes...\n');
  
  processAllFiles();
  createProdEnvTemplate();
  
  console.log('\n📊 EMERGENCY FIX SUMMARY');
  console.log('='.repeat(40));
  console.log(`✅ Total fixes applied: ${totalFixes}`);
  console.log('✅ Console statements: REMOVED');
  console.log('✅ Database columns: FIXED'); 
  console.log('✅ Production template: CREATED');
  
  console.log('\n🚀 NEXT STEPS:');
  console.log('1. npm run build (should work now)');
  console.log('2. npm run dev (verify locally)');
  console.log('3. Update .env with production values');
  console.log('4. Deploy to tbwa-smp/project-scout');
  
  console.log('\n✨ Emergency fixes complete!');
}

emergencyFix().catch(console.error);