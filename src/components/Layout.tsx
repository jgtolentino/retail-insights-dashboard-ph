import { ReactNode } from 'react';
import { Navigation } from './Navigation';
import { GlobalFiltersPanel } from './GlobalFiltersPanel';
import { Footer } from './layout/Footer';
import { DatabaseStatus } from './DatabaseStatus';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navigation />

      <div className="mx-auto mt-4 w-full max-w-7xl px-4">
        <GlobalFiltersPanel />
      </div>

      <main className="mx-auto w-full max-w-7xl flex-1 p-4">{children}</main>

      <Footer />
      <DatabaseStatus />
    </div>
  );
}
