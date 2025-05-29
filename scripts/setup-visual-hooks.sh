#!/bin/bash

# Setup Visual Documentation Git Hooks
echo "🔧 Setting up visual documentation Git hooks..."

# Create .husky directory if it doesn't exist
if [ ! -d ".husky" ]; then
    echo "📁 Creating .husky directory..."
    mkdir -p .husky
fi

# Create post-commit hook for automatic visual capture
echo "📝 Creating post-commit hook..."
cat > .husky/post-commit << 'EOF'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Get the commit message
commit_msg=$(git log -1 --pretty=%B)

# Check if commit message indicates task completion
if echo "$commit_msg" | grep -E "(feat:|fix:|DONE:|✅|closes #[0-9]+|visual|screenshot)" > /dev/null; then
    echo "📸 Task completion detected, capturing visual documentation..."
    
    # Check if we have the dependencies
    if command -v npm > /dev/null && [ -f "package.json" ]; then
        # Only capture if preview server can start
        if npm run preview > /dev/null 2>&1 &
        then
            PREVIEW_PID=$!
            sleep 5
            
            # Run visual capture
            npm run capture:visuals
            
            # Stop preview server
            kill $PREVIEW_PID 2>/dev/null || true
            
            # Add visual docs to commit if they were generated
            if [ -d "visual-docs" ] && [ "$(ls -A visual-docs 2>/dev/null)" ]; then
                echo "📁 Adding visual documentation to repository..."
                git add visual-docs/
                
                # Amend the commit to include visual docs (only if we can do so safely)
                if git diff --cached --quiet; then
                    echo "✅ Visual documentation generated but no changes to commit"
                else
                    git commit --amend --no-edit --no-verify
                    echo "✅ Visual documentation added to commit"
                fi
            fi
        else
            echo "⚠️ Could not start preview server, skipping visual capture"
        fi
    else
        echo "⚠️ npm or package.json not found, skipping visual capture"
    fi
else
    echo "ℹ️ No task completion markers found in commit message, skipping visual capture"
fi
EOF

# Make the hook executable
chmod +x .husky/post-commit

# Create prepare-commit-msg hook for commit message templates
echo "📝 Creating prepare-commit-msg hook..."
cat > .husky/prepare-commit-msg << 'EOF'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

commit_file=$1
commit_source=$2

# Only add template for regular commits (not amend, merge, etc.)
if [ -z "$commit_source" ]; then
    # Check if this might be a task completion
    staged_files=$(git diff --cached --name-only)
    
    if echo "$staged_files" | grep -E "(src/|components/|pages/)" > /dev/null; then
        # Add visual documentation reminder to commit message template
        echo "
# 📸 Visual Documentation
# Use these prefixes to trigger automatic visual capture:
# feat: ✅ - New feature completed
# fix: ✅ - Bug fix completed  
# DONE: - Task completed
# closes #123 - Issue resolved
#
# Examples:
# feat: ✅ implement hierarchical brand visualization
# fix: DONE - resolve dashboard loading issue
# feat: closes #123 - add consumer insights page" >> "$commit_file"
    fi
fi
EOF

chmod +x .husky/prepare-commit-msg

# Create a simple commit-msg hook for validation
echo "📝 Creating commit-msg hook..."
cat > .husky/commit-msg << 'EOF'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

commit_msg=$(cat $1)

# Check for task completion patterns and remind about visual docs
if echo "$commit_msg" | grep -E "(feat:|fix:|DONE:|✅|closes #[0-9]+)" > /dev/null; then
    echo "📸 Task completion detected! Visual documentation will be captured automatically."
fi
EOF

chmod +x .husky/commit-msg

# Create husky install helper if needed
if [ ! -f ".husky/_/husky.sh" ]; then
    echo "📦 Installing husky..."
    npm install -D husky
    npx husky install
fi

echo "✅ Visual documentation Git hooks setup complete!"
echo ""
echo "🎯 Usage:"
echo "  - Commit with 'feat: ✅' to trigger visual capture"
echo "  - Use 'fix: DONE' for completed bug fixes"
echo "  - Use 'closes #123' for resolved issues"
echo "  - Visual docs will be automatically captured and committed"
echo ""
echo "📁 Generated files will be saved to:"
echo "  - ./visual-docs/ - Screenshots and documentation"
echo "  - Automatically committed to your repository"