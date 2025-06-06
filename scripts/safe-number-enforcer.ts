// scripts/safe-number-enforcer.ts
// Pulser-wide unsafe code pattern detector

import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

interface UnsafePattern {
  pattern: RegExp;
  message: string;
  fix?: string;
}

const UNSAFE_PATTERNS: UnsafePattern[] = [
  {
    pattern: /(?<![\w\s]*\|\|\s*0\))\.toFixed\(/g,
    message: 'Unsafe .toFixed() call without null safety',
    fix: 'Use (value || 0).toFixed() or safeToFixed(value)'
  },
  {
    pattern: /parseFloat\([^)]+\)\.toFixed/g,
    message: 'parseFloat().toFixed() without null safety',
    fix: 'Use parseFloat(value || 0).toFixed()'
  },
  {
    pattern: /\[\w+\]\.(?!length|push|pop|map|filter)/g,
    message: 'Unsafe array access without bounds checking',
    fix: 'Use optional chaining: array?.[index]'
  },
  {
    pattern: /\w+\.\w+\.\w+(?!\?)/g,
    message: 'Deep property access without optional chaining',
    fix: 'Use optional chaining: obj?.prop?.subprop'
  }
];

function scanFile(filePath: string): { file: string; violations: Array<{ line: number; pattern: string; message: string }> } {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const violations: Array<{ line: number; pattern: string; message: string }> = [];

  UNSAFE_PATTERNS.forEach(({ pattern, message }) => {
    const matches = Array.from(content.matchAll(pattern));
    
    for (const match of matches) {
      if (match.index !== undefined) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        const lineContent = lines[lineNum - 1];
        
        if (lineContent) {
          violations.push({
            line: lineNum,
            pattern: lineContent.trim(),
            message
          });
        }
      }
    }
  });

  return { file: filePath, violations };
}

function scanDirectory(dir: string): void {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  let totalViolations = 0;
  
  console.log(chalk.yellow(`🔍 Scanning ${dir} for unsafe patterns...\n`));
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
      scanDirectory(fullPath);
    } else if (file.isFile() && /\.(ts|tsx|js|jsx)$/.test(file.name)) {
      const result = scanFile(fullPath);
      
      if (result.violations.length > 0) {
        console.log(chalk.red(`❌ ${result.file}`));
        
        result.violations.forEach(violation => {
          console.log(chalk.gray(`   Line ${violation.line}: ${violation.message}`));
          console.log(chalk.gray(`   Code: ${violation.pattern}`));
        });
        
        console.log();
        totalViolations += result.violations.length;
      }
    }
  }
  
  if (totalViolations === 0) {
    console.log(chalk.green('✅ No unsafe patterns detected!'));
  } else {
    console.log(chalk.red(`\n❌ Found ${totalViolations} unsafe patterns. Fix before deploying.`));
    process.exit(1);
  }
}

// Run the scanner
if (require.main === module) {
  scanDirectory('./src');
}