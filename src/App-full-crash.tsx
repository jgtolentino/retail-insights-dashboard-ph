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
import { LayoutSwitcher } from '@/components/layout/LayoutSwitcher';
import { SupabaseStatus } from '@/components/SupabaseStatus';
import { FEATURE_FLAGS } from '@/config/features';
import { useEmergencyRenderLimit } from '@/hooks/debugging/useEmergencyRenderLimit';

// Import shared components
// import { ToastContainer } from "@/components/shared/ToastSystem";
// import { SkipToContent } from "@/components/shared/AccessibleComponents";
// import { LoadingComponent } from "@/components/LazyComponents";
// import { setupNetworkMonitoring } from "@/stores/errorStore";

// Import theme CSS
import '@/styles/theme.css';
import '@/styles/tbwa-theme.css';

// Lazy loaded pages for better performance
const Index = React.lazy(() => import('./pages/Index'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const ProductMix = React.lazy(() => import('./pages/ProductMix'));
const ConsumerInsights = React.lazy(() => import('./pages/ConsumerInsights'));
const Brands = React.lazy(() => import('./pages/Brands'));
const ProductInsights = React.lazy(() => import('./pages/ProductInsights'));
const BasketBehavior = React.lazy(() => import('./pages/BasketBehavior'));
const AIRecommendations = React.lazy(() => import('./pages/AIRecommendations'));
const Trends = React.lazy(() => import('./pages/Trends'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Sprint4Dashboard = React.lazy(() => import('./pages/Sprint4Dashboard'));
const DashboardPreview = React.lazy(() => import('./pages/DashboardPreview'));
const ClientDashboard = React.lazy(() => import('./pages/TBWADashboard'));
const ProjectScout = React.lazy(() => import('./pages/ProjectScout'));

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
      console.warn(`⚠️ ${componentName} has rendered ${renders.current} times`);
    }
  });

  return renders.current;
}

// Main App Component with all improvements
const App = () => {
  useEmergencyRenderLimit('App');
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

            <ErrorBoundary>
              <LayoutSwitcher>
                <main id="main-content" className="focus:outline-none">
                  <Suspense fallback={<div className="p-8 text-center">Loading dashboard...</div>}>
                    <Routes>
                    {FEATURE_FLAGS.DASHBOARD_OVERVIEW && <Route path="/" element={<Index />} />}
                    {FEATURE_FLAGS.TRENDS_PAGE && <Route path="/trends" element={<Trends />} />}
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

                    {/* Client Integrated Dashboard */}
                    <Route
                      path="/client"
                      element={
                        <SafeWrapper name="ClientDashboard" maxRenders={50}>
                          <ClientDashboard />
                        </SafeWrapper>
                      }
                    />
                    <Route
                      path="/client-dashboard"
                      element={
                        <SafeWrapper name="ClientDashboard" maxRenders={50}>
                          <ClientDashboard />
                        </SafeWrapper>
                      }
                    />

                    {/* Project Scout IoT + AI Dashboard */}
                    <Route
                      path="/project-scout"
                      element={
                        <SafeWrapper name="ProjectScout" maxRenders={50}>
                          <ProjectScout />
                        </SafeWrapper>
                      }
                    />
                    <Route
                      path="/iot"
                      element={
                        <SafeWrapper name="ProjectScout" maxRenders={50}>
                          <ProjectScout />
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
              </LayoutSwitcher>
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
