#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Applying Safety Fixes...\n');

// Read the safety fixes
let fixes;
try {
  fixes = JSON.parse(fs.readFileSync('safety-fixes.json', 'utf8'));
} catch (error) {
  console.error('❌ Could not read safety-fixes.json. Run audit-safety.js first.');
  process.exit(1);
}

console.log(`📊 Found ${fixes.length} auto-fixable issues\n`);

// Group fixes by file
const fixesByFile = {};
fixes.forEach(fix => {
  if (!fixesByFile[fix.file]) {
    fixesByFile[fix.file] = [];
  }
  fixesByFile[fix.file].push(fix);
});

// Apply fixes to each file
let totalFixed = 0;
Object.entries(fixesByFile).forEach(([filePath, fileFixes]) => {
  console.log(`📝 Fixing ${filePath} (${fileFixes.length} issues)`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let lines = content.split('\n');
  
  // Sort fixes by line number in reverse order to avoid offset issues
  fileFixes.sort((a, b) => b.line - a.line);
  
  fileFixes.forEach(fix => {
    const lineIndex = fix.line - 1;
    const originalLine = lines[lineIndex];
    
    if (originalLine.trim() === fix.code) {
      // Replace the specific match in the line
      lines[lineIndex] = originalLine.replace(fix.match, fix.fix);
      totalFixed++;
      console.log(`   ✅ Line ${fix.line}: ${fix.match} → ${fix.fix}`);
    } else {
      console.log(`   ⚠️  Line ${fix.line}: Content mismatch, skipping`);
    }
  });
  
  // Write the fixed content back
  fs.writeFileSync(filePath, lines.join('\n'));
});

console.log(`\n✅ Applied ${totalFixed} fixes`);

// Create a comprehensive fix for remaining issues
console.log('\n📝 Creating manual fix guide...');

const manualFixes = `
# Manual Safety Fixes Required

The following patterns need manual review and fixing:

## 1. Add null checks to array methods

Replace:
\`\`\`typescript
someArray.map(item => ...)
someArray.forEach(item => ...)
someArray.filter(item => ...)
\`\`\`

With:
\`\`\`typescript
(someArray || []).map(item => ...)
(someArray || []).forEach(item => ...)
(someArray || []).filter(item => ...)
\`\`\`

Or better, use the safety utilities:
\`\`\`typescript
import { safe } from '@/utils/safety';

safe.map(someArray, item => ...)
safe.forEach(someArray, item => ...)
safe.filter(someArray, item => ...)
\`\`\`

## 2. Add optional chaining

Replace:
\`\`\`typescript
if (filters.brands.length > 0)
\`\`\`

With:
\`\`\`typescript
if (filters.brands?.length > 0)
\`\`\`

## 3. Use safety utilities for all filter operations

Replace direct array operations in filter contexts with safety utilities:
\`\`\`typescript
import { safe, safeArray } from '@/utils/safety';

// Instead of
const brandsArray = Array.from(filters.selectedBrands);

// Use
const brandsArray = safeArray(filters.selectedBrands);
\`\`\`

## 4. Initialize all arrays in state

Ensure all array properties are initialized:
\`\`\`typescript
const [state, setState] = useState({
  items: [],        // Never undefined
  selected: [],     // Never undefined
  filters: {
    brands: [],     // Never undefined
    categories: [], // Never undefined
  }
});
\`\`\`
`;

fs.writeFileSync('MANUAL_FIXES_GUIDE.md', manualFixes);
console.log('📄 Manual fix guide saved to MANUAL_FIXES_GUIDE.md');

// Update package.json with safety scripts
console.log('\n📦 Adding safety scripts to package.json...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
packageJson.scripts = {
  ...packageJson.scripts,
  'audit:safety': 'node scripts/audit-safety.js',
  'fix:safety': 'node scripts/apply-safety-fixes.js',
  'test:safety': 'npm run audit:safety -- --quiet'
};
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log('✅ Added safety scripts to package.json');

console.log('\n🎯 Next steps:');
console.log('1. Review the changes: git diff');
console.log('2. Apply remaining manual fixes from MANUAL_FIXES_GUIDE.md');
console.log('3. Run: npm run audit:safety');
console.log('4. Test: npm run build');
console.log('5. Commit: git add . && git commit -m "fix: comprehensive safety fixes"');