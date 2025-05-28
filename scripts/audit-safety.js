#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Running Comprehensive Safety Audit...\n');

const issues = [];
const safetyPatterns = [];

// Patterns to find potential issues
const patterns = [
  {
    name: 'Array.from without null check',
    regex: /Array\.from\(([^)]+)\)/g,
    checkSafety: (match, line) => !line.includes('||') && !line.includes('?') && !match.includes('|| []'),
    fix: (match) => match.replace(/Array\.from\(([^)]+)\)/, 'Array.from($1 || [])')
  },
  {
    name: 'Spread operator on potentially undefined',
    regex: /\[\.\.\.([^]]+)\]/g,
    checkSafety: (match, line) => !line.includes('||') && !line.includes('?') && !match.includes('|| []'),
    fix: (match) => match.replace(/\[\.\.\.([^]]+)\]/, '[...($1 || [])]')
  },
  {
    name: '.map() without safety check',
    regex: /(\w+)\.map\(/g,
    checkSafety: (match, line) => {
      const varName = match.match(/(\w+)\.map/)[1];
      return !line.includes(`${varName} ||`) && !line.includes(`${varName}?`) && 
             !line.includes(`(${varName} || [])`);
    },
    fix: null // These need manual review
  },
  {
    name: '.forEach() without safety check',
    regex: /(\w+)\.forEach\(/g,
    checkSafety: (match, line) => {
      const varName = match.match(/(\w+)\.forEach/)[1];
      return !line.includes(`${varName} ||`) && !line.includes(`${varName}?`) && 
             !line.includes(`(${varName} || [])`);
    },
    fix: null // These need manual review
  },
  {
    name: '.filter() without safety check',
    regex: /(\w+)\.filter\(/g,
    checkSafety: (match, line) => {
      const varName = match.match(/(\w+)\.filter/)[1];
      return !line.includes(`${varName} ||`) && !line.includes(`${varName}?`) && 
             !line.includes(`(${varName} || [])`);
    },
    fix: null // These need manual review
  },
  {
    name: '.includes() without safety check',
    regex: /(\w+)\.includes\(/g,
    checkSafety: (match, line) => {
      const varName = match.match(/(\w+)\.includes/)[1];
      return !line.includes(`${varName} ||`) && !line.includes(`${varName}?`) && 
             !line.includes(`(${varName} || [])`);
    },
    fix: null // These need manual review
  },
  {
    name: '.length without safety check',
    regex: /(\w+)\.length/g,
    checkSafety: (match, line) => {
      const varName = match.match(/(\w+)\.length/)[1];
      return !line.includes(`${varName} ||`) && !line.includes(`${varName}?`) && 
             !line.includes(`(${varName} || [])`);
    },
    fix: null // These need manual review
  },
  {
    name: 'Object spread that might have undefined',
    regex: /\{\.\.\.(\w+)[,}]/g,
    checkSafety: (match, line) => {
      const varName = match.match(/\{\.\.\.(\w+)/)[1];
      return varName.includes('filters') || varName.includes('params');
    },
    fix: null // These need manual review
  }
];

// Function to scan a file
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const fileIssues = [];

  patterns.forEach(({ name, regex, checkSafety, fix }) => {
    let match;
    regex.lastIndex = 0; // Reset regex
    
    while ((match = regex.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const line = lines[lineNumber - 1];
      
      // Skip if it's in a comment
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;
      
      // Check if it needs safety
      if (checkSafety && checkSafety(match[0], line)) {
        fileIssues.push({
          file: path.relative(process.cwd(), filePath),
          line: lineNumber,
          issue: name,
          code: line.trim(),
          match: match[0],
          fix: fix ? fix(match[0]) : null
        });
      }
    }
  });

  return fileIssues;
}

// Find all TypeScript files
console.log('📂 Scanning TypeScript files...\n');
const files = execSync('find src -name "*.ts" -o -name "*.tsx"', { encoding: 'utf8' })
  .split('\n')
  .filter(file => file && !file.includes('node_modules'));

// Scan each file
files.forEach(file => {
  if (file) {
    const fileIssues = scanFile(file);
    issues.push(...fileIssues);
  }
});

// Group issues by type
const issuesByType = {};
issues.forEach(issue => {
  if (!issuesByType[issue.issue]) {
    issuesByType[issue.issue] = [];
  }
  issuesByType[issue.issue].push(issue);
});

// Output report
console.log('📊 Safety Audit Report\n');
console.log(`Total files scanned: ${files.length}`);
console.log(`Total issues found: ${issues.length}\n`);

// Summary by type
console.log('📈 Issues by Type:');
Object.entries(issuesByType).forEach(([type, typeIssues]) => {
  console.log(`   ${type}: ${typeIssues.length}`);
});
console.log('');

// Detailed issues
console.log('📍 Detailed Issues:\n');
Object.entries(issuesByType).forEach(([type, typeIssues]) => {
  console.log(`\n🔸 ${type} (${typeIssues.length} issues)\n`);
  typeIssues.slice(0, 5).forEach(({ file, line, code, fix }) => {
    console.log(`   ${file}:${line}`);
    console.log(`   Code: ${code}`);
    if (fix) {
      console.log(`   Fix:  ${fix}`);
    }
    console.log('');
  });
  if (typeIssues.length > 5) {
    console.log(`   ... and ${typeIssues.length - 5} more\n`);
  }
});

// Generate fix script
const fixableIssues = issues.filter(issue => issue.fix);
if (fixableIssues.length > 0) {
  console.log(`\n🔧 ${fixableIssues.length} issues can be auto-fixed`);
  
  // Save fixes to JSON
  fs.writeFileSync('safety-fixes.json', JSON.stringify(fixableIssues, null, 2));
  console.log('💾 Fixes saved to safety-fixes.json');
}

// Save full report
const report = {
  summary: {
    filesScanned: files.length,
    totalIssues: issues.length,
    issuesByType: Object.entries(issuesByType).map(([type, issues]) => ({
      type,
      count: issues.length
    }))
  },
  issues: issues
};

fs.writeFileSync('safety-report.json', JSON.stringify(report, null, 2));
console.log('📄 Full report saved to safety-report.json');

// Exit with error code if issues found
if (issues.length > 0) {
  console.log('\n❌ Safety audit found issues that need attention');
  process.exit(1);
} else {
  console.log('\n✅ No safety issues found!');
  process.exit(0);
}