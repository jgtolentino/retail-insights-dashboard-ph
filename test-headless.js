import { chromium } from 'playwright';

async function testDashboard() {
  console.log('🚀 Starting headless dashboard test...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Collect console messages
  const consoleMessages = [];
  const errors = [];
  
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    consoleMessages.push({ type, text });
    
    if (type === 'error') {
      errors.push(text);
      console.log(`❌ Console Error: ${text}`);
    } else if (type === 'warning') {
      console.log(`⚠️  Console Warning: ${text}`);
    }
  });
  
  // Handle page errors
  page.on('pageerror', error => {
    errors.push(`Page Error: ${error.message}`);
    console.log(`💥 Page Error: ${error.message}`);
  });
  
  try {
    console.log('📍 Navigating to dashboard...');
    await page.goto('http://localhost:8080/dashboard-preview', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('✅ Page loaded successfully');
    
    // Wait for initial render
    await page.waitForTimeout(3000);
    
    // Check for specific error patterns
    const hasGetSnapshotWarnings = consoleMessages.some(msg => 
      msg.text.includes('getSnapshot') || msg.text.includes('snapshot')
    );
    
    const hasMaxUpdateDepthErrors = consoleMessages.some(msg => 
      msg.text.includes('Maximum update depth') || msg.text.includes('update depth')
    );
    
    const hasInfiniteLoopErrors = consoleMessages.some(msg => 
      msg.text.includes('infinite') || msg.text.includes('loop')
    );
    
    // Check if main components are present
    const hasFilterBar = await page.locator('[data-testid="filter-bar"], .filter, [class*="filter"]').count() > 0;
    const hasCharts = await page.locator('svg, canvas, [class*="chart"]').count() > 0;
    
    // Try interacting with filters (if present)
    console.log('🔄 Testing filter interactions...');
    try {
      const filterElements = await page.locator('select, input[type="text"], button').all();
      if (filterElements.length > 0) {
        console.log(`📊 Found ${filterElements.length} interactive elements`);
        // Click first button if available
        const buttons = await page.locator('button').all();
        if (buttons.length > 0) {
          await buttons[0].click();
          await page.waitForTimeout(1000);
        }
      }
    } catch (interactionError) {
      console.log(`⚠️  Filter interaction test failed: ${interactionError.message}`);
    }
    
    // Final results
    console.log('\n📋 TEST RESULTS:');
    console.log('================');
    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Console errors: ${errors.length}`);
    console.log(`getSnapshot warnings: ${hasGetSnapshotWarnings ? '❌ FOUND' : '✅ NONE'}`);
    console.log(`Maximum update depth errors: ${hasMaxUpdateDepthErrors ? '❌ FOUND' : '✅ NONE'}`);
    console.log(`Infinite loop errors: ${hasInfiniteLoopErrors ? '❌ FOUND' : '✅ NONE'}`);
    console.log(`Filter bar present: ${hasFilterBar ? '✅ YES' : '❌ NO'}`);
    console.log(`Charts/visualizations present: ${hasCharts ? '✅ YES' : '❌ NO'}`);
    
    if (errors.length === 0) {
      console.log('\n🎉 SUCCESS: No console errors detected!');
    } else {
      console.log('\n❌ ISSUES FOUND:');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    // Return test results
    return {
      success: errors.length === 0,
      totalMessages: consoleMessages.length,
      errorCount: errors.length,
      errors,
      hasGetSnapshotWarnings,
      hasMaxUpdateDepthErrors,
      hasInfiniteLoopErrors,
      hasFilterBar,
      hasCharts,
      consoleMessages: consoleMessages.slice(0, 10) // First 10 messages for review
    };
    
  } catch (error) {
    console.log(`💥 Test failed: ${error.message}`);
    return {
      success: false,
      error: error.message,
      errorCount: 1,
      errors: [error.message]
    };
  } finally {
    await browser.close();
  }
}

// Run the test
testDashboard()
  .then(results => {
    console.log('\n📊 Final Results:', JSON.stringify(results, null, 2));
    process.exit(results.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });