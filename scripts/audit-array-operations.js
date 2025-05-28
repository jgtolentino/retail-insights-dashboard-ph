#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');

const ARRAY_OPERATIONS = {
  arrayFrom: {
    pattern: /Array\.from\s*\(/g,
    riskLevel: 'high',
    description: 'Array.from() can fail if passed undefined/null'
  },
  unsafeMap: {
    pattern: /(?<!\?|safeMap\(|safeArray\()([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\.map\s*\(/g,
    riskLevel: 'medium',
    description: 'map() on potentially undefined arrays'
  },
  unsafeFilter: {
    pattern: /(?<!\?|safeArray\()([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\.filter\s*\(/g,
    riskLevel: 'medium',
    description: 'filter() on potentially undefined arrays'
  },
  unsafeReduce: {
    pattern: /(?<!\?|safeArray\()([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\.reduce\s*\(/g,
    riskLevel: 'high',
    description: 'reduce() on potentially undefined arrays'
  },
  unsafeLength: {
    pattern: /(?<!\?)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\.length(?!\s*\|\|)/g,
    riskLevel: 'low',
    description: 'length access without optional chaining'
  },
  unsafeIncludes: {
    pattern: /(?<!\?|safeArray\()([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\.includes\s*\(/g,
    riskLevel: 'medium',
    description: 'includes() on potentially undefined arrays'
  }
};

async function auditFile(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const issues = [];
  
  for (const [operationType, config] of Object.entries(ARRAY_OPERATIONS)) {
    const matches = [...content.matchAll(config.pattern)];
    
    matches.forEach(match => {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const line = content.split('\n')[lineNumber - 1];
      
      // Skip if it's already safe
      if (line.includes('safeArray') || line.includes('safeArrayFrom') || line.includes('|| []')) {
        return;
      }
      
      issues.push({
        file: filePath,
        line: lineNumber,
        column: match.index - content.lastIndexOf('\n', match.index - 1),
        type: operationType,
        riskLevel: config.riskLevel,
        description: config.description,
        code: line.trim(),
        match: match[0]
      });
    });
  }
  
  return issues;
}

async function generateFixes(issues) {
  const fixes = {};
  
  issues.forEach(issue => {
    if (!fixes[issue.file]) {
      fixes[issue.file] = [];
    }
    
    let fix = null;
    
    switch (issue.type) {
      case 'arrayFrom':
        // Check if it's Array.from with length parameter
        if (issue.code.includes('{ length:')) {
          fix = {
            old: issue.match,
            new: `safeArrayFrom({ length: /* extracted length */ })`,
            note: 'Replace with loop or use safeArrayFrom'
          };
        } else {
          fix = {
            old: issue.match,
            new: `safeArrayFrom(`,
            note: 'Use safeArrayFrom utility'
          };
        }
        break;
        
      case 'unsafeMap':
      case 'unsafeFilter':
      case 'unsafeReduce':
      case 'unsafeIncludes':
        const varName = issue.match.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\./)[1];
        fix = {
          old: `${varName}.${issue.type.replace('unsafe', '').toLowerCase()}(`,
          new: `(${varName} || []).${issue.type.replace('unsafe', '').toLowerCase()}(`,
          note: 'Add null check with fallback'
        };
        break;
        
      case 'unsafeLength':
        const lengthVar = issue.match.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\.length/)[1];
        fix = {
          old: `${lengthVar}.length`,
          new: `(${lengthVar}?.length || 0)`,
          note: 'Add optional chaining with fallback'
        };
        break;
    }
    
    if (fix) {
      fixes[issue.file].push({
        ...fix,
        line: issue.line,
        riskLevel: issue.riskLevel
      });
    }
  });
  
  return fixes;
}

async function main() {
  console.log('🔍 Auditing array operations...\n');
  
  try {
    // Find all TypeScript/JavaScript files
    const files = await glob('src/**/*.{ts,tsx,js,jsx}', {
      cwd: process.cwd(),
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
    });
    
    console.log(`Found ${files.length} files to audit\n`);
    
    let totalIssues = 0;
    const allIssues = [];
    const riskCounts = { high: 0, medium: 0, low: 0 };
    
    for (const file of files) {
      const filePath = path.join(process.cwd(), file);
      const issues = await auditFile(filePath);
      
      if (issues.length > 0) {
        totalIssues += issues.length;
        allIssues.push(...issues);
        
        issues.forEach(issue => {
          riskCounts[issue.riskLevel]++;
        });
        
        console.log(`📄 ${file}:`);
        issues.forEach(issue => {
          const riskIcon = issue.riskLevel === 'high' ? '🔴' :
                          issue.riskLevel === 'medium' ? '🟡' : '🟢';
          console.log(`  ${riskIcon} Line ${issue.line}: ${issue.description}`);
          console.log(`     ${issue.code}\n`);
        });
      }
    }
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`Total issues found: ${totalIssues}`);
    console.log(`  🔴 High risk: ${riskCounts.high}`);
    console.log(`  🟡 Medium risk: ${riskCounts.medium}`);
    console.log(`  🟢 Low risk: ${riskCounts.low}`);
    
    // Generate fixes
    if (totalIssues > 0) {
      const fixes = await generateFixes(allIssues);
      
      // Save audit report
      const report = {
        timestamp: new Date().toISOString(),
        totalIssues,
        riskCounts,
        issues: allIssues,
        fixes
      };
      
      await fs.writeFile(
        'array-safety-report.json',
        JSON.stringify(report, null, 2)
      );
      
      console.log('\n✅ Audit report saved to array-safety-report.json');
      console.log('\nTo apply fixes automatically, run:');
      console.log('  npm run fix:arrays');
    } else {
      console.log('\n✅ No array safety issues found!');
    }
    
  } catch (error) {
    console.error('❌ Error during audit:', error);
    process.exit(1);
  }
}

// Run the audit
main();