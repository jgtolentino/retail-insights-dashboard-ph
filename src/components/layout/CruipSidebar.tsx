import React, { useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
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
  ChevronRight,
  X
} from 'lucide-react';
// import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  variant?: 'default' | 'v2' | 'v3';
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavGroup {
  name: string;
  items: NavItem[];
}

const navigation: NavGroup[] = [
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

export function CruipSidebar({
  sidebarOpen,
  setSidebarOpen,
  variant = 'default',
}: SidebarProps) {
  const location = useLocation();
  const { pathname } = location;

  const trigger = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLDivElement>(null);

  const storedSidebarExpanded = localStorage.getItem("sidebar-expanded");
  const [sidebarExpanded, setSidebarExpanded] = useState(
    storedSidebarExpanded === null ? false : storedSidebarExpanded === "true"
  );

  // Close on click outside
  useEffect(() => {
    const clickHandler = ({ target }: { target: EventTarget | null }) => {
      if (!sidebar.current || !trigger.current) return;
      if (!sidebarOpen || sidebar.current.contains(target as Node) || trigger.current.contains(target as Node)) return;
      setSidebarOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  // Close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }: { keyCode: number }) => {
      if (!sidebarOpen || keyCode !== 27) return;
      setSidebarOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  useEffect(() => {
    localStorage.setItem("sidebar-expanded", sidebarExpanded.toString());
    if (sidebarExpanded) {
      document.querySelector("body")?.classList.add("sidebar-expanded");
    } else {
      document.querySelector("body")?.classList.remove("sidebar-expanded");
    }
  }, [sidebarExpanded]);

  return (
    <div className="min-w-fit">
      {/* Sidebar backdrop (mobile only) */}
      <div
        className={cn(
          "fixed inset-0 bg-gray-900/30 z-40 lg:hidden lg:z-auto transition-opacity duration-200",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div
        id="sidebar"
        ref={sidebar}
        className={cn(
          "flex lg:flex! flex-col absolute z-40 left-0 top-0 lg:static lg:left-auto lg:top-auto lg:translate-x-0 h-[100dvh] overflow-y-scroll lg:overflow-y-auto no-scrollbar w-64 lg:w-20 lg:sidebar-expanded:!w-64 2xl:w-64! shrink-0 bg-white dark:bg-gray-800 p-4 transition-all duration-200 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-64",
          variant === 'v2' ? 'border-r border-gray-200 dark:border-gray-700/60' : 'rounded-r-2xl shadow-xs'
        )}
      >
        {/* Sidebar header */}
        <div className="flex justify-between mb-10 pr-3 sm:px-2">
          {/* Close button */}
          <button
            ref={trigger}
            className="lg:hidden text-gray-500 hover:text-gray-400"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-controls="sidebar"
            aria-expanded={sidebarOpen}
          >
            <span className="sr-only">Close sidebar</span>
            <X className="w-6 h-6" />
          </button>
          
          {/* Logo */}
          <NavLink to="/" className="block">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-tbwa-blue to-tbwa-orange rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="ml-3 text-lg font-semibold text-gray-900 dark:text-gray-100 lg:hidden lg:sidebar-expanded:block 2xl:block">
                Retail Insights
              </span>
            </div>
          </NavLink>
        </div>

        {/* Navigation */}
        <div className="space-y-8">
          {navigation.map((group) => (
            <div key={group.name}>
              <h3 className="text-xs uppercase text-gray-400 dark:text-gray-500 font-semibold pl-3">
                <span className="hidden lg:block lg:sidebar-expanded:hidden 2xl:hidden text-center w-6" aria-hidden="true">
                  •••
                </span>
                <span className="lg:hidden lg:sidebar-expanded:block 2xl:block">{group.name}</span>
              </h3>
              <ul className="mt-3 space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  
                  return (
                    <li key={item.name}>
                      <NavLink
                        to={item.href}
                        className={cn(
                          "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150",
                          isActive
                            ? "bg-tbwa-blue text-white shadow-sm"
                            : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                        )}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <Icon className={cn(
                          "w-5 h-5 shrink-0",
                          isActive ? "text-white" : "text-gray-500 dark:text-gray-400"
                        )} />
                        <span className="ml-3 lg:hidden lg:sidebar-expanded:block 2xl:block truncate">
                          {item.name}
                        </span>
                        {item.badge && (
                          <span className="ml-auto bg-tbwa-orange text-white text-xs px-2 py-0.5 rounded-full lg:hidden lg:sidebar-expanded:block 2xl:block">
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

        {/* Sidebar footer */}
        <div className="mt-auto pt-4">
          <button
            className="hidden lg:block text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 w-full"
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
          >
            <span className="sr-only">Expand / collapse sidebar</span>
            <ChevronRight className={cn(
              "w-6 h-6 mx-auto transition-transform duration-200",
              sidebarExpanded ? "rotate-180" : ""
            )} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default CruipSidebar;