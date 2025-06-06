import React, { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Loading component
const LoadingSpinner = () => (
  <div className="flex min-h-[200px] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[var(--color-primary)]"></div>
    <span className="ml-3 text-[var(--color-text-secondary)]">Loading...</span>
  </div>
);

// Loading skeleton for cards
const CardSkeleton = () => (
  <div className="animate-pulse rounded-lg bg-white p-6 shadow-md">
    <div className="mb-4 h-4 w-3/4 rounded bg-gray-200"></div>
    <div className="mb-2 h-8 w-1/2 rounded bg-gray-200"></div>
    <div className="mb-2 h-3 w-full rounded bg-gray-200"></div>
    <div className="h-3 w-2/3 rounded bg-gray-200"></div>
  </div>
);

// Loading skeleton for charts
const ChartSkeleton = () => (
  <div className="animate-pulse rounded-lg bg-white p-6 shadow-md">
    <div className="mb-6 h-4 w-1/2 rounded bg-gray-200"></div>
    <div className="h-64 rounded bg-gray-200"></div>
  </div>
);

// Loading skeleton for tables
const TableSkeleton = () => (
  <div className="animate-pulse rounded-lg bg-white p-6 shadow-md">
    <div className="mb-4 h-4 w-1/3 rounded bg-gray-200"></div>
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="grid grid-cols-4 gap-4">
          <div className="h-3 rounded bg-gray-200"></div>
          <div className="h-3 rounded bg-gray-200"></div>
          <div className="h-3 rounded bg-gray-200"></div>
          <div className="h-3 rounded bg-gray-200"></div>
        </div>
      ))}
    </div>
  </div>
);

// Enhanced loading component with different types
export const LoadingComponent: React.FC<{
  type?: 'spinner' | 'card' | 'chart' | 'table' | 'page';
  message?: string;
}> = ({ type = 'spinner', message = 'Loading...' }) => {
  switch (type) {
    case 'card':
      return <CardSkeleton />;
    case 'chart':
      return <ChartSkeleton />;
    case 'table':
      return <TableSkeleton />;
    case 'page':
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[var(--color-primary)]"></div>
            <p className="text-[var(--color-text-secondary)]">{message}</p>
          </div>
        </div>
      );
    default:
      return <LoadingSpinner />;
  }
};

// Error fallback component
const ErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({
  error,
  resetError,
}) => (
  <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
    <h2 className="mb-2 text-lg font-semibold text-red-800">Something went wrong</h2>
    <p className="mb-4 text-red-600">{error.message}</p>
    <button
      onClick={resetError}
      className="rounded bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
    >
      Try again
    </button>
  </div>
);

// HOC for lazy loading with error boundary and loading state
export const withLazyLoading = <P extends object>(
  Component: React.ComponentType<P>,
  loadingType: 'spinner' | 'card' | 'chart' | 'table' | 'page' = 'spinner',
  loadingMessage?: string
) => {
  return React.forwardRef<any, P>((props, ref) => (
    <ErrorBoundary fallback={ErrorFallback}>
      <Suspense fallback={<LoadingComponent type={loadingType} message={loadingMessage} />}>
        <Component {...props} ref={ref} />
      </Suspense>
    </ErrorBoundary>
  ));
};

// Lazy loaded page components
export const DashboardPreview = React.lazy(() => import('@/pages/DashboardPreview'));
export const ConsumerInsights = React.lazy(() => import('@/pages/ConsumerInsights'));
export const ProductMix = React.lazy(() => import('@/pages/ProductMix'));
export const Brands = React.lazy(() => import('@/pages/Brands'));
export const Trends = React.lazy(() => import('@/pages/Trends'));
export const Settings = React.lazy(() => import('@/pages/Settings'));

// Lazy loaded chart components
export const SalesByBrandChart = React.lazy(() => import('@/components/widgets/SalesByBrandChart'));
export const CustomerDensityMap = React.lazy(() => import('@/components/maps/CustomerDensityMap'));
export const RegionalSalesMap = React.lazy(() => import('@/components/maps/RegionalSalesMap'));
export const StoreLocationsMap = React.lazy(() => import('@/components/maps/StoreLocationsMap'));

// Lazy loaded table components
export const TransactionsTable = React.lazy(() => import('@/components/widgets/TransactionsTable'));

// Wrapped components with loading states
export const LazyDashboardPreview = withLazyLoading(
  DashboardPreview,
  'page',
  'Loading dashboard...'
);
export const LazyConsumerInsights = withLazyLoading(
  ConsumerInsights,
  'page',
  'Loading insights...'
);
export const LazyProductMix = withLazyLoading(ProductMix, 'page', 'Loading product analysis...');
export const LazyBrands = withLazyLoading(Brands, 'page', 'Loading brand data...');
export const LazyTrends = withLazyLoading(Trends, 'page', 'Loading trends...');
export const LazySettings = withLazyLoading(Settings, 'page', 'Loading settings...');

export const LazySalesByBrandChart = withLazyLoading(SalesByBrandChart, 'chart');
export const LazyCustomerDensityMap = withLazyLoading(CustomerDensityMap, 'chart');
export const LazyRegionalSalesMap = withLazyLoading(RegionalSalesMap, 'chart');
export const LazyStoreLocationsMap = withLazyLoading(StoreLocationsMap, 'chart');
export const LazyTransactionsTable = withLazyLoading(TransactionsTable, 'table');

// Preload functions for better UX
export const preloadComponents = {
  dashboard: () => import('@/pages/DashboardPreview'),
  insights: () => import('@/pages/ConsumerInsights'),
  productMix: () => import('@/pages/ProductMix'),
  brands: () => import('@/pages/Brands'),
  trends: () => import('@/pages/Trends'),
  settings: () => import('@/pages/Settings'),
  charts: () =>
    Promise.all([
      import('@/components/widgets/SalesByBrandChart'),
      import('@/components/maps/CustomerDensityMap'),
      import('@/components/maps/RegionalSalesMap'),
    ]),
};

// Hook for preloading on hover/focus
export const usePreload = () => {
  const preload = (componentName: keyof typeof preloadComponents) => {
    preloadComponents[componentName]().catch(console.error);
  };

  return { preload };
};
