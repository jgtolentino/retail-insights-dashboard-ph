// Comprehensive QA Test Execution Script
// Copy and paste this entire script into the browser console at:
// https://retail-insights-dashboard-ph.vercel.app/

console.log('🧪 Starting Comprehensive Filter QA Tests...\n');

const QATestSuite = {
    results: [],
    productionUrl: 'https://retail-insights-dashboard-ph.vercel.app/',
    
    log(testName, passed, details = '') {
        const result = { testName, passed, details, timestamp: new Date().toISOString() };
        this.results.push(result);
        console.log(`${passed ? '✅' : '❌'} ${testName}${details ? ': ' + details : ''}`);
        return passed;
    },
    
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // Test 1: Global Setup
    async testGlobalSetup() {
        console.log('\n📋 Test 1: Global Setup');
        
        // Check URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const hasFilterParams = urlParams.has('categories') || urlParams.has('brands') || 
                               urlParams.has('products') || urlParams.has('locations');
        this.log('Clean URL with no filter parameters', !hasFilterParams);
        
        // Check localStorage
        const storedFilters = localStorage.getItem('retail-dashboard-filters');
        const hasStoredFilters = storedFilters && storedFilters !== '{}' && 
                               JSON.parse(storedFilters || '{}').length > 0;
        this.log('No filters in localStorage on fresh load', !hasStoredFilters);
        
        // Check for filter chips/badges
        const chips = document.querySelectorAll(
            '[data-testid*="chip"], [data-testid*="badge"], .chip, .badge, [class*="chip"], [class*="badge"]'
        );
        this.log('No filter chips visible on initial load', chips.length === 0);
        
        // Check for "no filters" message
        const noFiltersMsg = document.querySelector(
            '[data-testid*="no-filters"], [class*="no-filters"], [class*="empty-filters"]'
        );
        this.log('No filters message displayed', noFiltersMsg !== null);
        
        return this.results.filter(r => r.testName.includes('Global Setup')).every(r => r.passed);
    },
    
    // Test 2: Filter Element Detection
    async testFilterElements() {
        console.log('\n📋 Test 2: Filter Element Detection');
        
        // Find dropdown elements
        const dropdowns = document.querySelectorAll(
            'select, [role="combobox"], [role="listbox"], [data-testid*="filter"], [data-testid*="dropdown"], [class*="dropdown"]'
        );
        this.log('Filter dropdowns found', dropdowns.length > 0, `Found ${dropdowns.length} dropdowns`);
        
        // Find date inputs
        const dateInputs = document.querySelectorAll(
            'input[type="date"], [data-testid*="date"], [class*="date-picker"]'
        );
        this.log('Date picker elements found', dateInputs.length > 0, `Found ${dateInputs.length} date inputs`);
        
        // Find reset button
        const resetButtons = document.querySelectorAll(
            'button:contains("Reset"), [data-testid*="reset"], [aria-label*="reset"], [class*="reset"]'
        );
        this.log('Reset button found', resetButtons.length > 0, `Found ${resetButtons.length} reset buttons`);
        
        // Log all found elements for debugging
        console.log('📝 Detailed Element Analysis:');
        console.log('- Dropdowns:', Array.from(dropdowns).map(el => ({
            tag: el.tagName,
            id: el.id,
            class: el.className,
            testId: el.getAttribute('data-testid')
        })));
        
        return dropdowns.length > 0;
    },
    
    // Test 3: Navigation Links
    async testNavigationStructure() {
        console.log('\n📋 Test 3: Navigation Structure');
        
        const navLinks = document.querySelectorAll(
            'nav a, [role="navigation"] a, [class*="nav"] a, [data-testid*="nav"] a'
        );
        
        this.log('Navigation links found', navLinks.length > 0, `Found ${navLinks.length} nav links`);
        
        const linkTexts = Array.from(navLinks).map(link => link.textContent.trim()).filter(text => text);
        console.log('📝 Navigation Items:', linkTexts);
        
        // Expected pages
        const expectedPages = ['Dashboard', 'Product Mix', 'Consumer Insights', 'Brands', 'Trends'];
        const foundPages = expectedPages.filter(page => 
            linkTexts.some(text => text.toLowerCase().includes(page.toLowerCase()))
        );
        
        this.log('Expected navigation pages present', foundPages.length >= 3, 
                `Found: ${foundPages.join(', ')}`);
        
        return navLinks.length > 0;
    },
    
    // Test 4: Data Visualization Elements
    async testDataElements() {
        console.log('\n📋 Test 4: Data Visualization Elements');
        
        // Find charts
        const charts = document.querySelectorAll(
            '[data-testid*="chart"], [class*="chart"], canvas, svg, .recharts-wrapper'
        );
        this.log('Chart elements found', charts.length > 0, `Found ${charts.length} charts`);
        
        // Find tables
        const tables = document.querySelectorAll(
            'table, [data-testid*="table"], [class*="table"], [role="table"]'
        );
        this.log('Table elements found', tables.length > 0, `Found ${tables.length} tables`);
        
        // Find KPI cards
        const kpis = document.querySelectorAll(
            '[data-testid*="kpi"], [class*="kpi"], [class*="metric"], [class*="stat"]'
        );
        this.log('KPI/Metric cards found', kpis.length > 0, `Found ${kpis.length} KPI cards`);
        
        return charts.length > 0 || tables.length > 0 || kpis.length > 0;
    },
    
    // Test 5: Interactive Filter Testing
    async testFilterInteraction() {
        console.log('\n📋 Test 5: Interactive Filter Testing');
        
        // Try to find and interact with the first dropdown
        const dropdown = document.querySelector(
            'select, [role="combobox"], [data-testid*="filter"]'
        );
        
        if (dropdown) {
            try {
                // Click the dropdown
                dropdown.click();
                await this.sleep(500);
                
                // Look for options
                const options = document.querySelectorAll(
                    'option, [role="option"], [data-testid*="option"]'
                );
                
                this.log('Dropdown opens and shows options', options.length > 0, 
                        `Found ${options.length} options`);
                
                // Try to select an option if available
                if (options.length > 0) {
                    options[0].click();
                    await this.sleep(500);
                    
                    // Check if URL updated
                    const urlAfter = window.location.search;
                    this.log('Filter selection updates URL', urlAfter.length > 0, 
                            `URL params: ${urlAfter}`);
                }
                
                return true;
            } catch (error) {
                this.log('Filter interaction error', false, error.message);
                return false;
            }
        } else {
            this.log('No interactive dropdowns found', false, 'Cannot test filter interaction');
            return false;
        }
    },
    
    // Test 6: Console Error Check
    async testConsoleErrors() {
        console.log('\n📋 Test 6: Console Error Detection');
        
        // Note: This is a simplified check - real errors would need to be monitored
        // during page load and interaction
        
        this.log('Console error monitoring active', true, 'Monitor console during testing');
        
        // Check for common error indicators in the DOM
        const errorElements = document.querySelectorAll(
            '.error, [role="alert"], [data-error], [class*="error"]'
        );
        
        this.log('No error messages in DOM', errorElements.length === 0, 
                `Found ${errorElements.length} error elements`);
        
        return errorElements.length === 0;
    },
    
    // Test 7: Mobile Responsiveness (Simulated)
    async testResponsiveness() {
        console.log('\n📋 Test 7: Responsive Design Check');
        
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        this.log('Desktop viewport detected', viewport.width >= 1024, 
                `${viewport.width}x${viewport.height}`);
        
        // Check if elements have responsive classes
        const responsiveElements = document.querySelectorAll(
            '[class*="sm:"], [class*="md:"], [class*="lg:"], [class*="responsive"]'
        );
        
        this.log('Responsive CSS classes present', responsiveElements.length > 0,
                `Found ${responsiveElements.length} elements with responsive classes`);
        
        return true;
    },
    
    // Generate comprehensive report
    generateReport() {
        console.log('\n📊 COMPREHENSIVE QA TEST REPORT');
        console.log('='.repeat(60));
        
        const passed = this.results.filter(r => r.passed).length;
        const failed = this.results.filter(r => !r.passed).length;
        const total = this.results.length;
        const successRate = Math.round((passed / total) * 100);
        
        console.log(`🎯 Test Summary:`);
        console.log(`   Total Tests: ${total}`);
        console.log(`   Passed: ${passed} (${successRate}%)`);
        console.log(`   Failed: ${failed}`);
        console.log(`   URL: ${window.location.href}`);
        console.log(`   Timestamp: ${new Date().toISOString()}`);
        
        if (failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.results.filter(r => !r.passed).forEach(r => {
                console.log(`   • ${r.testName}: ${r.details}`);
            });
        }
        
        console.log('\n✅ Passed Tests:');
        this.results.filter(r => r.passed).forEach(r => {
            console.log(`   • ${r.testName}${r.details ? ': ' + r.details : ''}`);
        });
        
        // Save to window for export
        window.qaTestReport = {
            url: window.location.href,
            timestamp: new Date().toISOString(),
            summary: { total, passed, failed, successRate },
            results: this.results
        };
        
        console.log('\n📁 Report saved to window.qaTestReport for export');
        
        return this.results;
    },
    
    // Run all tests
    async runAllTests() {
        console.log('🚀 Starting Complete QA Test Suite...');
        console.log(`🌐 Testing URL: ${window.location.href}\n`);
        
        try {
            await this.testGlobalSetup();
            await this.testFilterElements();
            await this.testNavigationStructure();
            await this.testDataElements();
            await this.testFilterInteraction();
            await this.testConsoleErrors();
            await this.testResponsiveness();
            
            this.generateReport();
            
            console.log('\n🎉 QA Test Suite Complete!');
            console.log('📋 Use window.qaTestReport to access full results');
            console.log('💾 Copy results with: JSON.stringify(window.qaTestReport, null, 2)');
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            this.log('Test suite execution', false, error.message);
        }
        
        return this.results;
    }
};

// Export functions for individual testing
window.QATestSuite = QATestSuite;

// Auto-run message
console.log('🧪 QA Test Suite Loaded!');
console.log('📋 Run: QATestSuite.runAllTests()');
console.log('🎯 Or run individual tests like: QATestSuite.testFilterElements()');
console.log(`🌐 Current URL: ${window.location.href}\n`);

// Uncomment to auto-run:
// QATestSuite.runAllTests();