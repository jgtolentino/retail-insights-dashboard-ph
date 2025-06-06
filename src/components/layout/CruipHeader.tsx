import React, { useState } from 'react';
import { Search, Menu, X, Bell, HelpCircle, User, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
// import { useTheme } from 'next-themes';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  variant?: 'default' | 'v2' | 'v3';
}

export function CruipHeader({
  sidebarOpen,
  setSidebarOpen,
  variant = 'default',
}: HeaderProps) {
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [theme, setTheme] = useState('light'); // Simple theme state for now

  return (
    <header className={`sticky top-0 before:absolute before:inset-0 before:backdrop-blur-md max-lg:before:bg-white/90 dark:max-lg:before:bg-gray-800/90 before:-z-10 z-30 ${variant === 'v2' || variant === 'v3' ? 'before:bg-white after:absolute after:h-px after:inset-x-0 after:top-full after:bg-gray-200 dark:after:bg-gray-700/60 after:-z-10' : 'max-lg:shadow-xs lg:before:bg-gray-100/90 dark:lg:before:bg-gray-900/90'} ${variant === 'v2' ? 'dark:before:bg-gray-800' : ''} ${variant === 'v3' ? 'dark:before:bg-gray-900' : ''}`}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between h-16 ${variant === 'v2' || variant === 'v3' ? '' : 'lg:border-b border-gray-200 dark:border-gray-700/60'}`}>

          {/* Header: Left side */}
          <div className="flex items-center">
            {/* Hamburger button */}
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 lg:hidden p-2"
              aria-controls="sidebar"
              aria-expanded={sidebarOpen}
              onClick={(e) => { e.stopPropagation(); setSidebarOpen(!sidebarOpen); }}
            >
              <span className="sr-only">Open sidebar</span>
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>

            {/* Page Title */}
            <h1 className="ml-4 text-xl font-semibold text-gray-900 dark:text-gray-100 lg:block hidden">
              Retail Insights Dashboard
            </h1>
          </div>

          {/* Header: Right side */}
          <div className="flex items-center space-x-3">
            {/* Search */}
            <Button
              variant="ghost"
              size="sm"
              className={`w-8 h-8 p-0 hover:bg-gray-100 lg:hover:bg-gray-200 dark:hover:bg-gray-700/50 dark:lg:hover:bg-gray-800 ${searchModalOpen && 'bg-gray-200 dark:bg-gray-800'}`}
              onClick={(e) => { e.stopPropagation(); setSearchModalOpen(true); }}
              aria-controls="search-modal"
            >
              <span className="sr-only">Search</span>
              <Search className="w-4 h-4 text-gray-500/80 dark:text-gray-400/80" />
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700/50"
            >
              <span className="sr-only">Notifications</span>
              <Bell className="w-4 h-4 text-gray-500/80 dark:text-gray-400/80" />
            </Button>

            {/* Help */}
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700/50"
            >
              <span className="sr-only">Help</span>
              <HelpCircle className="w-4 h-4 text-gray-500/80 dark:text-gray-400/80" />
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <span className="sr-only">Toggle theme</span>
              {theme === 'dark' ? 
                <Sun className="w-4 h-4 text-gray-500/80 dark:text-gray-400/80" /> : 
                <Moon className="w-4 h-4 text-gray-500/80 dark:text-gray-400/80" />
              }
            </Button>

            {/* Divider */}
            <hr className="w-px h-6 bg-gray-200 dark:bg-gray-700/60 border-none" />

            {/* User Menu */}
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700/50"
            >
              <span className="sr-only">User menu</span>
              <User className="w-4 h-4 text-gray-500/80 dark:text-gray-400/80" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default CruipHeader;