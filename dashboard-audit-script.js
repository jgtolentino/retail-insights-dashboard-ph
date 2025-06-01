// ============================================
// RETAIL INSIGHTS DASHBOARD - COMPLETE AUDIT
// ============================================

console.clear();
console.log('%c🔍 RETAIL INSIGHTS DASHBOARD AUDIT', 'color: #6B46C1; font-size: 20px; font-weight: bold');
console.log('URL:', window.location.href);
console.log('Timestamp:', new Date().toLocaleString());
console.log('='.repeat(60));

// Audit Results Storage
const auditResults = {
  timestamp: new Date().toISOString(),
  url: window.location.href,
  passed: 0,
  failed: 0,
  warnings: 0,
  details: {}
};

// Helper Functions
function logSuccess(message) {
  console.log(`✅ ${message}`);
  auditResults.passed++;
}

function logError(message, details) {
  console.error(`❌ ${message}`, details || '');
  auditResults.failed++;
}

function logWarning(message) {
  console.warn(`⚠️ ${message}`);
  auditResults.warnings++;
}

function logSection(title) {
  console.log(`\n${'='.repeat(40)}\n📊 ${title}\n${'='.repeat(40)}`);
}

// Wait helper
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================
// 1. PAGE LOAD & INITIAL RENDER AUDIT
// ============================================
async function auditPageLoad() {
  logSection('PAGE LOAD & INITIAL RENDER');
  
  // Check if page loaded
  if (document.readyState === 'complete') {
    logSuccess('Page fully loaded');
  } else {
    logWarning('Page still loading');
  }
  
  // Check for React root
  const reactRoot = document.getElementById('root') || document.querySelector('#__next');
  if (reactRoot && reactRoot.children.length > 0) {
    logSuccess('React app mounted successfully');
  } else {
    logError('React app not mounted properly');
  }
  
  // Check for loading indicators
  const loadingElements = document.querySelectorAll('.loading, .skeleton, [class*="loading"], [class*="skeleton"]');
  if (loadingElements.length === 0) {
    logSuccess('No stuck loading states found');
  } else {
    logWarning(`Found ${loadingElements.length} loading elements still visible`);
  }
  
  // Check for error messages
  const errorElements = document.querySelectorAll('.error, [class*="error"], [role="alert"]');
  const visibleErrors = Array.from(errorElements).filter(el => el.offsetParent !== null);
  if (visibleErrors.length === 0) {
    logSuccess('No error messages displayed');
  } else {
    logError(`Found ${visibleErrors.length} error messages`, visibleErrors);
  }
}

// ============================================
// 2. KPI CARDS AUDIT
// ============================================
async function auditKPICards() {
  logSection('KPI CARDS VALIDATION');
  
  // Find KPI cards - try multiple selectors
  const kpiSelectors = [
    '.card', 
    '[class*="card"]', 
    '[class*="kpi"]',
    '[class*="metric"]',
    'div[class*="stat"]'
  ];
  
  let kpiCards = [];
  for (const selector of kpiSelectors) {
    const cards = document.querySelectorAll(selector);
    if (cards.length > 0) {
      kpiCards = cards;
      break;
    }
  }
  
  if (kpiCards.length === 0) {
    logError('No KPI cards found on page');
    return;
  }
  
  logSuccess(`Found ${kpiCards.length} KPI cards`);
  
  // Expected KPIs based on screenshot
  const expectedKPIs = {
    'Total Revenue': /₱[\d,]+\.?\d*/,
    'Total Transactions': /[\d,]+/,
    'Average Transaction': /₱\d+/,
    'Top Brand': /.+/,
    'Top Bundle': /.+/
  };
  
  // Check each KPI
  let foundKPIs = 0;
  kpiCards.forEach((card, index) => {
    const text = card.textContent || '';
    const title = card.querySelector('h3, h4, .title, [class*="title"]')?.textContent || '';
    const value = card.querySelector('.value, [class*="value"], .text-2xl, .text-3xl, [class*="font-bold"]')?.textContent || '';
    
    console.log(`  Card ${index + 1}: ${title || 'No title'} = ${value || text.slice(0, 50)}`);
    
    // Check if this matches any expected KPI
    for (const [kpiName, pattern] of Object.entries(expectedKPIs)) {
      if (text.includes(kpiName) || title.includes(kpiName)) {
        foundKPIs++;
        if (pattern.test(value || text)) {
          logSuccess(`${kpiName} format is correct`);
        } else {
          logWarning(`${kpiName} format might be incorrect: ${value || text}`);
        }
        break;
      }
    }
  });
  
  if (foundKPIs < 3) {
    logWarning(`Only found ${foundKPIs} of 5 expected KPIs`);
  }
}

