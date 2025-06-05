#!/bin/bash

#=============================================================================
# Frontend Performance Benchmark Script
# For: Retail Insights Dashboard PH
# Version: 1.0.0
# 
# This script provides comprehensive performance analysis including:
# - Lighthouse scores and Core Web Vitals
# - Bundle size analysis
# - Memory profiling
# - React component performance
# - Runtime metrics
#=============================================================================

set -e  # Exit on error
set -u  # Exit on undefined variable

#-----------------------------------------------------------------------------
# Configuration
#-----------------------------------------------------------------------------
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$SCRIPT_DIR"
readonly PORT="${PORT:-3000}"
readonly BUILD_DIR="${BUILD_DIR:-dist}"
readonly RESULTS_DIR="$PROJECT_ROOT/${RESULTS_DIR:-performance-results}"
readonly TIMESTAMP=$(date +%Y%m%d_%H%M%S)
readonly LOG_FILE="$RESULTS_DIR/benchmark_${TIMESTAMP}.log"

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color

# Process tracking
SERVER_PID=""

#-----------------------------------------------------------------------------
# Utility Functions
#-----------------------------------------------------------------------------

# Print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Create results directory
setup_directories() {
    mkdir -p "$RESULTS_DIR"
    print_info "Results will be saved to: $RESULTS_DIR"
}

# Log output to file and console
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

#-----------------------------------------------------------------------------
# Dependency Management
#-----------------------------------------------------------------------------

