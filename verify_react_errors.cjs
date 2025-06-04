const { chromium } = require('playwright');

async function checkReactErrors() {
  console.log('🔍 HEADLESS BROWSER VERIFICATION');
  console.log('===============================');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const errors = [];
  const warnings = [];
  
  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log('❌ CONSOLE ERROR:', msg.text());
    } else if (msg.type() === 'warning') {
      warnings.push(msg.text());
    }
  });
  
  // Capture page errors
  page.on('pageerror', error => {
    errors.push(error.message);
    console.log('❌ PAGE ERROR:', error.message);
  });
  
  try {
    console.log('📱 Loading production URL...');
    await page.goto('https://retail-insights-dashboard-fv98htxrx-jakes-projects-e9f46c30.vercel.app', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for any React errors to appear
    await page.waitForTimeout(5000);
    
    console.log('\n🎯 VERIFICATION RESULTS:');
    console.log('========================');
    
    if (errors.length === 0) {
      console.log('✅ NO REACT ERRORS FOUND!');
      console.log('✅ Dashboard loads cleanly');
    } else {
      console.log(`❌ Found ${errors.length} errors:`);
      errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
    }
    
    if (warnings.length > 0) {
      console.log(`⚠️  Found ${warnings.length} warnings (non-critical)`);
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'dashboard-screenshot.png', fullPage: true });
    console.log('📸 Screenshot saved as dashboard-screenshot.png');
    
  } catch (error) {
    console.log('❌ Navigation error:', error.message);
  } finally {
    await browser.close();
  }
}

checkReactErrors().catch(console.error);