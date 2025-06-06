import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  TrendingUp, 
  Package, 
  Users, 
  ShoppingCart, 
  Bot, 
  Settings, 
  BarChart3,
  Map,
  Zap,
  Menu,
  X,
  Search,
  Bell,
  HelpCircle,
  User,
  Sun,
  Moon
} from 'lucide-react';

interface SimpleCruipLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  {
    name: 'Analytics',
    items: [
      { name: 'Dashboard', href: '/', icon: Home },
      { name: 'Trends', href: '/trends', icon: TrendingUp },
      { name: 'Sprint 4', href: '/sprint4', icon: BarChart3, badge: 'New' },
      { name: 'Product Insights', href: '/product-insights', icon: Package },
      { name: 'Consumer Insights', href: '/consumer-insights', icon: Users },
    ],
  },
  {
    name: 'Advanced',
    items: [
      { name: 'Basket Behavior', href: '/basket-behavior', icon: ShoppingCart },
      { name: 'AI Recommendations', href: '/ai-recommendations', icon: Bot },
      { name: 'Client Dashboard', href: '/client', icon: BarChart3 },
      { name: 'Project Scout', href: '/project-scout', icon: Map },
    ],
  },
  {
    name: 'System',
    items: [
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

export function SimpleCruipLayout({ children }: SimpleCruipLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar backdrop (mobile only) */}
      <div
        className={`fixed inset-0 bg-gray-900/30 z-40 lg:hidden transition-opacity duration-200 ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div
        className={`flex flex-col absolute z-40 left-0 top-0 lg:static lg:translate-x-0 h-full overflow-y-auto w-64 lg:w-20 lg:hover:w-64 shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-64"
        }`}
      >
        {/* Sidebar header */}
        <div className="flex justify-between items-center p-4">
          <button
            className="lg:hidden text-gray-500 hover:text-gray-400"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
          
          <NavLink to="/" className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-orange-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="ml-3 text-lg font-semibold text-gray-900 dark:text-gray-100 lg:hidden lg:group-hover:block">
              Retail Insights
            </span>
          </NavLink>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-4 pb-4 space-y-6">
          {navigation.map((group) => (
            <div key={group.name}>
              <h3 className="text-xs uppercase text-gray-400 dark:text-gray-500 font-semibold mb-3">
                <span className="lg:hidden lg:group-hover:block">{group.name}</span>
              </h3>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  
                  return (
                    <li key={item.name}>
                      <NavLink
                        to={item.href}
                        className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-blue-500 text-white shadow-sm"
                            : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <Icon className="w-5 h-5 shrink-0" />
                        <span className="ml-3 lg:hidden lg:group-hover:block truncate">
                          {item.name}
                        </span>
                        {item.badge && (
                          <span className="ml-auto bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full lg:hidden lg:group-hover:block">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <header className="sticky top-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 z-30">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Left side */}
              <div className="flex items-center">
                <button
                  className="text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 lg:hidden p-2"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <Menu className="w-6 h-6" />
                </button>
                <h1 className="ml-4 text-xl font-semibold text-gray-900 dark:text-gray-100 hidden lg:block">
                  Retail Insights Dashboard
                </h1>
              </div>

              {/* Right side */}
              <div className="flex items-center space-x-3">
                <button className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                  <Search className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                  <Bell className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                  <HelpCircle className="w-5 h-5" />
                </button>
                <button 
                  className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
                <button className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                  <User className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default SimpleCruipLayout;