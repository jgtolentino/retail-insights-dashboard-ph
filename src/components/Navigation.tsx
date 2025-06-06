import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Package,
  Users,
  ShoppingCart,
  Brain,
  Settings,
  Zap,
  Filter,
  Target,
  Activity,
} from 'lucide-react';
import { FEATURE_FLAGS } from '@/config/features';

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard, feature: 'DASHBOARD_OVERVIEW' },
  {
    href: '/project-scout',
    label: 'Project Scout',
    icon: Activity,
    feature: null,
    highlight: true,
    iot: true,
  },
  {
    href: '/client',
    label: 'Client Dashboard',
    icon: Target,
    feature: null,
    highlight: true,
    client: true,
  },
  {
    href: '/dashboard-preview',
    label: 'Filter Preview',
    icon: Filter,
    feature: null,
    highlight: true,
  },
  { href: '/sprint4', label: 'Advanced Analytics', icon: Zap, feature: null, highlight: true },
  { href: '/trends', label: 'Trends Explorer', icon: TrendingUp, feature: 'TRENDS_PAGE' },
  {
    href: '/product-insights',
    label: 'Product Insights',
    icon: Package,
    feature: 'PRODUCT_INSIGHTS',
  },
  {
    href: '/consumer-insights',
    label: 'Customer Insights',
    icon: Users,
    feature: 'CONSUMER_INSIGHTS',
  },
  {
    href: '/basket-behavior',
    label: 'Basket Behavior',
    icon: ShoppingCart,
    feature: 'BASKET_BEHAVIOR',
  },
  { href: '/ai-recommendations', label: 'AI Recs', icon: Brain, feature: 'AI_RECOMMENDATIONS' },
  { href: '/settings', label: 'Settings', icon: Settings, feature: 'SETTINGS_PAGE' },
].filter(item => !item.feature || FEATURE_FLAGS[item.feature as keyof typeof FEATURE_FLAGS]);

export function Navigation() {
  const location = useLocation();

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Retail Insights PH</h1>
          <div className="flex space-x-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.href ||
                (item.href === '/sprint4' && location.pathname === '/advanced-analytics') ||
                (item.href === '/dashboard-preview' && location.pathname === '/filter-preview') ||
                (item.href === '/client' && location.pathname === '/client-dashboard') ||
                (item.href === '/project-scout' && location.pathname === '/iot');
              const isHighlight = item.highlight;
              const isClient = (item as any).client;
              const isIoT = (item as any).iot;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={
                    `relative flex items-center space-x-2 rounded-md px-4 py-2 text-sm font-medium transition-colors duration-200 ` +
                    (isActive
                      ? isClient
                        ? 'bg-gradient-to-r from-client-blue to-client-orange text-white'
                        : isIoT
                          ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white'
                          : isHighlight
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                            : 'bg-blue-50 text-blue-700'
                      : isClient
                        ? 'bg-gradient-to-r from-orange-100 to-blue-100 text-orange-800 hover:from-orange-200 hover:to-blue-200'
                        : isIoT
                          ? 'bg-gradient-to-r from-green-100 to-blue-100 text-green-800 hover:from-green-200 hover:to-blue-200'
                          : isHighlight
                            ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 hover:from-blue-200 hover:to-purple-200'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {isHighlight && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                      ✨
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
