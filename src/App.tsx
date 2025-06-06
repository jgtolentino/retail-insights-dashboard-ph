import React, { Suspense, useEffect, useRef } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SafeWrapper } from '@/components/SafeWrapper';
// Removed old FilterProvider - now using Zustand dashboardStore
import { Layout } from '@/components/Layout';
import { SupabaseStatus } from '@/components/SupabaseStatus';
import { FEATURE_FLAGS } from '@/config/features';

// Import shared components
// import { ToastContainer } from "@/components/shared/ToastSystem";
// import { SkipToContent } from "@/components/shared/AccessibleComponents";
// import { LoadingComponent } from "@/components/LazyComponents";
// import { setupNetworkMonitoring } from "@/stores/errorStore";

// Import theme CSS
import '@/styles/theme.css';
import '@/styles/tbwa-theme.css';

// Lazy loaded pages for better performance - New Power BI Storytelling Structure
const Overview = React.lazy(() => import('./pages/Overview'));
const DataHealth = React.lazy(() => import('./pages/DataHealth'));
const GeospatialPerformance = React.lazy(() => import('./pages/GeospatialPerformance'));
const ProductTrends = React.lazy(() => import('./pages/ProductTrends'));
const ConsumerSegments = React.lazy(() => import('./pages/ConsumerSegments'));
const BasketAnalysis = React.lazy(() => import('./pages/BasketAnalysis'));
const AIInsights = React.lazy(() => import('./pages/AIInsights'));

// Legacy pages (kept for compatibility)
const NotFound = React.lazy(() => import('./pages/NotFound'));
const ProductMix = React.lazy(() => import('./pages/ProductMix'));
const Brands = React.lazy(() => import('./pages/Brands'));
const Trends = React.lazy(() => import('./pages/Trends'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Sprint4Dashboard = React.lazy(() => import('./pages/Sprint4Dashboard'));
const TBWADashboard = React.lazy(() => import('./pages/TBWADashboard'));

// Enhanced Query Client with better defaults - Fixed deprecated cacheTime
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: process.env?.NODE_ENV === 'production',
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
      refetchOnReconnect: true,
      refetchInterval: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Add this hook at the top level of your App or relevant root component
function useRenderCounter(componentName: string) {
  const renders = useRef(0);
  renders.current++;

  useEffect(() => {
    if (renders.current > 50) {
      console.error(`🚨 ${componentName} rendered ${renders.current} times!`);
      console.trace();
    }
  });

  console.log(`${componentName} render #${renders.current}`);
}

// Main App Component with all improvements
const App = () => {
  useRenderCounter('App');
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            {/* Accessibility: Skip to content link */}
            {/* <SkipToContent /> */}

            {/* Toast notifications */}
            {/* <ToastContainer /> */}

            {/* Existing toasters */}
            <Toaster />
            <Sonner />

            {/* Supabase connection status */}
            <SupabaseStatus />

            <Layout>
              <main id="main-content" className="focus:outline-none">
                <Suspense fallback={<div>Loading...</div>}>
                  <Routes>
                    {/* New Power BI Storytelling Structure */}
                    <Route path="/" element={<Overview />} />
                    <Route path="/overview" element={<Overview />} />
                    <Route path="/data-health" element={<DataHealth />} />
                    <Route path="/geospatial-performance" element={<GeospatialPerformance />} />
                    <Route path="/product-trends" element={<ProductTrends />} />
                    <Route path="/consumer-segments" element={<ConsumerSegments />} />
                    <Route path="/basket-analysis" element={<BasketAnalysis />} />
                    <Route path="/ai-insights" element={<AIInsights />} />

                    {/* Legacy routes for backward compatibility */}
                    {FEATURE_FLAGS.TRENDS_PAGE && <Route path="/trends" element={<Trends />} />}
                    {FEATURE_FLAGS.PRODUCT_INSIGHTS && (
                      <Route path="/product-insights" element={<ProductTrends />} />
                    )}
                    {FEATURE_FLAGS.CONSUMER_INSIGHTS && (
                      <Route path="/consumer-insights" element={<ConsumerSegments />} />
                    )}
                    {FEATURE_FLAGS.BASKET_BEHAVIOR && (
                      <Route path="/basket-behavior" element={<BasketAnalysis />} />
                    )}
                    {FEATURE_FLAGS.AI_RECOMMENDATIONS && (
                      <Route path="/ai-recommendations" element={<AIInsights />} />
                    )}
                    {FEATURE_FLAGS.SETTINGS_PAGE && (
                      <Route path="/settings" element={<Settings />} />
                    )}

                    {/* System Health and Regional Analysis */}
                    <Route path="/project-scout" element={<DataHealth />} />
                    <Route path="/dashboard-preview" element={<GeospatialPerformance />} />
                    <Route path="/filter-preview" element={<GeospatialPerformance />} />

                    {/* Sprint 4: Advanced Analytics Dashboard */}
                    <Route
                      path="/sprint4"
                      element={
                        <SafeWrapper name="Sprint4Dashboard" maxRenders={50}>
                          <Sprint4Dashboard />
                        </SafeWrapper>
                      }
                    />
                    <Route
                      path="/advanced-analytics"
                      element={
                        <SafeWrapper name="Sprint4Dashboard" maxRenders={50}>
                          <Sprint4Dashboard />
                        </SafeWrapper>
                      }
                    />

                    {/* TBWA Integrated Dashboard */}
                    <Route
                      path="/tbwa"
                      element={
                        <SafeWrapper name="TBWADashboard" maxRenders={50}>
                          <TBWADashboard />
                        </SafeWrapper>
                      }
                    />
                    <Route
                      path="/tbwa-dashboard"
                      element={
                        <SafeWrapper name="TBWADashboard" maxRenders={50}>
                          <TBWADashboard />
                        </SafeWrapper>
                      }
                    />

                    {/* IoT Health Monitoring */}
                    <Route
                      path="/iot"
                      element={
                        <SafeWrapper name="DataHealth" maxRenders={50}>
                          <DataHealth />
                        </SafeWrapper>
                      }
                    />

                    {/* Legacy routes (deprecated but kept for compatibility) */}
                    {FEATURE_FLAGS.PRODUCT_MIX && (
                      <Route path="/product-mix" element={<ProductMix />} />
                    )}
                    {FEATURE_FLAGS.BRANDS_PAGE && <Route path="/brands" element={<Brands />} />}

                    {/* Catch-all route must be last */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </main>
            </Layout>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
