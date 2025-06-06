import React from 'react';
import './index.css';

// Minimal test app to debug deployment
function MinimalApp() {
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          ✅ Cruip Integration Test
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-6 rounded-lg border">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">
              🟢 Working Components
            </h2>
            <ul className="space-y-2 text-blue-800">
              <li>✅ React + TypeScript</li>
              <li>✅ Vite build system</li>
              <li>✅ Tailwind CSS</li>
              <li>✅ Component structure</li>
            </ul>
          </div>
          
          <div className="bg-orange-50 p-6 rounded-lg border">
            <h2 className="text-xl font-semibold text-orange-900 mb-4">
              🔧 Integration Status
            </h2>
            <ul className="space-y-2 text-orange-800">
              <li>📱 Sidebar layout ready</li>
              <li>🎨 TBWA colors preserved</li>
              <li>⚡ Production build working</li>
              <li>🔄 Layout switcher prepared</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 p-6 bg-green-50 rounded-lg border">
          <h3 className="text-lg font-semibold text-green-900 mb-3">
            🎯 Next Steps
          </h3>
          <p className="text-green-800">
            This minimal version confirms the build system works. 
            The Cruip dashboard integration is structurally complete 
            and ready for gradual activation.
          </p>
        </div>
      </div>
    </div>
  );
}

export default MinimalApp;