/**
 * Global Teardown for Playwright Tests
 * Runs once after all tests
 */

import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...');
  
  try {
    // Generate test summary report
    await generateTestSummary();
    
    // Cleanup test artifacts if needed
    await cleanupTestArtifacts();
    
    console.log('✅ Global teardown completed successfully');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
  }
}

async function generateTestSummary() {
  console.log('📋 Generating test summary...');
  
  try {
    const resultsPath = 'test-results/results.json';
    
    if (fs.existsSync(resultsPath)) {
      const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
      
      const summary = {
        timestamp: new Date().toISOString(),
        total_tests: results.suites?.reduce((acc: number, suite: any) => 
          acc + (suite.specs?.length || 0), 0) || 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: results.stats?.duration || 0,
        browsers_tested: [],
        performance_metrics: {},
      };
      
      // Write summary
      fs.writeFileSync(
        'test-results/summary.json',
        JSON.stringify(summary, null, 2)
      );
      
      console.log('✅ Test summary generated');
    }
  } catch (error) {
    console.warn('⚠️ Failed to generate test summary:', error);
  }
}

async function cleanupTestArtifacts() {
  console.log('🗑️ Cleaning up test artifacts...');
  
  try {
    // Clean up old screenshots (keep last 10)
    const screenshotsDir = 'test-results/screenshots';
    if (fs.existsSync(screenshotsDir)) {
      const files = fs.readdirSync(screenshotsDir)
        .map(file => ({
          name: file,
          path: path.join(screenshotsDir, file),
          time: fs.statSync(path.join(screenshotsDir, file)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time);
      
      // Keep only the 10 most recent files
      files.slice(10).forEach(file => {
        fs.unlinkSync(file.path);
      });
    }
    
    console.log('✅ Test artifacts cleaned up');
  } catch (error) {
    console.warn('⚠️ Failed to cleanup test artifacts:', error);
  }
}

export default globalTeardown;