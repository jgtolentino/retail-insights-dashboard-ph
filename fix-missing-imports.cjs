// Fix Missing Imports - Production Sanitization
// Removes imports to deleted debug components

const fs = require('fs');
const path = require('path');

console.log('🔧 FIXING MISSING IMPORTS...\n');

// List of removed debug components
const removedComponents = [
  'DebugDataLoader',
  'QuickDataCheck', 
  'Sprint4DataVerification',
  'useRenderMonitor',
  'useEmergencyRenderLimit',
  'devWarnings'
];

// Function to fix imports in a file
function fixImports(filePath) {
  try {
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let changes = 0;
    
    // Remove import statements for debug components
    for (const component of removedComponents) {
      const importRegex = new RegExp(`import[^;]*${component}[^;]*;?\\s*`, 'g');
      if (content.match(importRegex)) {
        content = content.replace(importRegex, `// Debug import removed: ${component}\n`);
        changes++;
      }
    }
    
    // Remove usage of debug components  
    for (const component of removedComponents) {
      const usageRegex = new RegExp(`<${component}[^>]*/>`, 'g');
      if (content.match(usageRegex)) {
        content = content.replace(usageRegex, `{/* Debug component removed: ${component} */}`);
        changes++;
      }
      
      // Remove hook usage
      const hookRegex = new RegExp(`const[^=]*=\\s*${component}\\([^)]*\\);?`, 'g');
      if (content.match(hookRegex)) {
        content = content.replace(hookRegex, `// Debug hook removed: ${component}`);
        changes++;
      }
    }
    
    if (changes > 0) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed ${changes} imports in ${path.basename(filePath)}`);
    }
    
  } catch (error) {
    console.log(`❌ Error fixing ${filePath}: ${error.message}`);
  }
}

// Process all TypeScript files
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
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      fixImports(itemPath);
    }
  }
}

console.log('Processing source files...');
processDirectory('src');

console.log('\n✨ Import fixes complete!');
console.log('Next: npm run build');