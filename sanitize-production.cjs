// Production Sanitization Script
// Removes console statements, internal references, and debug code
// Run: node sanitize-production.cjs

const fs = require('fs');
const path = require('path');

console.log('🧹 PRODUCTION SANITIZATION STARTING...\n');

let totalFilesProcessed = 0;
let totalConsoleRemoved = 0;
let totalChanges = 0;

// Files to completely remove (debug-only components)
const filesToRemove = [
  'src/components/DebugDataLoader.tsx',
  'src/components/QuickDataCheck.tsx', 
  'src/components/Sprint4DataVerification.tsx',
  'src/utils/devWarnings.ts',
  'src/hooks/debugging/useRenderMonitor.ts',
  'src/hooks/debugging/useEmergencyRenderLimit.ts',
  'src/test/setup.ts',
  'src/utils/pre-sprint-checks.ts'
];

// TBWA-specific files to remove or sanitize
const tbwaFiles = [
  'src/pages/TBWADashboard.tsx',
  'src/components/TBWAMetricCard.tsx',
  'src/components/TBWABrandPerformanceGrid.tsx', 
  'src/components/TBWACompetitiveToggle.tsx',
  'src/styles/tbwa-theme.css'
];

// Function to remove console statements
function removeConsoleStatements(content) {
  let changes = 0;
  
  // Remove console.log statements
  content = content.replace(/console\.log\([^)]*\);?\s*/g, () => {
    changes++;
    return '';
  });
  
  // Remove console.error statements  
  content = content.replace(/console\.error\([^)]*\);?\s*/g, () => {
    changes++;
    return '';
  });
  
  // Remove console.warn statements
  content = content.replace(/console\.warn\([^)]*\);?\s*/g, () => {
    changes++;
    return '';
  });
  
  // Remove console.debug statements
  content = content.replace(/console\.debug\([^)]*\);?\s*/g, () => {
    changes++;
    return '';
  });
  
  return { content, changes };
}

// Function to remove internal references
function removeInternalReferences(content, filePath) {
  let changes = 0;
  
  // Remove TBWA references
  if (content.includes('TBWA') || content.includes('tbwa')) {
    content = content.replace(/TBWA/g, 'Client');
    content = content.replace(/tbwa/g, 'client');
    changes++;
  }
  
  // Remove development TODOs with internal references
  content = content.replace(/\/\/ TODO:.*?(internal|agent|debug).*?\n/gi, () => {
    changes++;
    return '';
  });
  
  // Remove localhost URLs
  content = content.replace(/http:\/\/localhost:\d+/g, () => {
    changes++;
    return 'PRODUCTION_URL';
  });
  
  // Remove agent names and internal system references
  content = content.replace(/\/\/ Agent:.*?\n/g, () => {
    changes++;
    return '';
  });
  
  return { content, changes };
}

