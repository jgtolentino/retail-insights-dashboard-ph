#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs/promises");
const path = require("path");
const { execSync } = require("child_process");

// For now, using a simplified diagnostics approach
// In production, replace with OpenAI API calls
async function runDiagnostics() {
  console.log("🔍 Running AI-powered diagnostics...");
  
  const issues = [];
  const autoFixable = [];
  
  try {
    // 1. Check for React Error #185 pattern
    console.log("📋 Checking for React destructuring issues...");
    const files = execSync("find src -name '*.tsx' -o -name '*.ts' | head -20", { encoding: 'utf8' }).trim().split('\n');
    
    for (const file of files) {
      if (!file) continue;
      try {
        const content = await fs.readFile(file, 'utf8');
        // Look for hook destructuring that might cause Error #185
        const destructurePattern = /const\s*\[\s*\w+.*?\]\s*=\s*use[A-Z]\w+\(/g;
        if (destructurePattern.test(content)) {
          issues.push({
            file,
            type: 'react-error-185',
            severity: 'critical',
            message: 'Potential React Error #185: Hook returns object but using array destructuring'
          });
          autoFixable.push(file);
        }
      } catch (e) {
        // File read error, skip
      }
    }
    
    // 2. Check for environment variables
    console.log("🔐 Checking environment variables...");
    const envFile = await fs.readFile('.env.example', 'utf8').catch(() => '');
    const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
    
    for (const envVar of requiredEnvVars) {
      if (!envFile.includes(envVar)) {
        issues.push({
          file: '.env.example',
          type: 'missing-env-var',
          severity: 'critical',
          message: `Missing required environment variable: ${envVar}`
        });
        autoFixable.push('.env.example');
      }
    }
    
    // 3. Check for Supabase query issues
    console.log("🔍 Checking Supabase queries...");
    const serviceFiles = execSync("find src/services -name '*.ts' | head -10", { encoding: 'utf8' }).trim().split('\n');
    
    for (const file of serviceFiles) {
      if (!file) continue;
      try {
        const content = await fs.readFile(file, 'utf8');
        // Look for problematic query patterns
        if (content.includes('?category=neq.null') || content.includes('?region=neq.null')) {
          issues.push({
            file,
            type: 'supabase-query',
            severity: 'high',
            message: 'Invalid Supabase query syntax - using REST params instead of SDK methods'
          });
          autoFixable.push(file);
        }
      } catch (e) {
        // Skip
      }
    }
    
    // 4. Check QA results if available
    try {
      const qaResults = await fs.readFile('qa-results.log', 'utf8');
      if (qaResults.includes('CRITICAL TESTS FAILED')) {
        issues.push({
          file: 'qa-results.log',
          type: 'qa-failure',
          severity: 'critical',
          message: 'QA tests report critical failures'
        });
      }
    } catch (e) {
      // No QA results yet
    }
    
    // 5. Generate report
    const report = {
      timestamp: new Date().toISOString(),
      totalIssues: issues.length,
      criticalCount: issues.filter(i => i.severity === 'critical').length,
      autoFixableCount: autoFixable.length,
      issues,
      autoFixable: [...new Set(autoFixable)],
      productionReadinessScore: issues.length === 0 ? 100 : Math.max(0, 100 - (issues.length * 10))
    };
    
    // Write report
    await fs.writeFile('ai-diagnostic-report.json', JSON.stringify(report, null, 2));
    console.log(`📊 Diagnostic complete: ${issues.length} issues found, ${autoFixable.length} auto-fixable`);
    console.log(`📈 Production readiness score: ${report.productionReadinessScore}%`);
    
    // Exit with error if critical issues found
    if (report.criticalCount > 0) {
      console.error('❌ Critical issues detected - failing build');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Diagnostic failed:', error.message);
    process.exit(1);
  }
}

// Run diagnostics
runDiagnostics().catch(console.error);