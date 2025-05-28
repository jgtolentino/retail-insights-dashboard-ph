
import { ReactNode } from "react"
import { Navigation } from "./Navigation"

interface LayoutProps { 
  children: ReactNode 
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto p-4">{children}</main>
    </div>
  )
}
