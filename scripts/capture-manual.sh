#!/bin/bash

# Manual Visual Documentation Capture
echo "📸 Starting manual visual documentation capture..."

# Check if required dependencies are installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js and npm."
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Run from project root directory."
    exit 1
fi

# Check if visual capture dependencies are installed
if ! npm list tsx > /dev/null 2>&1; then
    echo "📦 Installing visual capture dependencies..."
    npm install -D tsx playwright nodemon wait-on
    npx playwright install chromium
fi

# Build the application
echo "🔨 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix build errors first."
    exit 1
fi

# Start preview server in background
echo "🚀 Starting preview server..."
npm run preview &
PREVIEW_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
npx wait-on http://localhost:4173 --timeout 60000

if [ $? -ne 0 ]; then
    echo "❌ Preview server failed to start"
    kill $PREVIEW_PID 2>/dev/null || true
    exit 1
fi

# Capture visuals
echo "📸 Capturing visual documentation..."
npm run capture:visuals

CAPTURE_STATUS=$?

# Stop preview server
echo "🛑 Stopping preview server..."
kill $PREVIEW_PID 2>/dev/null || true

if [ $CAPTURE_STATUS -eq 0 ]; then
    echo "✅ Visual documentation captured successfully!"
    
    if [ -d "visual-docs" ] && [ "$(ls -A visual-docs)" ]; then
        echo "📁 Generated files:"
        ls -la visual-docs/
        echo ""
        echo "📖 View documentation: open visual-docs/README.md"
        echo "🖼️  View screenshots: open visual-docs/"
        
        # Ask if user wants to commit the visual docs
        read -p "💾 Commit visual documentation to git? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git add visual-docs/
            git commit -m "docs: 📸 add visual documentation
            
Generated visual documentation for current state of dashboard.

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
            echo "✅ Visual documentation committed to git!"
        fi
    else
        echo "⚠️ No visual documentation was generated"
    fi
else
    echo "❌ Visual capture failed"
    exit 1
fi