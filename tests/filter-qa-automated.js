// Automated Filter QA Test Script
// Run this in the browser console on the dashboard

const FilterQATester = {
    baseUrl: window.location.origin,
    results: [],
    
    // Test utilities
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    log(testName, passed, details = '') {
        const result = { testName, passed, details, timestamp: new Date().toISOString() };
        this.results.push(result);
        console.log(`${passed ? '✅' : '❌'} ${testName}`, details);
    },
    
    // Test localStorage
    checkLocalStorage() {
        const filters = localStorage.getItem('retail-dashboard-filters');
        return filters ? JSON.parse(filters) : null;
    },
    
    // Test URL parameters
    checkUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const filterParams = {};
        for (const [key, value] of params) {
            filterParams[key] = value;
        }
        return filterParams;
    },
    
    // Test filter elements
    findFilterElements() {
        return {
            dropdowns: document.querySelectorAll('[data-testid*="filter"]'),
            chips: document.querySelectorAll('[data-testid="filter-chip"]'),
            resetButton: document.querySelector('[data-testid="reset-filters"]'),
            noFiltersMessage: document.querySelector('[data-testid="no-filters-message"]')
        };
    },
    
    // Run all tests
    async runAllTests() {
        console.log('🧪 Starting Filter QA Tests...\n');
        
        // Test 1: Global Setup
        await this.testGlobalSetup();
        
        // Test 2: Multi-Select Dropdowns
        await this.testMultiSelectDropdowns();
        
        // Test 3: Single-Select Controls
        await this.testSingleSelectControls();
        
        // Test 4: Reset All Filters
        await this.testResetAllFilters();
        
        // Test 5: Cross-Page Persistence
        await this.testCrossPagePersistence();
        
        // Test 6: Data Validation
        await this.testDataValidation();
        
        // Generate report
        this.generateReport();
    },
    
    // Test 1: Global Setup
    async testGlobalSetup() {
        console.log('\n📋 Test 1: Global Setup');
        
        // Clear everything first
        localStorage.removeItem('retail-dashboard-filters');
        window.location.href = this.baseUrl;
        await this.sleep(2000);
        
        // Check default state
        const localStorage = this.checkLocalStorage();
        const urlParams = this.checkUrlParams();
        const elements = this.findFilterElements();
        
        this.log('Default page load - no localStorage filters', 
            !localStorage || Object.keys(localStorage).length === 0);
        
        this.log('Default page load - no URL filter params', 
            !urlParams.categories && !urlParams.brands && !urlParams.products);
        
        this.log('No filter chips visible', 
            elements.chips.length === 0);
        
        this.log('No filters message visible', 
            elements.noFiltersMessage !== null);
    },
    
    // Test 2: Multi-Select Dropdowns
    async testMultiSelectDropdowns() {
        console.log('\n📋 Test 2: Multi-Select Dropdowns');
        
        // Test categories dropdown
        const categoryDropdown = document.querySelector('[data-testid="categories-filter"]');
        if (categoryDropdown) {
            categoryDropdown.click();
            await this.sleep(500);
            
            // Select two items
            const options = document.querySelectorAll('[data-testid^="category-option"]');
            if (options.length >= 2) {
                options[0].click();
                options[1].click();
                await this.sleep(500);
                
                // Close dropdown
                document.body.click();
                await this.sleep(500);
                
                // Check if selections persist
                const urlParams = this.checkUrlParams();
                this.log('Categories update URL', urlParams.categories !== undefined);
                
                // Check chips
                const chips = document.querySelectorAll('[data-testid="filter-chip"]');
                this.log('Filter chips appear', chips.length >= 2);
                
                // Reload page
                window.location.reload();
                await this.sleep(2000);
                
                // Check persistence
                const urlParamsAfter = this.checkUrlParams();
                this.log('Filters persist after reload', 
                    urlParamsAfter.categories === urlParams.categories);
            }
        }
    },
    
    // Test 3: Single-Select Controls
    async testSingleSelectControls() {
        console.log('\n📋 Test 3: Single-Select Controls');
        
        // Test date range picker
        const dateRangePicker = document.querySelector('[data-testid="date-range-picker"]');
        if (dateRangePicker) {
            dateRangePicker.click();
            await this.sleep(500);
            
            // Select custom range
            const customOption = document.querySelector('[data-testid="custom-range"]');
            if (customOption) {
                customOption.click();
                await this.sleep(500);
                
                // Set dates (implementation depends on date picker library)
                // This is a placeholder
                const urlParams = this.checkUrlParams();
                this.log('Date range updates URL', 
                    urlParams.start !== undefined && urlParams.end !== undefined);
            }
        }
    },
    
    // Test 4: Reset All Filters
    async testResetAllFilters() {
        console.log('\n📋 Test 4: Reset All Filters');
        
        // First apply some filters
        // ... (apply filters code)
        
        // Click reset
        const resetButton = document.querySelector('[data-testid="reset-filters"]');
        if (resetButton) {
            resetButton.click();
            await this.sleep(1000);
            
            const urlParams = this.checkUrlParams();
            const localStorage = this.checkLocalStorage();
            const chips = document.querySelectorAll('[data-testid="filter-chip"]');
            
            this.log('Reset clears URL params', 
                !urlParams.categories && !urlParams.brands && !urlParams.products);
            
            this.log('Reset clears localStorage', 
                !localStorage || Object.keys(localStorage).length === 0);
            
            this.log('Reset removes all chips', chips.length === 0);
        }
    },
    
    // Test 5: Cross-Page Persistence
    async testCrossPagePersistence() {
        console.log('\n📋 Test 5: Cross-Page Filter Persistence');
        
        // Apply filters on dashboard
        // ... (apply filters code)
        
        // Navigate to other pages
        const pages = ['/product-mix', '/consumer-insights', '/brands'];
        
        for (const page of pages) {
            window.location.href = this.baseUrl + page;
            await this.sleep(2000);
            
            const urlParams = this.checkUrlParams();
            this.log(`Filters persist on ${page}`, 
                urlParams.categories !== undefined || urlParams.brands !== undefined);
        }
    },
    
    // Test 6: Data Validation
    async testDataValidation() {
        console.log('\n📋 Test 6: Data-Driven Validation');
        
        // Check if data updates with filters
        const dataElements = document.querySelectorAll('[data-testid*="chart"], [data-testid*="table"]');
        this.log('Data visualizations present', dataElements.length > 0);
        
        // Apply filter and check for changes
        // This would require more sophisticated checking of actual data values
    },
    
    // Generate test report
    generateReport() {
        console.log('\n📊 Test Report Summary');
        console.log('='.repeat(50));
        
        const passed = this.results.filter(r => r.passed).length;
        const failed = this.results.filter(r => !r.passed).length;
        const total = this.results.length;
        
        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed} (${Math.round(passed/total*100)}%)`);
        console.log(`Failed: ${failed}`);
        
        console.log('\nFailed Tests:');
        this.results.filter(r => !r.passed).forEach(r => {
            console.log(`  ❌ ${r.testName}`);
        });
        
        // Save results
        const reportData = {
            url: window.location.href,
            timestamp: new Date().toISOString(),
            summary: { total, passed, failed },
            results: this.results
        };
        
        console.log('\n💾 Full report saved to console as "qaReport"');
        window.qaReport = reportData;
        
        return reportData;
    }
};

// Run tests
console.log('Filter QA Test Script Loaded!');
console.log('Run FilterQATester.runAllTests() to start');
console.log('Or run individual tests like FilterQATester.testGlobalSetup()');

// Export for use
window.FilterQATester = FilterQATester;