// ============================================
// 3. TIME FILTER AUDIT
// ============================================
async function auditTimeFilters() {
  logSection('TIME FILTER FUNCTIONALITY');
  
  // Try to find buttons with text content
  const allButtons = Array.from(document.querySelectorAll('button'));
  const timeButtons = allButtons.filter(btn => {
    const text = btn.textContent || '';
    return ['All Time', 'Today', '7 Days', '30 Days', '90 Days', 'Custom Range'].some(filter => text.includes(filter));
  });
  
  if (timeButtons.length === 0) {
    logError('No time filter buttons found');
    return;
  }
  
  logSuccess(`Found ${timeButtons.length} time filter buttons`);
  
  // Check which one is active
  const activeButton = timeButtons.find(btn => 
    btn.classList.contains('active') || 
    btn.classList.contains('selected') ||
    btn.getAttribute('aria-selected') === 'true' ||
    btn.getAttribute('data-state') === 'active'
  );
  
  if (activeButton) {
    logSuccess(`Active filter: ${activeButton.textContent}`);
  } else {
    logWarning('Could not determine active time filter');
  }
  
  // Test clicking a filter
  const testButton = timeButtons.find(btn => btn.textContent.includes('7 Days'));
  if (testButton) {
    console.log('  Testing 7 Days filter click...');
    const initialRevenue = document.querySelector('[class*="revenue"], [class*="total"]')?.textContent;
    testButton.click();
    
    await wait(2000); // Wait for data update
    
    const newRevenue = document.querySelector('[class*="revenue"], [class*="total"]')?.textContent;
    if (initialRevenue !== newRevenue) {
      logSuccess('Data updated after filter change');
    } else {
      logWarning('Data might not have updated after filter change');
    }
  }
}

// ============================================
// 4. CHART/VISUALIZATION AUDIT
// ============================================
async function auditVisualizations() {
  logSection('CHARTS & VISUALIZATIONS');
  
  // Check for chart containers
  const chartSelectors = [
    'canvas',
    'svg:not([class*="icon"])',
    '[class*="chart"]',
    '[class*="graph"]',
    '.recharts-wrapper',
    '[role="img"]'
  ];
  
  let chartsFound = 0;
  for (const selector of chartSelectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      chartsFound += elements.length;
      logSuccess(`Found ${elements.length} ${selector} elements`);
    }
  }
  
  if (chartsFound === 0) {
    logError('No chart visualizations found');
  }
  
  // Check for donut/pie chart specifically
  const donutChart = document.querySelector('[class*="donut"], [class*="pie"], path[d*="A"]');
  if (donutChart) {
    logSuccess('Donut/Pie chart found');
    
    // Check for chart legend
    const legend = document.querySelector('[class*="legend"], .legend');
    if (legend) {
      const legendItems = legend.querySelectorAll('li, div[class*="item"]');
      logSuccess(`Chart legend has ${legendItems.length} items`);
    }
  }
}

// ============================================
// 5. NAVIGATION AUDIT
// ============================================
async function auditNavigation() {
  logSection('NAVIGATION & TABS');
  
  // Expected tabs based on screenshot
  const expectedTabs = [
    'Overview',
    'Advanced Analytics',
    'Trends Explorer',
    'Product Insights',
    'Customer Insights',
    'Basket Behavior',
    'AI Recs'
  ];
  
  const foundTabs = [];
  const allLinks = document.querySelectorAll('a, button, [role="tab"]');
  
  allLinks.forEach(link => {
    const text = link.textContent || '';
    expectedTabs.forEach(tab => {
      if (text.includes(tab)) {
        foundTabs.push(tab);
      }
    });
  });
  
  const uniqueTabs = [...new Set(foundTabs)];
  logSuccess(`Found ${uniqueTabs.length} of ${expectedTabs.length} expected navigation tabs`);
  
  if (uniqueTabs.length < expectedTabs.length) {
    const missingTabs = expectedTabs.filter(tab => !uniqueTabs.includes(tab));
    logWarning(`Missing tabs: ${missingTabs.join(', ')}`);
  }
}

// ============================================
// 6. DATA LOADING AUDIT
// ============================================
async function auditDataLoading() {
  logSection('DATA LOADING & API CALLS');
  
  // Check Network tab for API calls
  const performance = window.performance.getEntriesByType('resource');
  const apiCalls = performance.filter(entry => 
    entry.name.includes('supabase') || 
    entry.name.includes('api') ||
    entry.name.includes('graphql')
  );
  
  console.log(`  Total API calls found: ${apiCalls.length}`);
  
  // Check for failed requests
  const failedCalls = apiCalls.filter(call => call.responseStatus >= 400);
  if (failedCalls.length > 0) {
    logError(`${failedCalls.length} failed API calls detected`, failedCalls);
  } else if (apiCalls.length > 0) {
    logSuccess('All API calls successful');
  }
  
  // Check for slow API calls
  const slowCalls = apiCalls.filter(call => call.duration > 1000);
  if (slowCalls.length > 0) {
    logWarning(`${slowCalls.length} slow API calls (>1s)`);
    slowCalls.forEach(call => {
      console.log(`    - ${call.name.split('/').pop()}: ${Math.round(call.duration)}ms`);
    });
  }
}

