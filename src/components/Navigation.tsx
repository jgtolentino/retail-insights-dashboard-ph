import { Link, useLocation } from 'react-router-dom';
import {
  Eye,
  Search,
  Map,
  Lightbulb,
  Target,
  ShoppingCart,
  Brain,
  Settings,
  Zap,
  Activity,
  Database,
  TrendingUp,
  Package,
  Users,
} from 'lucide-react';
import { FEATURE_FLAGS } from '@/config/features';

const navItems = [
  // New Power BI Storytelling Structure
  {
    href: '/',
    label: "What's Happening",
    icon: Eye,
    feature: null,
    section: 'primary',
    subtitle: 'Real-time Overview',
  },
  {
    href: '/data-health',
    label: 'Why Is This Happening?',
    icon: Search,
    feature: null,
    section: 'primary',
    subtitle: 'Data Health & Diagnostics',
  },
  {
    href: '/geospatial-performance',
    label: 'Regional Performance',
    icon: Map,
    feature: null,
    section: 'primary',
    subtitle: 'Geographic Analysis',
  },
  {
    href: '/product-trends',
    label: 'Product Opportunities',
    icon: Package,
    feature: null,
    section: 'insights',
    subtitle: 'What Can Be Done?',
  },
  {
    href: '/consumer-segments',
    label: 'Customer Targeting',
    icon: Target,
    feature: null,
    section: 'insights',
    subtitle: 'What Can Be Done?',
  },
  {
    href: '/basket-analysis',
    label: 'Cross-Selling',
    icon: ShoppingCart,
    feature: null,
    section: 'insights',
    subtitle: 'What Can Be Done?',
  },
  {
    href: '/ai-insights',
    label: 'Predictions',
    icon: Brain,
    feature: null,
    section: 'future',
    subtitle: 'What Will Happen Next?',
  },

  // Specialized Dashboards
  {
    href: '/tbwa',
    label: 'TBWA Dashboard',
    icon: Lightbulb,
    feature: null,
    section: 'special',
    tbwa: true,
  },
  {
    href: '/sprint4',
    label: 'Advanced Analytics',
    icon: Zap,
    feature: null,
    section: 'special',
    highlight: true,
  },

  // Settings and Legacy
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
    feature: 'SETTINGS_PAGE',
    section: 'admin',
  },
].filter(item => !item.feature || FEATURE_FLAGS[item.feature as keyof typeof FEATURE_FLAGS]);

export function Navigation() {
  const location = useLocation();

  const getSectionColor = (section: string, isActive: boolean) => {
    switch (section) {
      case 'primary':
        return isActive
          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
          : 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 hover:from-blue-100 hover:to-cyan-100';
      case 'insights':
        return isActive
          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
          : 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 hover:from-green-100 hover:to-emerald-100';
      case 'future':
        return isActive
          ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white'
          : 'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 hover:from-purple-100 hover:to-indigo-100';
      case 'special':
        return isActive
          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
          : 'bg-gradient-to-r from-orange-50 to-red-50 text-orange-700 hover:from-orange-100 hover:to-red-100';
      default:
        return isActive
          ? 'bg-gray-100 text-gray-900'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900';
    }
  };

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Retail Insights PH</h1>
            <p className="text-xs text-gray-500">Power BI Style Analytics Dashboard</p>
          </div>
          <div className="flex space-x-1 overflow-x-auto">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.href ||
                (item.href === '/sprint4' && location.pathname === '/advanced-analytics') ||
                (item.href === '/geospatial-performance' &&
                  (location.pathname === '/dashboard-preview' ||
                    location.pathname === '/filter-preview')) ||
                (item.href === '/tbwa' && location.pathname === '/tbwa-dashboard') ||
                (item.href === '/data-health' &&
                  (location.pathname === '/project-scout' || location.pathname === '/iot'));
              const isHighlight = (item as any).highlight;
              const isTBWA = (item as any).tbwa;
              const section = (item as any).section || 'default';

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={
                    `relative flex min-w-max flex-col items-center justify-center rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 ` +
                    (isTBWA && isActive
                      ? 'bg-gradient-to-r from-tbwa-blue to-tbwa-orange text-white'
                      : isTBWA && !isActive
                        ? 'bg-gradient-to-r from-orange-100 to-blue-100 text-orange-800 hover:from-orange-200 hover:to-blue-200'
                        : getSectionColor(section, isActive))
                  }
                  title={(item as any).subtitle || item.label}
                >
                  <Icon className="mb-1 h-4 w-4" />
                  <span className="text-center leading-tight">{item.label}</span>
                  {isHighlight && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                      ✨
                    </span>
                  )}
                  {isTBWA && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-xs text-white">
                      T
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
