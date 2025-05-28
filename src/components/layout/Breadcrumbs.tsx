import { ChevronRight, Home, Filter } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useEnhancedFilters } from '@/contexts/EnhancedFilterContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
  filterContext?: string;
}

const getPageInfo = (pathname: string): { title: string; description: string } => {
  switch (pathname) {
    case '/':
      return { 
        title: 'Transaction Trends', 
        description: 'Overview of sales performance and key metrics' 
      };
    case '/product-mix':
      return { 
        title: 'Product Mix & SKU', 
        description: 'Product performance and inventory analysis' 
      };
    case '/consumer-insights':
      return { 
        title: 'Consumer Insights', 
        description: 'Customer demographics and behavior patterns' 
      };
    default:
      return { title: 'Dashboard', description: '' };
  }
};

const getFilterSummary = (filters: any): string[] => {
  const summary: string[] = [];
  
  if (filters.ageGroups && filters.ageGroups.length > 0) {
    summary.push(`Age: ${filters.ageGroups.join(', ')}`);
  }
  
  if (filters.genders && filters.genders.length > 0) {
    summary.push(`Gender: ${filters.genders.join(', ')}`);
  }
  
  if (filters.brands && filters.brands.length > 0) {
    summary.push(`Brand: ${filters.brands.join(', ')}`);
  }
  
  if (filters.categories && filters.categories.length > 0) {
    summary.push(`Category: ${filters.categories.join(', ')}`);
  }
  
  if (filters.location && filters.location !== 'All') {
    summary.push(`Location: ${filters.location}`);
  }
  
  return summary;
};

export function Breadcrumbs() {
  const location = useLocation();
  const { filters } = useEnhancedFilters();
  const pageInfo = getPageInfo(location.pathname);
  const filterSummary = getFilterSummary(filters);
  const hasFilters = filterSummary.length > 0;

  const breadcrumbItems: BreadcrumbItem[] = [
    {
      label: 'Dashboard',
      href: '/',
      current: location.pathname === '/'
    }
  ];

  // Add current page if not dashboard
  if (location.pathname !== '/') {
    breadcrumbItems.push({
      label: pageInfo.title,
      current: true
    });
  }

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 py-3 text-sm">
          <Home className="h-4 w-4 text-gray-500" />
          {(breadcrumbItems ?? []).map((item, index) => (
            <div key={item.label} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
              )}
              {item.current ? (
                <span className="font-medium text-gray-900">{item.label}</span>
              ) : (
                <Link
                  to={item.href!}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Page Title and Description */}
        <div className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {pageInfo.title}
              </h1>
              {pageInfo.description && (
                <p className="text-gray-600 mt-1">{pageInfo.description}</p>
              )}
            </div>
            
            {/* Filter Context Indicator */}
            {hasFilters && (
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-600 font-medium">
                  {filterSummary.length} filter{filterSummary.length !== 1 ? 's' : ''} applied
                </span>
              </div>
            )}
          </div>
          
          {/* Active Filters Display */}
          {hasFilters && (
            <div className="mt-3 flex flex-wrap gap-2">
              {(filterSummary ?? []).map((filter, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="bg-blue-50 text-blue-700 border-blue-200"
                >
                  {filter}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact breadcrumbs for smaller screens or inline use
 */
export function CompactBreadcrumbs({ className }: { className?: string }) {
  const location = useLocation();
  const { filters } = useEnhancedFilters();
  const pageInfo = getPageInfo(location.pathname);
  const filterSummary = getFilterSummary(filters);
  const hasFilters = filterSummary.length > 0;

  return (
    <div className={cn("flex items-center space-x-2 text-sm", className)}>
      <Link to="/" className="text-gray-500 hover:text-gray-700">
        <Home className="h-4 w-4" />
      </Link>
      
      {location.pathname !== '/' && (
        <>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <span className="font-medium text-gray-900">{pageInfo.title}</span>
        </>
      )}
      
      {hasFilters && (
        <>
          <div className="flex items-center space-x-1 ml-2">
            <Filter className="h-3 w-3 text-blue-600" />
            <Badge variant="secondary" className="text-xs">
              {filterSummary.length}
            </Badge>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Breadcrumb hook for programmatic access to breadcrumb data
 */
export const useBreadcrumbs = () => {
  const location = useLocation();
  const { filters } = useEnhancedFilters();
  
  const pageInfo = getPageInfo(location.pathname);
  const filterSummary = getFilterSummary(filters);
  const hasFilters = filterSummary.length > 0;
  
  return {
    currentPage: pageInfo,
    filters: filterSummary,
    hasActiveFilters: hasFilters,
    filterCount: filterSummary.length
  };
};