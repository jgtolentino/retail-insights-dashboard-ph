
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
      
      <div className="max-w-7xl mx-auto mt-4">
        <GlobalFiltersPanel />
      </div>
      
      <main className="max-w-7xl mx-auto p-4">{children}</main>
    </div>
  )
}