check_system_requirements() {
    print_info "Checking system requirements..."
    
    local missing_deps=()
    
    # Check Node.js
    if ! command_exists node; then
        missing_deps+=("Node.js")
    else
        local node_version=$(node --version)
        print_success "Node.js $node_version found"
    fi
    
    # Check npm
    if ! command_exists npm; then
        missing_deps+=("npm")
    else
        local npm_version=$(npm --version)
        print_success "npm $npm_version found"
    fi
    
    # Check curl
    if ! command_exists curl; then
        missing_deps+=("curl")
    fi
    
    # Report missing dependencies
    if [ ${#missing_deps[@]} -gt 0 ]; then
        print_error "Missing required dependencies: ${missing_deps[*]}"
        print_error "Please install them before running this script"
        exit 1
    fi
}

install_npm_dependencies() {
    print_info "Checking npm dependencies..."
    
    cd "$PROJECT_ROOT"
    
    # Install project dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        print_info "Installing project dependencies..."
        npm install
    fi
    
    # Check and install global Lighthouse
    if ! command_exists lighthouse; then
        print_info "Installing Lighthouse CLI globally..."
        npm install -g lighthouse@latest
    fi
    
    # Check and install dev dependencies
    local deps_to_install=""
    
    # Check each required dependency
    for dep in "playwright" "source-map-explorer" "webpack-bundle-analyzer"; do
        if ! npm list "$dep" >/dev/null 2>&1; then
            deps_to_install="$deps_to_install $dep"
        fi
    done
    
    if [ -n "$deps_to_install" ]; then
        print_info "Installing development dependencies:$deps_to_install"
        npm install --save-dev $deps_to_install
        
        # Install Playwright browsers if needed
        if [[ $deps_to_install == *"playwright"* ]]; then
            print_info "Installing Playwright browsers..."
            npx playwright install chromium
        fi
    fi
    
    print_success "All dependencies ready"
}

#-----------------------------------------------------------------------------
# Server Management
#-----------------------------------------------------------------------------

start_dev_server() {
    print_info "Starting development server on port $PORT..."
    
    # Kill any existing process on the port
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port $PORT is in use. Killing existing process..."
        lsof -Pi :$PORT -sTCP:LISTEN -t | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    # Start the development server
    cd "$PROJECT_ROOT"
    print_info "Current directory: $(pwd)"
    print_info "PROJECT_ROOT: $PROJECT_ROOT"
    npm run dev -- --port $PORT > "$RESULTS_DIR/server_${TIMESTAMP}.log" 2>&1 &
    SERVER_PID=$!
    
    # Wait for server to be ready
    local max_attempts=30
    local attempt=0
    
    print_info "Waiting for server to start..."
    while ! curl -s "http://localhost:$PORT" >/dev/null; do
        sleep 2
        attempt=$((attempt + 1))
        
        if [ $attempt -ge $max_attempts ]; then
            print_error "Server failed to start after $max_attempts attempts"
            cat "$RESULTS_DIR/server_${TIMESTAMP}.log"
            cleanup_and_exit 1
        fi
        
        # Show progress
        echo -n "."
    done
    
    echo ""  # New line after dots
    print_success "Server is ready at http://localhost:$PORT (PID: $SERVER_PID)"
}

#-----------------------------------------------------------------------------
# Performance Analysis Functions
#-----------------------------------------------------------------------------

run_lighthouse_analysis() {
    print_info "Running Lighthouse analysis..."
    
    local lighthouse_output="$RESULTS_DIR/lighthouse_${TIMESTAMP}.json"
    local lighthouse_html="$RESULTS_DIR/lighthouse_${TIMESTAMP}.html"
    
    # Run Lighthouse with comprehensive settings
    lighthouse "http://localhost:$PORT" \
        --output=json,html \
        --output-path="${lighthouse_output%.json}" \
        --chrome-flags="--headless --disable-gpu --no-sandbox" \
        --only-categories=performance,accessibility,best-practices,seo \
        --throttling-method=simulate \
        --preset=desktop \
        --max-wait-for-load=45000 \
        --no-enable-error-reporting || true
    
    # Extract and display results
    if [ -f "$lighthouse_output" ]; then
        print_success "Lighthouse analysis complete"
        
        # Parse and display scores
        node -e "
        const fs = require('fs');
        const results = JSON.parse(fs.readFileSync('$lighthouse_output', 'utf8'));
        const scores = results.categories;
        const audits = results.audits;
        
        console.log('\\n📊 Lighthouse Scores:');
        console.log('├─ Performance:    ' + Math.round(scores.performance.score * 100) + '%');
        console.log('├─ Accessibility:  ' + Math.round(scores.accessibility.score * 100) + '%');
        console.log('├─ Best Practices: ' + Math.round(scores['best-practices'].score * 100) + '%');
        console.log('└─ SEO:            ' + Math.round(scores.seo.score * 100) + '%');
        
        console.log('\\n⚡ Core Web Vitals:');
        console.log('├─ LCP: ' + audits['largest-contentful-paint'].displayValue);
        console.log('├─ FID: ' + audits['max-potential-fid'].displayValue);
        console.log('├─ CLS: ' + audits['cumulative-layout-shift'].displayValue);
        console.log('├─ FCP: ' + audits['first-contentful-paint'].displayValue);
        console.log('├─ SI:  ' + audits['speed-index'].displayValue);
        console.log('└─ TTI: ' + audits['interactive'].displayValue);
        "
        
        print_info "HTML report saved to: $lighthouse_html"
    else
        print_error "Lighthouse analysis failed"
    fi
}

analyze_bundle_size() {
    print_info "Analyzing bundle size..."
    
    cd "$PROJECT_ROOT"
    
    # Build the project
    local build_start=$(date +%s)
    print_info "Building production bundle..."
    
    npm run build > "$RESULTS_DIR/build_${TIMESTAMP}.log" 2>&1
    
    local build_end=$(date +%s)
    local build_time=$((build_end - build_start))
    
    print_success "Build completed in ${build_time}s"
    
    # Analyze bundle sizes
    if [ -d "$BUILD_DIR" ]; then
        print_info "Bundle analysis:"
        
        # Find and display JavaScript files
        echo -e "\n📦 JavaScript bundles:"
        find "$BUILD_DIR" -name "*.js" -type f | while read -r file; do
            local size=$(du -h "$file" | cut -f1)
            local gzip_size=$(gzip -c "$file" | wc -c | awk '{ sum=$1; units="B,KiB,MiB,GiB,TiB,PiB,EiB,ZiB,Y"; i=0; while (sum > 1024 && i < 8) { sum /= 1024; i++ } print int(sum*100+0.5)/100 " " substr(units, i*4+1, 4) }')
            local filename=$(basename "$file")
            echo "├─ $filename: $size (gzipped: $gzip_size)"
        done
        
        # Find and display CSS files
        echo -e "\n🎨 CSS bundles:"
        find "$BUILD_DIR" -name "*.css" -type f | while read -r file; do
            local size=$(du -h "$file" | cut -f1)
            local gzip_size=$(gzip -c "$file" | wc -c | awk '{ sum=$1; units="B,KiB,MiB,GiB,TiB,PiB,EiB,ZiB,Y"; i=0; while (sum > 1024 && i < 8) { sum /= 1024; i++ } print int(sum*100+0.5)/100 " " substr(units, i*4+1, 4) }')
            local filename=$(basename "$file")
            echo "├─ $filename: $size (gzipped: $gzip_size)"
        done
        
        # Total size
        local total_size=$(du -sh "$BUILD_DIR" | cut -f1)
        echo -e "\n📁 Total build size: $total_size"
        
        # Run source-map-explorer if available
        if command_exists source-map-explorer; then
            print_info "Generating bundle visualization..."
            npx source-map-explorer "$BUILD_DIR/assets/*.js" \
                --html "$RESULTS_DIR/bundle_visualization_${TIMESTAMP}.html" \
                >/dev/null 2>&1 || print_warning "Bundle visualization failed"
        fi
    else
        print_error "Build directory not found"
    fi
}

run_memory_profiling() {
    print_info "Running memory profiling..."
    
    # Create memory profiling script
    cat > "$RESULTS_DIR/memory_profile.cjs" << 'EOF'
const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ 
        headless: true,
        args: ['--enable-precise-memory-info']
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('Starting memory profiling...\n');
    
    try {
        // Initial navigation
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        // Get initial memory
        const initialMemory = await page.evaluate(() => ({
            heap: performance.memory ? performance.memory.usedJSHeapSize / 1024 / 1024 : 0,
            total: performance.memory ? performance.memory.totalJSHeapSize / 1024 / 1024 : 0
        }));
        
        console.log(`Initial memory: ${initialMemory.heap.toFixed(2)}MB`);
        
        // Navigate through routes
        const routes = [
            { path: '/', name: 'Home' },
            { path: '/dashboard', name: 'Dashboard' },
            { path: '/sales', name: 'Sales' },
            { path: '/product-mix', name: 'Product Mix' },
            { path: '/trends', name: 'Trends' }
        ];
        
        const measurements = [];
        
        for (const route of routes) {
            await page.goto(`http://localhost:3000${route.path}`, { 
                waitUntil: 'networkidle' 
            });
            await page.waitForTimeout(2000);
            
            const memory = await page.evaluate(() => ({
                heap: performance.memory ? performance.memory.usedJSHeapSize / 1024 / 1024 : 0
            }));
            
            measurements.push({
                route: route.name,
                memory: memory.heap.toFixed(2)
            });
            
            console.log(`${route.name}: ${memory.heap.toFixed(2)}MB`);
        }
        
        // Final memory check
        const finalMemory = await page.evaluate(() => ({
            heap: performance.memory ? performance.memory.usedJSHeapSize / 1024 / 1024 : 0
        }));
        
        const memoryGrowth = finalMemory.heap - initialMemory.heap;
        console.log(`\nMemory growth: ${memoryGrowth.toFixed(2)}MB`);
        
        // Save results
        const fs = require('fs');
        const results = {
            initial: initialMemory.heap,
            final: finalMemory.heap,
            growth: memoryGrowth,
            measurements: measurements,
            timestamp: new Date().toISOString()
        };
        
        fs.writeFileSync(
            `./performance-results/memory_results_${Date.now()}.json`,
            JSON.stringify(results, null, 2)
        );
        
    } catch (error) {
        console.error('Memory profiling error:', error.message);
    } finally {
        await browser.close();
    }
})();
EOF

    # Run the profiling script
    if [ -f "node_modules/.bin/playwright" ]; then
        cd "$PROJECT_ROOT"
        node "$RESULTS_DIR/memory_profile.cjs"
        rm -f "$RESULTS_DIR/memory_profile.cjs"  # Clean up
    else
        print_warning "Playwright not found, skipping memory profiling"
    fi
}

