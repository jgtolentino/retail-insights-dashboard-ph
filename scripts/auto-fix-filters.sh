#!/bin/bash
# Auto-fix common filter safety patterns
# Run with: ./scripts/auto-fix-filters.sh

echo "🔧 Auto-fixing filter safety issues..."
echo "⚠️  IMPORTANT: Review all changes before committing!"

# Create backup
BACKUP_DIR="./backup-$(date +%Y%m%d_%H%M%S)"
echo "📦 Creating backup in $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"
cp -r src/ "$BACKUP_DIR/"

# Counter for fixes
FIXES_APPLIED=0

# Fix 1: Unsafe .length access
echo ""
echo "🔧 Fixing unsafe .length access..."
find src/ -name "*.ts" -o -name "*.tsx" | while read file; do
  # Skip if already has optional chaining
  if grep -q "\.length\b" "$file" && ! grep -q "?\.length" "$file"; then
    # Use sed to fix the pattern
    sed -i.bak 's/\([a-zA-Z_][a-zA-Z0-9_]*\)\.length\b/\1?.length ?? 0/g' "$file"
    if [ $? -eq 0 ]; then
      echo "   ✅ Fixed: $file"
      FIXES_APPLIED=$((FIXES_APPLIED + 1))
    fi
    # Remove backup file
    rm -f "$file.bak"
  fi
done

# Fix 2: Unsafe .map calls  
echo ""
echo "🔧 Fixing unsafe .map calls..."
find src/ -name "*.ts" -o -name "*.tsx" | while read file; do
  # Check for .map without null safety
  if grep -q "\.map(" "$file" && ! grep -q "??" "$file"; then
    # More conservative approach - only fix obvious cases
    sed -i.bak 's/\([a-zA-Z_][a-zA-Z0-9_]*\)\.map(/(\1 ?? []).map(/g' "$file"
    if [ $? -eq 0 ]; then
      echo "   ✅ Fixed: $file"
      FIXES_APPLIED=$((FIXES_APPLIED + 1))
    fi
    rm -f "$file.bak"
  fi
done

# Fix 3: Unsafe .filter calls
echo ""
echo "🔧 Fixing unsafe .filter calls..."
find src/ -name "*.ts" -o -name "*.tsx" | while read file; do
  if grep -q "\.filter(" "$file" && ! grep -q "??" "$file"; then
    sed -i.bak 's/\([a-zA-Z_][a-zA-Z0-9_]*\)\.filter(/(\1 ?? []).filter(/g' "$file"
    if [ $? -eq 0 ]; then
      echo "   ✅ Fixed: $file"
      FIXES_APPLIED=$((FIXES_APPLIED + 1))
    fi
    rm -f "$file.bak"
  fi
done

# Fix 4: Remove Array.from workarounds
echo ""
echo "🔧 Removing Array.from workarounds..."
find src/ -name "*.ts" -o -name "*.tsx" | while read file; do
  if grep -q "Array\.from.*||.*\[\]" "$file"; then
    sed -i.bak 's/Array\.from(\([^)]*\)\s*||\s*\[\])/\1 ?? []/g' "$file"
    if [ $? -eq 0 ]; then
      echo "   ✅ Fixed: $file"
      FIXES_APPLIED=$((FIXES_APPLIED + 1))
    fi
    rm -f "$file.bak"
  fi
done

# Fix 5: Add optional chaining for array access
echo ""
echo "🔧 Fixing unsafe array indexing..."
find src/ -name "*.ts" -o -name "*.tsx" | while read file; do
  if grep -q "\[[0-9]\]" "$file" && ! grep -q "?\.\[" "$file"; then
    sed -i.bak 's/\([a-zA-Z_][a-zA-Z0-9_]*\)\[\([0-9]\)\]/\1?.[[\2]]/g' "$file"
    if [ $? -eq 0 ]; then
      echo "   ✅ Fixed: $file"
      FIXES_APPLIED=$((FIXES_APPLIED + 1))
    fi
    rm -f "$file.bak"
  fi
done

# Run safety scanner to check results
echo ""
echo "🔍 Running safety scanner to verify fixes..."
if [ -f "scripts/filter-safety-scanner.js" ]; then
  node scripts/filter-safety-scanner.js
else
  echo "⚠️  Safety scanner not found, skipping verification"
fi

# Check TypeScript compilation
echo ""
echo "🔍 Checking TypeScript compilation..."
if command -v tsc &> /dev/null; then
  if npx tsc --noEmit; then
    echo "✅ TypeScript compilation successful"
  else
    echo "❌ TypeScript compilation failed - review fixes"
    echo "💡 You may need to adjust some fixes manually"
  fi
else
  echo "⚠️  TypeScript not available, skipping compilation check"
fi

# Summary
echo ""
echo "📊 Auto-fix Summary:"
echo "   Files processed: $(find src/ -name "*.ts" -o -name "*.tsx" | wc -l)"
echo "   Fixes applied: $FIXES_APPLIED (estimated)"
echo "   Backup location: $BACKUP_DIR"

echo ""
echo "🔍 Next Steps:"
echo "1. Review all changes carefully"
echo "2. Run tests: npm test"
echo "3. Run safety scanner: node scripts/filter-safety-scanner.js"
echo "4. Commit changes if satisfied"
echo "5. Remove backup if not needed: rm -rf $BACKUP_DIR"

echo ""
echo "⚠️  IMPORTANT NOTES:"
echo "- Some fixes may need manual adjustment"
echo "- Test all functionality after applying fixes"
echo "- The scanner may still show issues that need manual review"
echo "- Critical SQL injection warnings need manual review"