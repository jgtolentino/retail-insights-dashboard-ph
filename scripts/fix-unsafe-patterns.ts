// scripts/fix-unsafe-patterns.ts
// Auto-fix common unsafe patterns

import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

function fixUnsafeToFixed(content: string): string {
  // Fix unsafe .toFixed() calls
  return content
    .replace(/(?<![\w\s]*\|\|\s*0\))\.toFixed\(/g, ' || 0).toFixed(')
    .replace(/\(\s*\|\|\s*0\)\.toFixed\(/g, ' || 0).toFixed(')
    .replace(/\(\([^)]+\)\s*\|\|\s*0\)\.toFixed\(/g, '(($1) || 0).toFixed(');
}

function fixFile(filePath: string): boolean {
  const content = fs.readFileSync(filePath, 'utf8');
  const fixed = fixUnsafeToFixed(content);
  
  if (content !== fixed) {
    fs.writeFileSync(filePath, fixed);
    console.log(chalk.green(`✅ Fixed ${filePath}`));
    return true;
  }
  
  return false;
}

function fixDirectory(dir: string): number {
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
if (require.main === module) {
  console.log(chalk.yellow('🔧 Auto-fixing unsafe patterns...\n'));
  const fixedCount = fixDirectory('./src');
  console.log(chalk.green(`\n✅ Fixed ${fixedCount} files with unsafe patterns`));
}