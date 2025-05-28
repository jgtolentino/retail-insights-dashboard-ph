
import { ReactNode } from "react"
import { Navigation } from "./Navigation"
import { GlobalFiltersPanel } from "./GlobalFiltersPanel"
import { Footer } from "./layout/Footer"

interface LayoutProps { 
  children: ReactNode 
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      
      <div className="max-w-7xl mx-auto mt-4">
        <GlobalFiltersPanel />
      </div>
      
      <main className="max-w-7xl mx-auto p-4 flex-1">{children}</main>
      
      <Footer />
    </div>
  )
}
