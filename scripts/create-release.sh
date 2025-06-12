#!/bin/bash

# Create GitHub release for v1.2.0
# This script tags and publishes the release with all Track A improvements

set -e

VERSION="v1.2.0"
RELEASE_TITLE="v1.2.0 - Security & Developer Experience"

RELEASE_NOTES=$(cat << 'EOF'
## 🚀 What's New in v1.2.0

### 🔒 Security Enhancements
- Removed exposed secrets from git tracking
- Added automated security checks in CI
- Improved .gitignore patterns for env files
- Added BFG cleanup instructions

### 👨‍💻 Developer Experience
- Added pre-commit hooks with Husky
- Integrated lint-staged for automatic code formatting
- Added smart auto-fix script (`npm run auto-fix`)
- Updated to Node.js 20+ requirement

### 🧪 Testing & Quality
- Added accessibility tests with Playwright
- Integrated Lighthouse CI for performance monitoring
- Added GitHub Actions CI pipeline
- Improved test coverage

### 📚 Documentation
- Updated README with Node 20+ requirement
- Added Vite port 5173 configuration details
- Documented auto-fix usage
- Added security best practices section

### 🛠️ Code Organization
- Organized SQL migrations into proper directories
- Archived branding-specific files
- Cleaned up project structure
- Fixed zustand import issues

## 📋 Breaking Changes
- Node.js 20+ is now required (was 18+)
- Some Pulser-specific files moved to archive

## 🔧 How to Upgrade

1. Update Node.js to version 20 or higher
2. Run `npm install` to update dependencies
3. Run `npm run auto-fix` to clean up your local environment
4. Check `SMART-FIX-REPORT.md` for any required actions

## 🙏 Credits
Thanks to all contributors who helped identify and fix security issues!
EOF
)

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "❌ Must be on main branch to create release"
    echo "Current branch: $CURRENT_BRANCH"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "❌ Uncommitted changes detected. Please commit or stash them first."
    exit 1
fi

# Create and push tag
echo "📍 Creating tag $VERSION..."
git tag -a "$VERSION" -m "$RELEASE_TITLE"
git push origin "$VERSION"

# Create GitHub release
echo "📦 Creating GitHub release..."
gh release create "$VERSION" \
    --title "$RELEASE_TITLE" \
    --notes "$RELEASE_NOTES" \
    --target main

echo "✅ Release $VERSION created successfully!"
echo "🔗 View at: https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/releases/tag/$VERSION"