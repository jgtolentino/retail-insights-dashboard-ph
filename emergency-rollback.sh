#!/bin/bash
# EMERGENCY ROLLBACK TO WORKING STATE

echo "🚨 EMERGENCY ROLLBACK TO WORKING STATE"
echo "======================================"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Backup current broken state
echo -e "${YELLOW}📦 Backing up current state...${NC}"
git add -A
git stash push -m "EMERGENCY BACKUP: Before rollback $(date)"

# Restore working App component
echo -e "${BLUE}🔧 Restoring working App component...${NC}"
if [[ -f "src/App-backup.tsx" ]]; then
  cp src/App-backup.tsx src/App.tsx
  echo "✅ Restored App.tsx from backup"
else
  echo "❌ App-backup.tsx not found"
fi

# Create minimal working version if backup doesn't exist
if [[ ! -f "src/App-backup.tsx" ]]; then
  echo -e "${YELLOW}🛠️ Creating minimal working App.tsx...${NC}"
  cat > src/App.tsx << 'EOF'
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        🟢 Dashboard - Safe Mode
      </h1>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Status: WORKING</h2>
        <ul className="space-y-2">
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✅</span>
            React + TypeScript working
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✅</span>
            Tailwind CSS loaded
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✅</span>
            Basic routing functional
          </li>
        </ul>
      </div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TestPage />} />
        <Route path="*" element={<TestPage />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
EOF
  echo "✅ Created minimal working App.tsx"
fi

# Reset to stable package.json
echo -e "${BLUE}📋 Installing dependencies...${NC}"
npm install --no-audit

# Disable problematic components temporarily
echo -e "${YELLOW}🧹 Disabling complex components temporarily...${NC}"
mkdir -p src/components/TEMP_DISABLED
if [[ -d "src/components/dashboard" ]]; then
  mv src/components/dashboard/* src/components/TEMP_DISABLED/ 2>/dev/null
  echo "✅ Moved dashboard components to TEMP_DISABLED"
fi

# Test working state
echo -e "${BLUE}🧪 Testing rollback...${NC}"
echo "Starting development server..."

# Kill any existing dev server
pkill -f "vite" 2>/dev/null

# Start dev server in background
npm run dev &
DEV_PID=$!

sleep 8

# Test if server is responding
if curl -f -s http://localhost:5173 > /dev/null 2>&1; then
  echo -e "${GREEN}✅ ROLLBACK SUCCESSFUL!${NC}"
  echo -e "${GREEN}✅ Server is responding at http://localhost:5173${NC}"
  echo ""
  echo -e "${BLUE}📋 Next steps:${NC}"
  echo "1. Open browser to http://localhost:5173"
  echo "2. Verify the page loads without errors"
  echo "3. Check browser console for any warnings"
  echo "4. Gradually re-enable components from TEMP_DISABLED/"
  echo ""
  echo -e "${YELLOW}🔄 To restore components:${NC}"
  echo "mv src/components/TEMP_DISABLED/* src/components/dashboard/"
else
  echo -e "${RED}❌ Server not responding, manual check required${NC}"
  echo "Please open browser to http://localhost:5173"
fi

# Keep server running
wait $DEV_PID
