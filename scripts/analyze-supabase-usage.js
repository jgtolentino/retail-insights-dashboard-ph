#!/usr/bin/env node

/**
 * Comprehensive analysis of Supabase usage in the codebase
 */

const fs = require('fs');
const path = require('path');

// Different types of Supabase operations
const operations = {
  rpc: new Map(),
  from: new Map(),
  select: new Map(),
  insert: new Map(),
  update: new Map(),
  delete: new Map(),
  auth: new Map()
};

// Patterns to match different operations
const patterns = {
  rpc: /\.rpc\(['"`]([^'"`]+)['"`]/g,
  from: /\.from\(['"`]([^'"`]+)['"`]/g,
  select: /\.select\(['"`]([^'"`]+)['"`]/g,
  insert: /\.insert\(/g,
  update: /\.update\(/g,
  delete: /\.delete\(/g,
  auth: /supabase\.auth\.([a-zA-Z]+)/g
};

// Search directories
const searchDirs = [
  path.join(__dirname, '../src'),
];

function extractContext(content, index, before = 50, after = 50) {
  const start = Math.max(0, index - before);
  const end = Math.min(content.length, index + after);
  return content.substring(start, end).replace(/\s+/g, ' ').trim();
}

function searchFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Search for RPC calls
  let match;
  const rpcPattern = patterns.rpc;
  while ((match = rpcPattern.exec(content)) !== null) {
    const rpcName = match[1];
    const lineNumber = content.substring(0, match.index).split('\n').length;
    const context = extractContext(content, match.index);
    
    if (!operations.rpc.has(rpcName)) {
      operations.rpc.set(rpcName, []);
    }
    
    operations.rpc.get(rpcName).push({
      file: path.relative(process.cwd(), filePath),
      line: lineNumber,
      context
    });
  }
  rpcPattern.lastIndex = 0;
  
  // Search for table operations
  const fromPattern = patterns.from;
  while ((match = fromPattern.exec(content)) !== null) {
    const tableName = match[1];
    const lineNumber = content.substring(0, match.index).split('\n').length;
    const context = extractContext(content, match.index, 20, 100);
    
    if (!operations.from.has(tableName)) {
      operations.from.set(tableName, []);
    }
    
    operations.from.get(tableName).push({
      file: path.relative(process.cwd(), filePath),
      line: lineNumber,
      context
    });
  }
  fromPattern.lastIndex = 0;
  
  // Search for auth operations
  const authPattern = patterns.auth;
  while ((match = authPattern.exec(content)) !== null) {
    const authMethod = match[1];
    const lineNumber = content.substring(0, match.index).split('\n').length;
    
    if (!operations.auth.has(authMethod)) {
      operations.auth.set(authMethod, []);
    }
    
    operations.auth.get(authMethod).push({
      file: path.relative(process.cwd(), filePath),
      line: lineNumber
    });
  }
  authPattern.lastIndex = 0;
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
console.log('🔍 Supabase Usage Analysis\n');

// RPC Functions
console.log('📊 RPC Functions:');
if (operations.rpc.size === 0) {
  console.log('  No RPC functions found\n');
} else {
  const sortedRPCs = Array.from(operations.rpc.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  sortedRPCs.forEach(([name, locations]) => {
    console.log(`  🔹 ${name} (${locations.length} calls)`);
    locations.slice(0, 2).forEach(loc => {
      console.log(`     📄 ${loc.file}:${loc.line}`);
    });
    if (locations.length > 2) {
      console.log(`     ... and ${locations.length - 2} more`);
    }
  });
  console.log('');
}

// Database Tables
console.log('📊 Database Tables:');
if (operations.from.size === 0) {
  console.log('  No direct table queries found\n');
} else {
  const sortedTables = Array.from(operations.from.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  sortedTables.forEach(([name, locations]) => {
    console.log(`  🔹 ${name} (${locations.length} queries)`);
    // Try to identify operation type from context
    const ops = new Set();
    locations.forEach(loc => {
      if (loc.context.includes('.select')) ops.add('SELECT');
      if (loc.context.includes('.insert')) ops.add('INSERT');
      if (loc.context.includes('.update')) ops.add('UPDATE');
      if (loc.context.includes('.delete')) ops.add('DELETE');
    });
    if (ops.size > 0) {
      console.log(`     Operations: ${Array.from(ops).join(', ')}`);
    }
    console.log(`     📄 ${locations[0].file}:${locations[0].line}`);
    if (locations.length > 1) {
      console.log(`     ... and ${locations.length - 1} more`);
    }
  });
  console.log('');
}

// Auth Operations
console.log('📊 Auth Operations:');
if (operations.auth.size === 0) {
  console.log('  No auth operations found\n');
} else {
  const sortedAuth = Array.from(operations.auth.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  sortedAuth.forEach(([method, locations]) => {
    console.log(`  🔹 ${method} (${locations.length} calls)`);
  });
  console.log('');
}

// Summary
console.log('📈 Summary:');
console.log(`  - RPC Functions: ${operations.rpc.size}`);
console.log(`  - Database Tables: ${operations.from.size}`);
console.log(`  - Auth Methods: ${operations.auth.size}`);

// Save detailed report
const report = {
  rpcFunctions: Array.from(operations.rpc.entries()).map(([name, locs]) => ({
    name,
    calls: locs.length,
    locations: locs.map(l => `${l.file}:${l.line}`)
  })),
  tables: Array.from(operations.from.entries()).map(([name, locs]) => ({
    name,
    queries: locs.length,
    locations: locs.map(l => `${l.file}:${l.line}`)
  })),
  auth: Array.from(operations.auth.entries()).map(([method, locs]) => ({
    method,
    calls: locs.length
  })),
  summary: {
    totalRPCs: operations.rpc.size,
    totalTables: operations.from.size,
    totalAuthMethods: operations.auth.size
  }
};

fs.writeFileSync('supabase-usage-report.json', JSON.stringify(report, null, 2));
console.log('\n✅ Detailed report saved to supabase-usage-report.json');