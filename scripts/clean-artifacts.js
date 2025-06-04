#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning deployment artifacts...');

function findAndRemoveFiles(dir, patterns, removed = []) {
  if (!fs.existsSync(dir)) {
    return removed;
  }

  const files = fs.readdirSync(dir, { withFileTypes: true });

  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      // Recursively clean subdirectories
      findAndRemoveFiles(fullPath, patterns, removed);
    } else {
      // Check if file matches any problematic pattern
      const shouldRemove = patterns.some(pattern => {
        if (typeof pattern === 'string') {
          return file.name.includes(pattern);
        } else if (pattern instanceof RegExp) {
          return pattern.test(file.name);
        }
        return false;
      });

      if (shouldRemove) {
        try {
          fs.unlinkSync(fullPath);
          removed.push(fullPath);
          console.log(`🗑️  Removed: ${fullPath}`);
        } catch (error) {
          console.error(`❌ Failed to remove ${fullPath}:`, error.message);
        }
      }
    }
  });

  return removed;
}

// Patterns for files that should be removed
const problematicPatterns = [
  /^Icon[\r\n]*$/,  // macOS Icon files
  'Icon\r',         // macOS Icon files (alternative)
  '.DS_Store',      // macOS metadata
  'Thumbs.db',      // Windows thumbnails
  'backup',         // Backup files
  '.bak',           // Backup files
  '.tmp',           // Temporary files
  '~$',             // Office temp files
  '.cache',         // Cache directories
];

// Clean common directories
const directoriesToClean = [
  './dist',
  './build',
  './public',
  './src',
  './'
];

let totalRemoved = [];

directoriesToClean.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`📁 Cleaning ${dir}...`);
    const removed = findAndRemoveFiles(dir, problematicPatterns);
    totalRemoved = totalRemoved.concat(removed);
  }
});

// Check for large files that might cause deployment issues
function checkLargeFiles(dir, maxSize = 5 * 1024 * 1024) { // 5MB
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      checkLargeFiles(fullPath, maxSize);
    } else {
      try {
        const stats = fs.statSync(fullPath);
        if (stats.size > maxSize) {
          const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
          console.warn(`⚠️  Large file detected: ${fullPath} (${sizeMB}MB)`);
        }
      } catch (error) {
        // Skip files we can't read
      }
    }
  });
}

console.log('📏 Checking for large files...');
checkLargeFiles('./dist');
checkLargeFiles('./public');

if (totalRemoved.length > 0) {
  console.log(`✅ Cleanup completed! Removed ${totalRemoved.length} problematic files.`);
} else {
  console.log('✅ No problematic files found.');
}

// Verify critical files exist
const criticalFiles = [
  './dist/index.html',
  './package.json',
  './vercel.json'
];

console.log('🔍 Verifying critical files...');
criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.warn(`⚠️  ${file} not found`);
  }
});

console.log('🎉 Artifact cleanup completed!');