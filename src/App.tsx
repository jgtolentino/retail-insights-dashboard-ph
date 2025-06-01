
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FilterProvider } from "@/contexts/FilterContext";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProductMix from "./pages/ProductMix";
import ConsumerInsights from "./pages/ConsumerInsights";
import Brands from "./pages/Brands";
import ProductInsights from "./pages/ProductInsights";
import BasketBehavior from "./pages/BasketBehavior";
import AIRecommendations from "./pages/AIRecommendations";
import Trends from "./pages/Trends";
import Settings from "./pages/Settings";
import Sprint4Dashboard from "./pages/Sprint4Dashboard";
import DashboardPreview from "./pages/DashboardPreview";
import { FEATURE_FLAGS } from "@/config/features";
// import EnvTest from "./pages/EnvTest";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: process.env.NODE_ENV === 'production' ? 2 : 0,
      refetchOnWindowFocus: process.env.NODE_ENV === 'production',
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <FilterProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Layout>
              <Routes>
                {FEATURE_FLAGS.DASHBOARD_OVERVIEW && <Route path="/" element={<Index />} />}
                {FEATURE_FLAGS.TRENDS_PAGE && <Route path="/trends" element={<Trends />} />}
                {FEATURE_FLAGS.PRODUCT_INSIGHTS && <Route path="/product-insights" element={<ProductInsights />} />}
                {FEATURE_FLAGS.CONSUMER_INSIGHTS && <Route path="/consumer-insights" element={<ConsumerInsights />} />}
                {FEATURE_FLAGS.BASKET_BEHAVIOR && <Route path="/basket-behavior" element={<BasketBehavior />} />}
                {FEATURE_FLAGS.AI_RECOMMENDATIONS && <Route path="/ai-recommendations" element={<AIRecommendations />} />}
                {FEATURE_FLAGS.SETTINGS_PAGE && <Route path="/settings" element={<Settings />} />}
                
                {/* New Filter System Preview */}
                <Route path="/dashboard-preview" element={<DashboardPreview />} />
                <Route path="/filter-preview" element={<DashboardPreview />} />
                
                {/* Sprint 4: Advanced Analytics Dashboard */}
                <Route path="/sprint4" element={<Sprint4Dashboard />} />
                <Route path="/advanced-analytics" element={<Sprint4Dashboard />} />
                
                {/* Legacy routes (deprecated but kept for compatibility) */}
                {FEATURE_FLAGS.PRODUCT_MIX && <Route path="/product-mix" element={<ProductMix />} />}
                {FEATURE_FLAGS.BRANDS_PAGE && <Route path="/brands" element={<Brands />} />}
                
                {/* <Route path="/env-test" element={<EnvTest />} /> */}
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </TooltipProvider>
      </FilterProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