run_runtime_performance() {
    print_info "Measuring runtime performance..."
    
    # Create runtime performance script
    cat > "$RESULTS_DIR/runtime_perf.cjs" << 'EOF'
const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    console.log('Measuring runtime performance...\n');
    
    const routes = [
        { path: '/', name: 'Home' },
        { path: '/dashboard', name: 'Dashboard' },
        { path: '/sales', name: 'Sales' }
    ];
    
    const measurements = [];
    
    try {
        for (const route of routes) {
            const startTime = Date.now();
            
            await page.goto(`http://localhost:3000${route.path}`, {
                waitUntil: 'networkidle'
            });
            
            const loadTime = Date.now() - startTime;
            
            // Get navigation timing
            const timing = await page.evaluate(() => {
                const nav = performance.getEntriesByType('navigation')[0];
                return {
                    ttfb: nav.responseStart - nav.requestStart,
                    domReady: nav.domContentLoadedEventEnd - nav.fetchStart,
                    loadComplete: nav.loadEventEnd - nav.fetchStart
                };
            });
            
            measurements.push({
                route: route.name,
                loadTime,
                ...timing
            });
            
            console.log(`${route.name}: ${loadTime}ms (TTFB: ${timing.ttfb.toFixed(0)}ms)`);
        }
        
        // Calculate averages
        const avgLoadTime = measurements.reduce((sum, m) => sum + m.loadTime, 0) / measurements.length;
        console.log(`\nAverage load time: ${avgLoadTime.toFixed(0)}ms`);
        
        // Save results
        const fs = require('fs');
        fs.writeFileSync(
            `./performance-results/runtime_results_${Date.now()}.json`,
            JSON.stringify({ measurements, avgLoadTime }, null, 2)
        );
        
    } catch (error) {
        console.error('Runtime performance error:', error.message);
    } finally {
        await browser.close();
    }
})();
EOF

    # Run the script
    if [ -f "node_modules/.bin/playwright" ]; then
        cd "$PROJECT_ROOT"
        node "$RESULTS_DIR/runtime_perf.cjs"
        rm -f "$RESULTS_DIR/runtime_perf.cjs"  # Clean up
    else
        print_warning "Playwright not found, skipping runtime performance"
    fi
}

