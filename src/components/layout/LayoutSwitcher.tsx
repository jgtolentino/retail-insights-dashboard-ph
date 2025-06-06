import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { SimpleCruipLayout } from './SimpleCruipLayout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Settings } from 'lucide-react';

interface LayoutSwitcherProps {
  children: React.ReactNode;
}

export function LayoutSwitcher({ children }: LayoutSwitcherProps) {
  const [useCruipLayout, setUseCruipLayout] = useState(() => {
    const stored = localStorage.getItem('use-cruip-layout');
    return stored ? JSON.parse(stored) : false;
  });

  const handleLayoutToggle = (checked: boolean) => {
    setUseCruipLayout(checked);
    localStorage.setItem('use-cruip-layout', JSON.stringify(checked));
  };

  const LayoutComponent = useCruipLayout ? SimpleCruipLayout : Layout;

  return (
    <>
      {/* Layout Toggle - Fixed position */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3">
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Cruip Layout
            </span>
            <Switch 
              checked={useCruipLayout} 
              onCheckedChange={handleLayoutToggle}
              aria-label="Toggle Cruip layout"
            />
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <LayoutComponent>
        {children}
      </LayoutComponent>
    </>
  );
}

export default LayoutSwitcher;