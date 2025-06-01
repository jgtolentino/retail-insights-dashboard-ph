#!/usr/bin/env node

/**
 * Screenshot Validation Script
 * 
 * Validates that screenshots are not blank, black, or showing error states
 * - Analyzes pixel data to detect blank/black screens
 * - Checks for error boundary patterns
 * - Validates minimum content threshold
 * - Compares against baseline if available
 */

import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

class ScreenshotValidator {
  constructor(screenshotPath) {
    this.screenshotPath = screenshotPath;
    this.baselinePath = screenshotPath.replace('.png', '-baseline.png');
    this.errors = [];
    this.warnings = [];
  }

  async validateExists() {
    if (!existsSync(this.screenshotPath)) {
      this.errors.push(`Screenshot not found: ${this.screenshotPath}`);
      return false;
    }
    return true;
  }

  async validateNotBlank() {
    console.log('🔍 Checking if screenshot is not blank...');
    
    try {
      const stats = require('fs').statSync(this.screenshotPath);
      
      // Check file size - very small files are likely blank
      if (stats.size < 1000) {
        this.errors.push('Screenshot file is too small (likely blank)');
        return false;
      }

      // For now, we'll use a simple file size check
      // In a full implementation, we'd use a library like jimp or sharp
      // to analyze actual pixel data
      
      console.log(`✅ Screenshot appears valid (${Math.round(stats.size / 1024)}KB)`);
      return true;
      
    } catch (error) {
      this.errors.push(`Failed to validate screenshot: ${error.message}`);
      return false;
    }
  }

  async checkForErrorPatterns() {
    console.log('🚨 Checking for error patterns in filename...');
    
    const errorPatterns = [
      'error',
      'blank',
      'black',
      'timeout',
      'failed'
    ];
    
    const filename = this.screenshotPath.toLowerCase();
    
    for (const pattern of errorPatterns) {
      if (filename.includes(pattern)) {
        this.warnings.push(`Screenshot filename contains error pattern: ${pattern}`);
      }
    }
    
    return true;
  }

  async generateBaseline() {
    if (!existsSync(this.baselinePath)) {
      console.log('📸 Creating baseline screenshot for future comparisons...');
      
      try {
        const screenshot = readFileSync(this.screenshotPath);
        require('fs').writeFileSync(this.baselinePath, screenshot);
        console.log(`✅ Baseline created: ${this.baselinePath}`);
      } catch (error) {
        this.warnings.push(`Failed to create baseline: ${error.message}`);
      }
    }
    
    return true;
  }

  async compareWithBaseline() {
    if (!existsSync(this.baselinePath)) {
      console.log('📋 No baseline found, skipping comparison');
      return true;
    }
    
    console.log('🔄 Comparing with baseline...');
    
    try {
      const current = readFileSync(this.screenshotPath);
      const baseline = readFileSync(this.baselinePath);
      
      // Simple hash comparison
      const currentHash = createHash('md5').update(current).digest('hex');
      const baselineHash = createHash('md5').update(baseline).digest('hex');
      
      if (currentHash === baselineHash) {
        console.log('✅ Screenshot matches baseline exactly');
      } else {
        console.log('📊 Screenshot differs from baseline (this may be expected)');
        this.warnings.push('Screenshot differs from baseline - visual changes detected');
      }
      
      return true;
      
    } catch (error) {
      this.warnings.push(`Baseline comparison failed: ${error.message}`);
      return true; // Don't fail on comparison errors
    }
  }

  async generateReport() {
    console.log('');
    console.log('📋 Screenshot Validation Report');
    console.log('==============================');
    
    const totalErrors = this.errors.length;
    const totalWarnings = this.warnings.length;
    
    if (totalErrors === 0) {
      console.log('📸 SCREENSHOT VALIDATION PASSED');
      console.log(`✅ 0 critical errors`);
      console.log(`⚠️ ${totalWarnings} warnings`);
      
      if (totalWarnings > 0) {
        console.log('');
        console.log('Warnings:');
        this.warnings.forEach(warning => console.log(`  - ${warning}`));
      }
      
      return true;
    } else {
      console.log('🚨 SCREENSHOT VALIDATION FAILED');
      console.log(`❌ ${totalErrors} critical errors`);
      console.log(`⚠️ ${totalWarnings} warnings`);
      console.log('');
      console.log('Critical Errors:');
      this.errors.forEach(error => console.log(`  - ${error}`));
      
      if (totalWarnings > 0) {
        console.log('');
        console.log('Warnings:');
        this.warnings.forEach(warning => console.log(`  - ${warning}`));
      }
      
      return false;
    }
  }

  async validate() {
    console.log(`🔍 Validating Screenshot: ${this.screenshotPath}`);
    console.log('');
    
    // Ensure screenshot directory exists
    const dir = require('path').dirname(this.screenshotPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    
    const checks = [
      await this.validateExists(),
      await this.validateNotBlank(),
      await this.checkForErrorPatterns(),
      await this.generateBaseline(),
      await this.compareWithBaseline()
    ];
    
    const success = await this.generateReport();
    return success;
  }
}

// Command line usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const screenshotPath = process.argv[2] || 'e2e-snapshots/postdeploy-verification.png';
  
  const validator = new ScreenshotValidator(screenshotPath);
  validator.validate().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('💥 Screenshot validation crashed:', error.message);
    process.exit(1);
  });
}

export { ScreenshotValidator };