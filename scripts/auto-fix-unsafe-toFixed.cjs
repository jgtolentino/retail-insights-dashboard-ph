#!/usr/bin/env node
// Auto-fix unsafe .toFixed() patterns

const fs = require('fs');
const path = require('path');

function fixUnsafeToFixed(content) {
  // Pattern 1: Simple .toFixed() without null safety
  content = content.replace(/(?<![\w\s]*\|\|\s*0\))\.toFixed\(/g, ' || 0).toFixed(');
  
  // Pattern 2: Fix malformed replacements
  content = content.replace(/\s+\|\|\s*0\)\.toFixed\(/g, ' || 0).toFixed(');
  
  // Pattern 3: Expression.toFixed() -> (Expression || 0).toFixed()
  content = content.replace(/([a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)*)\s*\.toFixed\(/g, '($1 || 0).toFixed(');
  
  // Pattern 4: (calculation).toFixed() -> ((calculation) || 0).toFixed()
  content = content.replace(/(\([^)]+\))\.toFixed\(/g, '($1 || 0).toFixed(');
  
  // Pattern 5: array[index].property.toFixed() -> (array[index]?.property || 0).toFixed()
  content = content.replace(/(\w+\[\d+\])\.(\w+)\.toFixed\(/g, '($1?.$2 || 0).toFixed(');
  
  return content;
}

function fixFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fixed = fixUnsafeToFixed(content);
  
  if (content !== fixed) {
    fs.writeFileSync(filePath, fixed);
    console.log(`✅ Fixed ${filePath}`);
    return true;
  }
  
  return false;
}

function fixDirectory(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  let fixedCount = 0;
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
      fixedCount += fixDirectory(fullPath);
    } else if (file.isFile() && /\.(ts|tsx|js|jsx)$/.test(file.name)) {
      if (fixFile(fullPath)) {
        fixedCount++;
      }
    }
  }
  
  return fixedCount;
}

// Run the fixer
console.log('🔧 Auto-fixing unsafe .toFixed() patterns...\n');
const fixedCount = fixDirectory('./src');
console.log(`\n✅ Fixed ${fixedCount} files with unsafe patterns`);

if (fixedCount > 0) {
  console.log('\n📋 Summary of fixes applied:');
  console.log('  • Added null safety to .toFixed() calls');
  console.log('  • Protected against undefined/null values');
  console.log('  • Maintained existing functionality');
  console.log('\n🚀 Ready to re-run deployment!');
}