// ============================================
// 7. RESPONSIVE DESIGN AUDIT
// ============================================
async function auditResponsiveDesign() {
  logSection('RESPONSIVE DESIGN CHECK');
  
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  console.log(`  Viewport: ${viewportWidth}x${viewportHeight}`);
  
  // Check for horizontal scroll
  if (document.documentElement.scrollWidth > viewportWidth) {
    logError('Horizontal scroll detected - layout overflow');
  } else {
    logSuccess('No horizontal scroll - layout fits viewport');
  }
  
  // Check for mobile meta tag
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    logSuccess('Viewport meta tag present');
  } else {
    logWarning('No viewport meta tag found');
  }
  
  // Check if elements are responsive
  const fixedWidthElements = Array.from(document.querySelectorAll('*')).filter(el => {
    const style = window.getComputedStyle(el);
    return style.width.includes('px') && parseInt(style.width) > viewportWidth;
  });
  
  if (fixedWidthElements.length > 0) {
    logWarning(`${fixedWidthElements.length} elements with fixed width larger than viewport`);
  }
}

// ============================================
// 8. PERFORMANCE METRICS
// ============================================
function auditPerformance() {
  logSection('PERFORMANCE METRICS');
  
  // Page load timing
  const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
  console.log(`  Page Load Time: ${loadTime}ms`);
  
  if (loadTime < 2000) {
    logSuccess('Page loads in under 2 seconds');
  } else if (loadTime < 3000) {
    logWarning(`Page load time is ${loadTime}ms (target: <2000ms)`);
  } else {
    logError(`Page load time is too slow: ${loadTime}ms`);
  }
  
  // DOM metrics
  console.log(`  DOM Nodes: ${document.getElementsByTagName('*').length}`);
  console.log(`  Images: ${document.images.length}`);
  console.log(`  Scripts: ${document.scripts.length}`);
  console.log(`  Stylesheets: ${document.styleSheets.length}`);
  
  // Memory usage (if available)
  if (performance.memory) {
    const usedMB = (performance.memory.usedJSHeapSize / 1048576).toFixed(2);
    const totalMB = (performance.memory.totalJSHeapSize / 1048576).toFixed(2);
    console.log(`  Memory Usage: ${usedMB}MB / ${totalMB}MB`);
  }
}

// ============================================
// 9. ACCESSIBILITY AUDIT
// ============================================
async function auditAccessibility() {
  logSection('ACCESSIBILITY CHECK');
  
  // Check for alt text on images
  const images = document.querySelectorAll('img');
  const imagesWithoutAlt = Array.from(images).filter(img => !img.alt);
  if (imagesWithoutAlt.length > 0) {
    logWarning(`${imagesWithoutAlt.length} images without alt text`);
  } else if (images.length > 0) {
    logSuccess('All images have alt text');
  }
  
  // Check for button labels
  const buttons = document.querySelectorAll('button');
  const buttonsWithoutText = Array.from(buttons).filter(btn => 
    !btn.textContent.trim() && !btn.getAttribute('aria-label')
  );
  if (buttonsWithoutText.length > 0) {
    logWarning(`${buttonsWithoutText.length} buttons without accessible labels`);
  }
  
  // Check color contrast (basic check)
  const bgColor = window.getComputedStyle(document.body).backgroundColor;
  console.log(`  Background color: ${bgColor}`);
}

// ============================================
// RUN COMPLETE AUDIT
// ============================================
async function runCompleteAudit() {
  console.log('\n🚀 Starting comprehensive audit...\n');
  
  try {
    await auditPageLoad();
    await wait(1000);
    
    await auditKPICards();
    await wait(500);
    
    await auditTimeFilters();
    await wait(500);
    
    await auditVisualizations();
    await wait(500);
    
    await auditNavigation();
    await wait(500);
    
    await auditDataLoading();
    await wait(500);
    
    await auditResponsiveDesign();
    await wait(500);
    
    auditPerformance();
    await wait(500);
    
    await auditAccessibility();
    
    // Final Summary
    console.log('\n' + '='.repeat(60));
    console.log('%c📊 AUDIT SUMMARY', 'color: #6B46C1; font-size: 16px; font-weight: bold');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${auditResults.passed}`);
    console.log(`❌ Failed: ${auditResults.failed}`);
    console.log(`⚠️  Warnings: ${auditResults.warnings}`);
    console.log(`\nTotal Score: ${Math.round((auditResults.passed / (auditResults.passed + auditResults.failed)) * 100)}%`);
    
    // Save results
    localStorage.setItem('dashboardAuditResults', JSON.stringify(auditResults));
    console.log('\n💾 Audit results saved to localStorage');
    console.log('To retrieve: JSON.parse(localStorage.getItem("dashboardAuditResults"))');
    
  } catch (error) {
    console.error('❌ Audit failed with error:', error);
  }
}

// Start the audit
runCompleteAudit();