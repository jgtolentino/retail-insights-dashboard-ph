
import React, { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FilterProvider } from "@/contexts/FilterContext";
import { Layout } from "@/components/Layout";
import { FEATURE_FLAGS } from "@/config/features";

// Import shared components
// import { ToastContainer } from "@/components/shared/ToastSystem";
// import { SkipToContent } from "@/components/shared/AccessibleComponents";
// import { LoadingComponent } from "@/components/LazyComponents";
// import { setupNetworkMonitoring } from "@/stores/errorStore";

// Import theme CSS
// import "@/styles/theme.css";

// Lazy loaded pages for better performance
const Index = React.lazy(() => import("./pages/Index"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const ProductMix = React.lazy(() => import("./pages/ProductMix"));
const ConsumerInsights = React.lazy(() => import("./pages/ConsumerInsights"));
const Brands = React.lazy(() => import("./pages/Brands"));
const ProductInsights = React.lazy(() => import("./pages/ProductInsights"));
const BasketBehavior = React.lazy(() => import("./pages/BasketBehavior"));
const AIRecommendations = React.lazy(() => import("./pages/AIRecommendations"));
const Trends = React.lazy(() => import("./pages/Trends"));
const Settings = React.lazy(() => import("./pages/Settings"));
const Sprint4Dashboard = React.lazy(() => import("./pages/Sprint4Dashboard"));
const DashboardPreview = React.lazy(() => import("./pages/DashboardPreview"));

// Enhanced Query Client with better defaults
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
      refetchOnWindowFocus: process.env.NODE_ENV === 'production',
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnReconnect: true,
      refetchInterval: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Setup network monitoring on app load
// React.useEffect(() => {
//   const cleanup = setupNetworkMonitoring();
//   return cleanup;
// }, []);

// Main App Component with all improvements
const App = () => {
  // Setup network monitoring
  // React.useEffect(() => {
  //   const cleanup = setupNetworkMonitoring();
  //   return cleanup;
  // }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <FilterProvider>
          <TooltipProvider>
            <BrowserRouter>
              {/* Accessibility: Skip to content link */}
              {/* <SkipToContent /> */}
              
              {/* Toast notifications */}
              {/* <ToastContainer /> */}
              
              {/* Existing toasters */}
              <Toaster />
              <Sonner />
              
              <Layout>
                <main id="main-content" className="focus:outline-none">
                  <Suspense fallback={<div>Loading...</div>}>
                    <Routes>
                      {FEATURE_FLAGS.DASHBOARD_OVERVIEW && (
                        <Route path="/" element={<Index />} />
                      )}
                      {FEATURE_FLAGS.TRENDS_PAGE && (
                        <Route path="/trends" element={<Trends />} />
                      )}
                      {FEATURE_FLAGS.PRODUCT_INSIGHTS && (
                        <Route path="/product-insights" element={<ProductInsights />} />
                      )}
                      {FEATURE_FLAGS.CONSUMER_INSIGHTS && (
                        <Route path="/consumer-insights" element={<ConsumerInsights />} />
                      )}
                      {FEATURE_FLAGS.BASKET_BEHAVIOR && (
                        <Route path="/basket-behavior" element={<BasketBehavior />} />
                      )}
                      {FEATURE_FLAGS.AI_RECOMMENDATIONS && (
                        <Route path="/ai-recommendations" element={<AIRecommendations />} />
                      )}
                      {FEATURE_FLAGS.SETTINGS_PAGE && (
                        <Route path="/settings" element={<Settings />} />
                      )}
                      
                      {/* New Filter System Preview */}
                      <Route path="/dashboard-preview" element={<DashboardPreview />} />
                      <Route path="/filter-preview" element={<DashboardPreview />} />
                      
                      {/* Sprint 4: Advanced Analytics Dashboard */}
                      <Route path="/sprint4" element={<Sprint4Dashboard />} />
                      <Route path="/advanced-analytics" element={<Sprint4Dashboard />} />
                      
                      {/* Legacy routes (deprecated but kept for compatibility) */}
                      {FEATURE_FLAGS.PRODUCT_MIX && (
                        <Route path="/product-mix" element={<ProductMix />} />
                      )}
                      {FEATURE_FLAGS.BRANDS_PAGE && (
                        <Route path="/brands" element={<Brands />} />
                      )}
                      
                      {/* Catch-all route must be last */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </main>
              </Layout>
              
              {/* React Query DevTools (only in development) */}
              {/* {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} />
              )} */}
            </BrowserRouter>
          </TooltipProvider>
        </FilterProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
