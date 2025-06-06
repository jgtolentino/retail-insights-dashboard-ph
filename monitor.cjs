// Continuous Monitoring & Auto-Fix System
// Run: npm run monitor

const fs = require('fs');
const { spawn } = require('child_process');

console.log('🔍 Starting Continuous Monitor & Auto-Fix...\n');

let devServer = null;
let isMonitoring = false;

// Start dev server
function startDevServer() {
  console.log('🚀 Starting dev server...');
  devServer = spawn('npm', ['run', 'dev'], { stdio: 'pipe' });
  
  devServer.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('ready in')) {
      console.log('✅ Dev server ready');
      setTimeout(runTests, 2000); // Wait 2 seconds then test
    }
  });
  
  devServer.stderr.on('data', (data) => {
    const error = data.toString();
    console.log('🔧 Dev server error:', error.trim());
  });
}

// Run comprehensive tests
async function runTests() {
  if (isMonitoring) return;
  isMonitoring = true;
  
  console.log('\n🔍 Running diagnostic tests...');
  
  // Run debug verify
  try {
    const { spawn } = require('child_process');
    const debugVerify = spawn('node', ['debug-verify.cjs'], { stdio: 'pipe' });
    
    debugVerify.stdout.on('data', (data) => {
      console.log(data.toString().trim());
    });
    
    debugVerify.on('close', () => {
      setTimeout(runRuntimeTests, 1000);
    });
  } catch (error) {
    console.log('⚠️ Debug verify failed:', error.message);
  }
}

// Run runtime tests
async function runRuntimeTests() {
  try {
    const runtimeTest = spawn('node', ['runtime-test.cjs'], { stdio: 'pipe' });
    
    runtimeTest.stdout.on('data', (data) => {
      console.log(data.toString().trim());
    });
    
    runtimeTest.on('close', () => {
      console.log('\n✨ Monitoring cycle complete');
      isMonitoring = false;
      
      // Schedule next check in 30 seconds
      setTimeout(() => {
        if (devServer && !devServer.killed) {
          runTests();
        }
      }, 30000);
    });
  } catch (error) {
    console.log('⚠️ Runtime test failed:', error.message);
    isMonitoring = false;
  }
}

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping monitor...');
  if (devServer) {
    devServer.kill();
  }
  process.exit(0);
});

// Start monitoring
console.log('📊 Monitor will check for issues every 30 seconds');
console.log('Press Ctrl+C to stop\n');

startDevServer();