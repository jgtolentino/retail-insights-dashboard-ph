#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function applyFixes() {
  console.log('🔧 Applying array safety fixes...\n');
  
  try {
    // Read the audit report
    const reportPath = path.join(process.cwd(), 'array-safety-report.json');
    const report = JSON.parse(await fs.readFile(reportPath, 'utf8'));
    
    if (!report.fixes || Object.keys(report.fixes).length === 0) {
      console.log('✅ No fixes to apply!');
      return;
    }
    
    // Group fixes by file
    for (const [filePath, fixes] of Object.entries(report.fixes)) {
      if (fixes.length === 0) continue;
      
      console.log(`📝 Processing ${path.relative(process.cwd(), filePath)}...`);
      
      let content = await fs.readFile(filePath, 'utf8');
      let modified = false;
      
      // Sort fixes by line number in reverse order to avoid offset issues
      const sortedFixes = fixes.sort((a, b) => b.line - a.line);
      
      for (const fix of sortedFixes) {
        // Only apply high and medium risk fixes automatically
        if (fix.riskLevel === 'low') continue;
        
        // Special handling for Array.from
        if (fix.old.includes('Array.from')) {
          // Check if it's the { length: N } pattern
          const lengthMatch = content.match(/Array\.from\s*\(\s*{\s*length:\s*(\d+)\s*}\s*,/);
          if (lengthMatch) {
            const length = parseInt(lengthMatch[1]);
            const lines = content.split('\n');
            const lineIndex = fix.line - 1;
            
            // Replace with a for loop pattern
            const indentation = lines[lineIndex].match(/^\s*/)[0];
            const replacement = `const tempArray = [];\n${indentation}for (let i = 0; i < ${length}; i++) {\n${indentation}  tempArray.push(/* array item */)\n${indentation}}`;
            
            console.log(`  ⚠️  Line ${fix.line}: Array.from with length needs manual fix`);
            console.log(`     Suggested replacement with for loop`);
            continue;
          } else {
            // Simple Array.from replacement
            content = content.replace(/Array\.from\s*\(/g, 'safeArrayFrom(');
            modified = true;
            console.log(`  ✅ Line ${fix.line}: Replaced Array.from with safeArrayFrom`);
          }
        } else {
          // Apply other fixes
          const oldPattern = new RegExp(fix.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
          if (content.includes(fix.old)) {
            content = content.replace(oldPattern, fix.new);
            modified = true;
            console.log(`  ✅ Line ${fix.line}: Applied ${fix.note}`);
          }
        }
      }
      
      if (modified) {
        // Check if safeArrayFrom import is needed
        if (content.includes('safeArrayFrom(') && !content.includes("from '@/utils/safeArray'")) {
          // Add import at the top of the file
          const importStatement = "import { safeArrayFrom } from '@/utils/safeArray';\n";
          
          // Find the right place to add the import
          const firstImportIndex = content.indexOf('import ');
          if (firstImportIndex !== -1) {
            // Find the end of the last import statement
            let lastImportEnd = firstImportIndex;
            let currentIndex = firstImportIndex;
            
            while (currentIndex !== -1) {
              const nextImport = content.indexOf('\nimport ', currentIndex + 1);
              if (nextImport === -1) break;
              currentIndex = nextImport + 1;
              lastImportEnd = content.indexOf('\n', currentIndex) + 1;
            }
            
            if (lastImportEnd === -1) {
              lastImportEnd = content.indexOf('\n', currentIndex) + 1;
            }
            
            content = content.slice(0, lastImportEnd) + importStatement + content.slice(lastImportEnd);
            console.log(`  ✅ Added safeArrayFrom import`);
          }
        }
        
        // Write the modified content back
        await fs.writeFile(filePath, content);
        console.log(`  💾 Saved changes to ${path.basename(filePath)}\n`);
      } else {
        console.log(`  ℹ️  No automatic fixes applied\n`);
      }
    }
    
    console.log('✅ Array safety fixes applied!');
    console.log('\n⚠️  Please review the changes and test your application.');
    console.log('Some Array.from patterns with { length: N } need manual fixes.');
    
  } catch (error) {
    console.error('❌ Error applying fixes:', error);
    process.exit(1);
  }
}

// Run the fix application
applyFixes();