#!/usr/bin/env node

/**
 * Script to find and list all Supabase RPC calls in the frontend code
 */

const fs = require('fs');
const path = require('path');

// Patterns to match RPC calls
const rpcPatterns = [
  /\.rpc\(['"`]([^'"`]+)['"`]/g,  // matches .rpc('function_name')
  /supabase\.rpc\(['"`]([^'"`]+)['"`]/g,  // matches supabase.rpc('function_name')
];

// Directories to search
const searchDirs = [
  path.join(__dirname, '../src'),
];

const foundRPCs = new Map(); // Map of RPC name to locations

function searchFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  rpcPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const rpcName = match[1];
      const lineNumber = content.substring(0, match.index).split('\n').length;
      
      if (!foundRPCs.has(rpcName)) {
        foundRPCs.set(rpcName, []);
      }
      
      foundRPCs.get(rpcName).push({
        file: path.relative(process.cwd(), filePath),
        line: lineNumber
      });
    }
    pattern.lastIndex = 0; // Reset regex
  });
}

function searchDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      searchDirectory(fullPath);
    } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx'))) {
      searchFile(fullPath);
    }
  });
}

// Search all directories
searchDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    searchDirectory(dir);
  }
});

// Output results
console.log('📊 Supabase RPC Functions Found in Frontend:\n');

if (foundRPCs.size === 0) {
  console.log('No RPC calls found.');
} else {
  // Sort by function name
  const sortedRPCs = Array.from(foundRPCs.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  
  sortedRPCs.forEach(([rpcName, locations]) => {
    console.log(`🔹 ${rpcName}`);
    locations.forEach(loc => {
      console.log(`   📄 ${loc.file}:${loc.line}`);
    });
    console.log('');
  });
  
  console.log(`\n📈 Summary: ${foundRPCs.size} unique RPC functions found`);
  
  // List all RPC names for easy copying
  console.log('\n📋 All RPC function names:');
  sortedRPCs.forEach(([rpcName]) => {
    console.log(`- ${rpcName}`);
  });
}

// Export as JSON if requested
if (process.argv.includes('--json')) {
  const output = {
    rpcFunctions: Array.from(foundRPCs.entries()).map(([name, locations]) => ({
      name,
      locations: locations.map(loc => `${loc.file}:${loc.line}`)
    })),
    summary: {
      totalFunctions: foundRPCs.size,
      totalCalls: Array.from(foundRPCs.values()).reduce((sum, locs) => sum + locs.length, 0)
    }
  };
  
  fs.writeFileSync('rpc-functions.json', JSON.stringify(output, null, 2));
  console.log('\n✅ JSON output saved to rpc-functions.json');
}