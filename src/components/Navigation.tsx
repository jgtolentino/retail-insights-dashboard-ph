
import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  Package,
  BarChart3,
  Users,
  TrendingUp,
  Settings
} from "lucide-react"
import { FEATURE_FLAGS } from "@/config/features"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, feature: 'DASHBOARD_OVERVIEW' },
  { href: "/product-mix", label: "Products", icon: Package, feature: 'PRODUCT_MIX' },
  { href: "/brands", label: "Brands", icon: BarChart3, feature: 'BRANDS_PAGE' },
  { href: "/consumer-insights", label: "Consumers", icon: Users, feature: 'CONSUMER_INSIGHTS' },
  { href: "/trends", label: "Trends", icon: TrendingUp, feature: 'TRENDS_PAGE' },
  { href: "/settings", label: "Settings", icon: Settings, feature: 'SETTINGS_PAGE' },
].filter(item => !item.feature || FEATURE_FLAGS[item.feature as keyof typeof FEATURE_FLAGS])

export function Navigation() {
  const location = useLocation()

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <h1 className="text-xl font-bold text-gray-900">
            Retail Insights PH
          </h1>
          <div className="flex space-x-1">
            {navItems.map(item => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={
                    `flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ` +
                    (isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900")
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
