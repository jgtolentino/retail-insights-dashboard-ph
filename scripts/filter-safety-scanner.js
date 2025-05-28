#!/usr/bin/env node
/**
 * Filter Safety Scanner for Retail Insights Dashboard
 * Scans for unsafe filter patterns and generates fixes
 */

const fs = require('fs');
const path = require('path');

// Scan source directory
const scanDirectory = './src';
const outputFile = './FILTER_SAFETY_SCAN_RESULTS.md';

// Unsafe patterns to detect
const UNSAFE_PATTERNS = [
  {
    name: 'Unsafe .length access',
    pattern: /(\w+)\.length(?!\s*\?)/g,
    severity: 'HIGH',
    fix: '$1?.length ?? 0'
  },
  {
    name: 'Unsafe .map calls',
    pattern: /(\w+)\.map\(/g,
    severity: 'HIGH', 
    fix: '($1 ?? []).map('
  },
  {
    name: 'Unsafe .filter calls',
    pattern: /(\w+)\.filter\(/g,
    severity: 'MEDIUM',
    fix: '($1 ?? []).filter('
  },
  {
    name: 'Array.from workarounds',
    pattern: /Array\.from\((\w+)\s*\|\|\s*\[\]\)/g,
    severity: 'MEDIUM',
    fix: '$1 ?? []'
  },
  {
    name: 'Console.error usage',
    pattern: /console\.error\(/g,
    severity: 'LOW',
    fix: 'Use proper error handling'
  },
  {
    name: 'Direct array indexing',
    pattern: /(\w+)\[(\d+)\](?!\s*\?)/g,
    severity: 'MEDIUM',
    fix: '$1?.[$2]'
  },
  {
    name: 'Potential SQL injection',
    pattern: /(?:sql|query|from|supabase\.from).*\$\{[^}]*\}.*(?:WHERE|AND|OR|SELECT|INSERT|UPDATE|DELETE)/gi,
    severity: 'CRITICAL',
    fix: 'Use parameterized queries'
  }
];

function scanFiles() {
  const results = [];
  
  function scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        UNSAFE_PATTERNS.forEach(pattern => {
          const matches = line.match(pattern.pattern);
          if (matches) {
            // Skip if it already has safety checks
            if (pattern.name.includes('length') && line.includes('?.')) return;
            if (pattern.name.includes('map') && (line.includes('??') || line.includes('?.'))) return;
            
            results.push({
              file: filePath,
              line: index + 1,
              pattern: pattern.name,
              severity: pattern.severity,
              content: line.trim(),
              fix: pattern.fix,
              matches
            });
          }
        });
      });
    } catch (error) {
      console.error(`Error reading ${filePath}:`, error.message);
    }
  }
  
  function walkDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        walkDirectory(fullPath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        scanFile(fullPath);
      }
    });
  }
  
  walkDirectory(scanDirectory);
  return results;
}

function generateReport(results) {
  const report = [];
  
  report.push('# Filter Safety Scan Results');
  report.push('');
  report.push(`**Scan Date**: ${new Date().toISOString()}`);
  report.push(`**Files Scanned**: ${new Set(results.map(r => r.file)).size}`);
  report.push(`**Total Issues**: ${results.length}`);
  report.push('');
  
  // Group by severity
  const bySeverity = {};
  results.forEach(result => {
    if (!bySeverity[result.severity]) {
      bySeverity[result.severity] = [];
    }
    bySeverity[result.severity].push(result);
  });
  
  ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].forEach(severity => {
    if (bySeverity[severity]) {
      report.push(`## ${severity} Issues (${bySeverity[severity].length})`);
      report.push('');
      
      // Group by pattern
      const byPattern = {};
      bySeverity[severity].forEach(issue => {
        if (!byPattern[issue.pattern]) {
          byPattern[issue.pattern] = [];
        }
        byPattern[issue.pattern].push(issue);
      });
      
      Object.keys(byPattern).forEach(pattern => {
        const issues = byPattern[pattern];
        report.push(`### ${pattern} (${issues.length} instances)`);
        report.push('');
        
        // Show first 5 examples
        issues.slice(0, 5).forEach(issue => {
          report.push(`**${issue.file}:${issue.line}**`);
          report.push('```typescript');
          report.push(issue.content);
          report.push('```');
          report.push(`🔧 **Fix**: ${issue.fix}`);
          report.push('');
        });
        
        if (issues.length > 5) {
          report.push(`*... and ${issues.length - 5} more instances*`);
          report.push('');
        }
      });
    }
  });
  
  // Priority recommendations
  report.push('## Priority Recommendations');
  report.push('');
  
  if (bySeverity.CRITICAL) {
    report.push('🚨 **CRITICAL**: Fix immediately before any deployments');
  }
  if (bySeverity.HIGH) {
    report.push('⚠️ **HIGH**: Fix within current sprint');
  }
  if (bySeverity.MEDIUM) {
    report.push('⚡ **MEDIUM**: Address in next sprint');
  }
  if (bySeverity.LOW) {
    report.push('📝 **LOW**: Technical debt, schedule when convenient');
  }
  
  report.push('');
  report.push('## Auto-Fix Commands');
  report.push('');
  report.push('```bash');
  report.push('# Run this scanner');
  report.push('node scripts/filter-safety-scanner.js');
  report.push('');
  report.push('# Auto-fix safe patterns (review changes!)');
  report.push('sed -i.bak "s/\\.length/?.length ?? 0/g" src/**/*.{ts,tsx}');
  report.push('sed -i.bak "s/\\.map(/?.map(/g" src/**/*.{ts,tsx}');
  report.push('```');
  
  return report.join('\n');
}

// Main execution
function main() {
  console.log('🔍 Scanning for filter safety issues...');
  
  const results = scanFiles();
  const report = generateReport(results);
  
  // Write report
  fs.writeFileSync(outputFile, report);
  
  // Console summary
  const criticalCount = results.filter(r => r.severity === 'CRITICAL').length;
  const highCount = results.filter(r => r.severity === 'HIGH').length;
  
  console.log('\n📊 Scan Complete!');
  console.log(`   Critical: ${criticalCount}`);
  console.log(`   High: ${highCount}`);
  console.log(`   Total: ${results.length}`);
  console.log(`   Report: ${outputFile}`);
  
  if (criticalCount > 0) {
    console.log('\n🚨 CRITICAL issues found - review immediately!');
    process.exit(1);
  }
}

main();