// Function to sanitize error boundary logging
function sanitizeErrorBoundaries(content) {
  let changes = 0;
  
  // Replace detailed error logging with production-safe logging
  if (content.includes('componentDidCatch')) {
    content = content.replace(
      /console\.error\(['"`].*?['"`],\s*error,\s*errorInfo\);?/g,
      () => {
        changes++;
        return '// Production error logging removed';
      }
    );
  }
  
  return { content, changes };
}

// Function to process a single file
function sanitizeFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let totalFileChanges = 0;
    
    // Remove console statements
    const consoleResult = removeConsoleStatements(content);
    content = consoleResult.content;
    totalFileChanges += consoleResult.changes;
    totalConsoleRemoved += consoleResult.changes;
    
    // Remove internal references
    const internalResult = removeInternalReferences(content, filePath);
    content = internalResult.content;
    totalFileChanges += internalResult.changes;
    
    // Sanitize error boundaries
    const errorResult = sanitizeErrorBoundaries(content);
    content = errorResult.content;
    totalFileChanges += errorResult.changes;
    
    // Write back if changes were made
    if (totalFileChanges > 0) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ ${path.basename(filePath)}: ${totalFileChanges} changes`);
      totalChanges += totalFileChanges;
    }
    
    totalFilesProcessed++;
    
  } catch (error) {
    console.log(`❌ Error processing ${filePath}: ${error.message}`);
  }
}

// Function to recursively process directory
function processDirectory(dirPath, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  if (!fs.existsSync(dirPath)) {
    return;
  }
  
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and other irrelevant directories
      if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
        processDirectory(itemPath, extensions);
      }
    } else {
      const ext = path.extname(item);
      if (extensions.includes(ext)) {
        sanitizeFile(itemPath);
      }
    }
  }
}

// Function to remove debug-only files
function removeDebugFiles() {
  console.log('🗑️ Removing debug-only files...');
  
  for (const file of filesToRemove) {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`🗑️ Removed: ${file}`);
    }
  }
}

// Function to handle TBWA-specific content
function handleTBWAContent() {
  console.log('🏢 Processing TBWA-specific content...');
  
  for (const file of tbwaFiles) {
    if (fs.existsSync(file)) {
      // For now, just mark them as client-specific
      let content = fs.readFileSync(file, 'utf8');
      content = '// Client-specific component - requires customization\n' + content;
      content = content.replace(/TBWA/g, 'CLIENT');
      content = content.replace(/tbwa/g, 'client');
      fs.writeFileSync(file, content);
      console.log(`🏢 Sanitized TBWA content: ${file}`);
    }
  }
}

// Function to sanitize package.json scripts
function sanitizePackageJson() {
  console.log('📦 Sanitizing package.json...');
  
  const packagePath = 'package.json';
  if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Remove debug scripts that shouldn't be in production
    const debugScripts = ['debug', 'debug:runtime', 'monitor', 'status:update'];
    
    for (const script of debugScripts) {
      if (pkg.scripts && pkg.scripts[script]) {
        delete pkg.scripts[script];
        console.log(`📦 Removed debug script: ${script}`);
      }
    }
    
    fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
  }
}

// Function to create production config template
function createProductionConfig() {
  console.log('⚙️ Creating production configuration template...');
  
  const prodConfig = `// Production Configuration Template
// Replace with actual production values

export const config = {
  database: {
    url: process.env.DATABASE_URL || 'YOUR_PRODUCTION_DATABASE_URL',
    key: process.env.DATABASE_KEY || 'YOUR_PRODUCTION_DATABASE_KEY'
  },
  api: {
    baseUrl: process.env.API_BASE_URL || 'YOUR_PRODUCTION_API_URL'
  },
  features: {
    debug: false,
    monitoring: true,
    analytics: true
  }
};
`;
  
  fs.writeFileSync('src/config/production.ts', prodConfig);
  console.log('⚙️ Created production configuration template');
}

// Main sanitization process
async function runSanitization() {
  console.log('Starting production sanitization process...\n');
  
  // 1. Remove debug-only files
  removeDebugFiles();
  
  // 2. Handle TBWA-specific content
  handleTBWAContent();
  
  // 3. Process source files
  console.log('🧹 Processing source files...');
  processDirectory('src');
  
  // 4. Process API files
  console.log('🌐 Processing API files...');
  processDirectory('api');
  
  // 5. Sanitize package.json
  sanitizePackageJson();
  
  // 6. Create production config template
  if (!fs.existsSync('src/config')) {
    fs.mkdirSync('src/config', { recursive: true });
  }
  createProductionConfig();
  
  // 7. Summary
  console.log('\n📊 SANITIZATION SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Files processed: ${totalFilesProcessed}`);
  console.log(`🧹 Console statements removed: ${totalConsoleRemoved}`);
  console.log(`🔧 Total changes made: ${totalChanges}`);
  console.log(`🗑️ Debug files removed: ${filesToRemove.length}`);
  console.log(`🏢 TBWA files sanitized: ${tbwaFiles.length}`);
  
  console.log('\n✨ PRODUCTION SANITIZATION COMPLETE!');
  console.log('📋 Next steps:');
  console.log('1. Review changes with git diff');
  console.log('2. Update production configuration values');
  console.log('3. Test build: npm run build');
  console.log('4. Commit sanitized version');
  console.log('5. Deploy to production');
}

// Run sanitization
runSanitization().catch(console.error);