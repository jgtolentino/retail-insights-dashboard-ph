const { chromium } = require('playwright');

async function checkConsoleErrors() {
  console.log('🚀 Starting headless verification for React Error #185...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const errors = [];
  const warnings = [];
  const logs = [];
  
  // Capture all console messages
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    
    if (type === 'error') {
      errors.push(text);
      console.log(`❌ ERROR: ${text}`);
    } else if (type === 'warning') {
      warnings.push(text);
      console.log(`⚠️  WARNING: ${text}`);
    } else {
      logs.push(text);
    }
  });
  
  // Capture page errors
  page.on('pageerror', error => {
    errors.push(error.message);
    console.log(`💥 PAGE ERROR: ${error.message}`);
  });
  
  try {
    console.log('📡 Loading deployment URL...');
    await page.goto('https://retail-insights-dashboard-ph-jakes-projects-e9f46c30.vercel.app', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('⏳ Waiting for React app to mount...');
    // Wait for the React app to load
    await page.waitForSelector('#root', { timeout: 10000 });
    
    // Wait additional time for any async operations
    await page.waitForTimeout(5000);
    
    console.log('🔍 Checking for filter components...');
    // Look for filter components that might trigger React Error #185
    const filterExists = await page.locator('[data-testid="category-filter"]').count();
    console.log(`📋 Filter components found: ${filterExists}`);
    
    if (filterExists > 0) {
      console.log('🎛️ Testing filter interactions...');
      // Try to interact with filters to trigger any potential infinite loops
      try {
        await page.click('[data-testid="category-filter"]');
        await page.waitForTimeout(2000);
        console.log('✅ Category filter interaction successful');
      } catch (e) {
        console.log('⚠️ Could not interact with category filter (might be loading)');
      }
    }
    
    // Final wait to catch any delayed errors
    await page.waitForTimeout(3000);
    
    console.log('\n📊 VERIFICATION RESULTS:');
    console.log('========================');
    
    // Check specifically for React Error #185 patterns
    const reactError185 = errors.filter(err => 
      err.includes('Maximum update depth') || 
      err.includes('Too many re-renders') ||
      err.includes('React Error #185')
    );
    
    const renderWarnings = warnings.filter(warn =>
      warn.includes('render') || 
      warn.includes('update') ||
      warn.includes('infinite')
    );
    
    if (reactError185.length > 0) {
      console.log('🚨 CRITICAL: React Error #185 STILL PRESENT:');
      reactError185.forEach(err => console.log(`   - ${err}`));
    } else {
      console.log('✅ SUCCESS: No React Error #185 infinite loops detected!');
    }
    
    console.log(`📈 Total errors: ${errors.length}`);
    console.log(`⚠️ Total warnings: ${warnings.length}`);
    
    if (errors.length === 0) {
      console.log('🎉 CLEAN CONSOLE: No JavaScript errors found!');
    } else {
      console.log('\n❌ ERRORS FOUND:');
      errors.slice(0, 5).forEach((err, i) => console.log(`   ${i+1}. ${err}`));
      if (errors.length > 5) console.log(`   ... and ${errors.length - 5} more`);
    }
    
    if (renderWarnings.length > 0) {
      console.log('\n⚠️ RENDER-RELATED WARNINGS:');
      renderWarnings.forEach((warn, i) => console.log(`   ${i+1}. ${warn}`));
    }
    
    // Take a screenshot for evidence
    await page.screenshot({ 
      path: 'deployment-verification.png', 
      fullPage: true 
    });
    console.log('📸 Screenshot saved: deployment-verification.png');
    
    return {
      success: reactError185.length === 0 && errors.length === 0,
      reactError185: reactError185.length,
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      url: page.url()
    };
    
  } catch (error) {
    console.log(`💥 Verification failed: ${error.message}`);
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

// Run the verification
checkConsoleErrors().then(result => {
  console.log('\n🏁 FINAL RESULT:', result.success ? '✅ PASSED' : '❌ FAILED');
  if (result.success) {
    console.log('🚀 React Error #185 fix VERIFIED - deployment is clean!');
  }
  process.exit(result.success ? 0 : 1);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});