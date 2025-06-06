#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 Running pre-deployment checks...\n');

let hasErrors = false;

// 1. Check for TypeScript errors
console.log('📝 Checking TypeScript...');
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log('✅ TypeScript check passed\n');
} catch (error) {
  console.error('❌ TypeScript errors found! Fix before deploying.');
  hasErrors = true;
}

// 2. Check for common error patterns
console.log('🔍 Checking for unsafe code patterns...');

const checkFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for unsafe toFixed calls
  if (content.match(/[^|]\s*\.toFixed\(/g) && !content.match(/\|\|\s*0\)\.toFixed\(/g)) {
    console.error(`❌ Potentially unsafe .toFixed() calls in ${filePath}`);
    hasErrors = true;
  }
  
  // Check for finalQuery references
  if (content.match(/\bfinalQuery\b/g)) {
    console.error(`❌ Undefined 'finalQuery' references in ${filePath}`);
    hasErrors = true;
  }
};

// Check critical files
const filesToCheck = [
  'src/pages/Sprint4Dashboard.tsx',
  'src/services/behavioral-dashboard.ts',
  'src/components/AIRecommendations.tsx',
  'src/components/charts/RequestBehaviorAnalysis.tsx'
];

filesToCheck.forEach(checkFile);

// 3. Test build
console.log('🔨 Testing production build...');
try {
  execSync('npm run build', { stdio: 'pipe' });
  console.log('✅ Build successful\n');
} catch (error) {
  console.error('❌ Build failed! Fix before deploying.');
  hasErrors = true;
}

// Final result
if (hasErrors) {
  console.error('❌ Pre-deployment checks failed! Please fix the errors above.\n');
  process.exit(1);
} else {
  console.log('✅ All pre-deployment checks passed! Ready to deploy. 🚀\n');
}