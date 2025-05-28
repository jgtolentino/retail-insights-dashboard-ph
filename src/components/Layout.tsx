
import { ReactNode } from "react"
import { Navigation } from "./Navigation"
import { GlobalFiltersPanel } from "./GlobalFiltersPanel"

interface LayoutProps { 
  children: ReactNode 
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Global filters panel - available on every page */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <GlobalFiltersPanel />
      </div>
      
      <main className="max-w-7xl mx-auto p-4">{children}</main>
    </div>
  )
}
