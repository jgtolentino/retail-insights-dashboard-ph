import React, { useState } from 'react';
import { CruipHeader } from './CruipHeader';
import { CruipSidebar } from './CruipSidebar';

interface CruipLayoutProps {
  children: React.ReactNode;
  variant?: 'default' | 'v2' | 'v3';
}

export function CruipLayout({ 
  children, 
  variant = 'default' 
}: CruipLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <CruipSidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        variant={variant}
      />

      {/* Content area */}
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {/* Site header */}
        <CruipHeader 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen}
          variant={variant}
        />

        {/* Main content */}
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default CruipLayout;