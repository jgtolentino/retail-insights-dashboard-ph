import React, { Suspense, useEffect, useRef } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SafeWrapper } from '@/components/SafeWrapper';
import { Layout } from '@/components/Layout';
import { LayoutSwitcher } from '@/components/layout/LayoutSwitcher';
import { SupabaseStatus } from '@/components/SupabaseStatus';
import { FEATURE_FLAGS } from '@/config/features';
import { useEmergencyRenderLimit } from '@/hooks/debugging/useEmergencyRenderLimit';

// Import theme CSS
import '@/styles/theme.css';
import '@/styles/tbwa-theme.css';

// Lazy loaded pages for better performance
const Index = React.lazy(() => import('./pages/Index'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

// Enhanced Query Client with better defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: process.env?.NODE_ENV === 'production',
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnReconnect: true,
      refetchInterval: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Simple test component
function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        🟢 Cruip Integration Test Page
      </h1>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Integration Status:</h2>
        <ul className="space-y-2">
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✅</span>
            React + TypeScript working
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✅</span>
            Tailwind CSS loaded
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✅</span>
            Layout switcher ready
          </li>
        </ul>
      </div>
    </div>
  );
}

// Main App Component
const App = () => {
  useEmergencyRenderLimit('App');
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <Toaster />
            <Sonner />
            <SupabaseStatus />

            <LayoutSwitcher>
              <main id="main-content" className="focus:outline-none">
                <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
                  <Routes>
                    <Route path="/" element={<TestPage />} />
                    <Route path="/test" element={<TestPage />} />
                    <Route path="*" element={<TestPage />} />
                  </Routes>
                </Suspense>
              </main>
            </LayoutSwitcher>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;