#-----------------------------------------------------------------------------
# Report Generation
#-----------------------------------------------------------------------------

generate_summary_report() {
    print_info "Generating summary report..."
    
    local report_file="$RESULTS_DIR/summary_${TIMESTAMP}.md"
    
    cat > "$report_file" << EOF
# Performance Benchmark Report
**Project**: Retail Insights Dashboard PH  
**Date**: $(date)  
**Results Directory**: $RESULTS_DIR

## 📊 Summary

### Lighthouse Scores
- See \`lighthouse_${TIMESTAMP}.json\` for detailed results
- HTML report: \`lighthouse_${TIMESTAMP}.html\`

### Bundle Analysis
- Build time recorded
- Bundle sizes analyzed (with gzip)
- Visualization available (if generated)

### Memory Profile
- Initial and final heap sizes measured
- Memory growth tracked across routes
- Results saved to JSON files

### Runtime Performance
- Page load times measured
- TTFB (Time to First Byte) recorded
- Navigation timing captured

## 📁 Generated Files

\`\`\`
$RESULTS_DIR/
├── lighthouse_${TIMESTAMP}.json
├── lighthouse_${TIMESTAMP}.html
├── build_${TIMESTAMP}.log
├── memory_results_*.json
├── runtime_results_*.json
└── summary_${TIMESTAMP}.md
\`\`\`

## 🎯 Next Steps

1. Review Lighthouse scores and address any issues
2. Analyze bundle sizes for optimization opportunities
3. Check memory growth patterns
4. Monitor runtime performance trends

---
*Generated by Performance Benchmark Script v1.0.0*
EOF

    print_success "Summary report saved to: $report_file"
}

#-----------------------------------------------------------------------------
# Cleanup and Exit Handlers
#-----------------------------------------------------------------------------

cleanup() {
    if [ -n "$SERVER_PID" ] && kill -0 $SERVER_PID 2>/dev/null; then
        print_info "Stopping development server (PID: $SERVER_PID)..."
        kill $SERVER_PID 2>/dev/null || true
        wait $SERVER_PID 2>/dev/null || true
    fi
    
    # Remove temporary files
    rm -f "$RESULTS_DIR"/*.js 2>/dev/null || true
}

cleanup_and_exit() {
    local exit_code=${1:-0}
    cleanup
    exit $exit_code
}

# Set up trap for cleanup on script exit
trap cleanup_and_exit EXIT INT TERM

#-----------------------------------------------------------------------------
# Main Execution
#-----------------------------------------------------------------------------

main() {
    echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║     Frontend Performance Benchmark Suite     ║${NC}"
    echo -e "${CYAN}║          Retail Insights Dashboard           ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Setup
    setup_directories
    log "Starting performance benchmark run"
    
    # Check system requirements
    check_system_requirements
    
    # Install dependencies
    install_npm_dependencies
    
    # Start development server
    start_dev_server
    
    # Run performance tests
    echo -e "\n${CYAN}Running performance tests...${NC}\n"
    
    run_lighthouse_analysis
    echo ""
    
    analyze_bundle_size
    echo ""
    
    run_memory_profiling
    echo ""
    
    run_runtime_performance
    echo ""
    
    # Generate report
    generate_summary_report
    
    # Final summary
    echo -e "\n${GREEN}╔══════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║           Benchmark Complete! 🎉             ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
    echo -e "\n📁 All results saved to: ${CYAN}$RESULTS_DIR/${NC}"
    echo -e "📊 View the summary at: ${CYAN}$RESULTS_DIR/summary_${TIMESTAMP}.md${NC}"
    echo -e "🌐 Open Lighthouse HTML: ${CYAN}$RESULTS_DIR/lighthouse_${TIMESTAMP}.html${NC}\n"
    
    log "Benchmark completed successfully"
}

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 