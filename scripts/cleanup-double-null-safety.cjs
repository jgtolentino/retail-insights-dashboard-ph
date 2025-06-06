#!/usr/bin/env node
// Clean up double null safety patterns from auto-fix

const fs = require('fs');
const path = require('path');

function cleanupDoubleNullSafety(content) {
  // Fix ((value || 0) || 0).toFixed() -> (value || 0).toFixed()
  content = content.replace(/\(\(([^)]+) \|\| 0\) \|\| 0\)\.toFixed\(/g, '($1 || 0).toFixed(');
  
  // Fix ) || 0).toFixed() -> ).toFixed()
  content = content.replace(/\) \|\| 0\)\.toFixed\(/g, ').toFixed(');
  
  return content;
}

function fixFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fixed = cleanupDoubleNullSafety(content);
  
  if (content !== fixed) {
    fs.writeFileSync(filePath, fixed);
    console.log(`✅ Cleaned ${filePath}`);
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

// Run the cleanup
console.log('🧹 Cleaning up double null safety patterns...\n');
const fixedCount = fixDirectory('./src');
console.log(`\n✅ Cleaned ${fixedCount} files`);

if (fixedCount > 0) {
  console.log('\n🎯 Removed redundant null safety patterns for cleaner code');
}