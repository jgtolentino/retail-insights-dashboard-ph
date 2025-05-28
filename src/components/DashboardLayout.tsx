import { ReactNode } from 'react';
import { EnhancedGlobalFiltersPanel as GlobalFiltersPanel } from '@/components/EnhancedGlobalFiltersPanel';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { TrendingUp, Package, Users, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Transaction Trends', href: '/', icon: TrendingUp },
  { name: 'Product Mix & SKU', href: '/product-mix', icon: Package },
  { name: 'Consumer Insights', href: '/consumer-insights', icon: Users },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // Preserve filters when navigating
  const handleNavigation = (href: string) => {
    const currentParams = new URLSearchParams(location.search);
    const targetPath = currentParams.toString() ? `${href}?${currentParams.toString()}` : href;
    navigate(targetPath);
  };

  const NavLinks = () => (
    <>
      {(navigation ?? []).map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;
        return (
          <button
            key={item.name}
            onClick={() => handleNavigation(item.href)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer',
              isActive
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            )}
          >
            <Icon className="h-4 w-4" />
            {item.name}
          </button>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Retail Insights Dashboard PH
              </h1>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              <NavLinks />
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <nav className="flex flex-col space-y-2 mt-6">
                    <NavLinks />
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      <Breadcrumbs />

      {/* Global Filters */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <GlobalFiltersPanel />
        </div>
      </div>

      {/* Page Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Retail Insights Dashboard PH - Powered by Dlab
          </p>
        </div>
      </footer>
    </div>
  );
}