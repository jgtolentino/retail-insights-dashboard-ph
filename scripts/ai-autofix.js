#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs/promises");
const path = require("path");

async function applyAutoFixes() {
  console.log("🔧 Starting AI auto-fix process...");
  
  try {
    // Read diagnostic report
    const report = JSON.parse(await fs.readFile('ai-diagnostic-report.json', 'utf8'));
    
    if (report.autoFixable.length === 0) {
      console.log("✅ No auto-fixable issues found");
      return;
    }
    
    console.log(`🛠️ Applying fixes to ${report.autoFixable.length} files...`);
    let fixesApplied = 0;
    
    // Process each issue
    for (const issue of report.issues) {
      if (!report.autoFixable.includes(issue.file)) continue;
      
      try {
        switch (issue.type) {
          case 'react-error-185':
            await fixReactDestructuring(issue.file);
            fixesApplied++;
            break;
            
          case 'missing-env-var':
            await fixMissingEnvVar(issue.message);
            fixesApplied++;
            break;
            
          case 'supabase-query':
            await fixSupabaseQuery(issue.file);
            fixesApplied++;
            break;
        }
      } catch (error) {
        console.error(`❌ Failed to fix ${issue.file}: ${error.message}`);
      }
    }
    
    console.log(`✅ Applied ${fixesApplied} fixes`);
    
    // Update report with fix status
    report.fixesApplied = fixesApplied;
    report.fixTimestamp = new Date().toISOString();
    await fs.writeFile('ai-diagnostic-report.json', JSON.stringify(report, null, 2));
    
    // Set environment variable for GitHub Actions
    if (fixesApplied > 0) {
      process.env.FIXES_APPLIED = "true";
    }
    
  } catch (error) {
    console.error('💥 Auto-fix failed:', error.message);
    process.exit(1);
  }
}

// Fix React destructuring issues
async function fixReactDestructuring(filePath) {
  console.log(`  📝 Fixing React destructuring in ${filePath}`);
  
  let content = await fs.readFile(filePath, 'utf8');
  
  // Common patterns that cause Error #185
  const patterns = [
    // Fix: const [data] = useQuery() -> const { data } = useQuery()
    {
      pattern: /const\s*\[\s*(\w+)\s*\]\s*=\s*(use\w+Query\([^)]*\))/g,
      replacement: 'const { $1 } = $2'
    },
    // Fix: const [products, isLoading] = useProducts() -> const { products, isLoading } = useProducts()
    {
      pattern: /const\s*\[\s*(\w+)\s*,\s*(\w+)\s*\]\s*=\s*(use\w+\([^)]*\))/g,
      replacement: 'const { $1, $2 } = $3'
    }
  ];
  
  let modified = false;
  for (const { pattern, replacement } of patterns) {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  }
  
  if (modified) {
    await fs.writeFile(filePath, content);
    console.log(`    ✅ Fixed destructuring patterns`);
  }
}

// Fix missing environment variables
async function fixMissingEnvVar(message) {
  console.log(`  📝 Fixing environment variables`);
  
  const envVar = message.match(/Missing required environment variable: (\w+)/)?.[1];
  if (!envVar) return;
  
  let envExample = await fs.readFile('.env.example', 'utf8').catch(() => '');
  
  // Add missing env vars with placeholders
  const envVars = {
    'VITE_SUPABASE_URL': 'VITE_SUPABASE_URL=https://your-project.supabase.co',
    'VITE_SUPABASE_ANON_KEY': 'VITE_SUPABASE_ANON_KEY=your-anon-key-here'
  };
  
  if (envVars[envVar] && !envExample.includes(envVar)) {
    envExample += `\n${envVars[envVar]}`;
    await fs.writeFile('.env.example', envExample);
    console.log(`    ✅ Added ${envVar} to .env.example`);
  }
}

// Fix Supabase query issues
async function fixSupabaseQuery(filePath) {
  console.log(`  📝 Fixing Supabase queries in ${filePath}`);
  
  let content = await fs.readFile(filePath, 'utf8');
  
  // Fix REST-style params to SDK methods
  const fixes = [
    {
      pattern: /\.select\([^)]+\)\?category=neq\.null/g,
      replacement: ".select('*').neq('category', null)"
    },
    {
      pattern: /\.select\([^)]+\)\?region=neq\.null/g,
      replacement: ".select('*').neq('region', null)"
    },
    {
      pattern: /\.from\('(\w+)'\)\.select\(\)/g,
      replacement: ".from('$1').select('*')"
    }
  ];
  
  let modified = false;
  for (const { pattern, replacement } of fixes) {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  }
  
  if (modified) {
    await fs.writeFile(filePath, content);
    console.log(`    ✅ Fixed Supabase query syntax`);
  }
}

// Run auto-fixes
applyAutoFixes().catch(console.error);