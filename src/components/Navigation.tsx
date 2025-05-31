
import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  TrendingUp,
  Package,
  Users,
  ShoppingCart,
  Brain,
  Settings,
  Zap
} from "lucide-react"
import { FEATURE_FLAGS } from "@/config/features"

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard, feature: 'DASHBOARD_OVERVIEW' },
  { href: "/sprint4", label: "Advanced Analytics", icon: Zap, feature: null, highlight: true },
  { href: "/trends", label: "Trends Explorer", icon: TrendingUp, feature: 'TRENDS_PAGE' },
  { href: "/product-insights", label: "Product Insights", icon: Package, feature: 'PRODUCT_INSIGHTS' },
  { href: "/consumer-insights", label: "Customer Insights", icon: Users, feature: 'CONSUMER_INSIGHTS' },
  { href: "/basket-behavior", label: "Basket Behavior", icon: ShoppingCart, feature: 'BASKET_BEHAVIOR' },
  { href: "/ai-recommendations", label: "AI Recs", icon: Brain, feature: 'AI_RECOMMENDATIONS' },
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
              const isActive = location.pathname === item.href || 
                (item.href === '/sprint4' && location.pathname === '/advanced-analytics')
              const isHighlight = item.highlight
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={
                    `flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 relative ` +
                    (isActive
                      ? (isHighlight ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white" : "bg-blue-50 text-blue-700")
                      : (isHighlight ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 hover:from-blue-200 hover:to-purple-200" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"))
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {isHighlight && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      ✨
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
