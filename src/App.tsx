import React from "react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LayoutSwitcher } from "./components/layout/LayoutSwitcher";
import { StockBotPanel } from "./components/StockBotPanel";
import "./index.css";

// 🔑 SINGLETON so it's not recreated on hot-reload
const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <LayoutSwitcher>
        <div className="p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🎯 Cruip Integration - Phase 1
          </h1>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-green-800 mb-3">
              ✅ Safe Scaffold Active
            </h2>
            <ul className="text-green-700 space-y-1">
              <li>• ErrorBoundary protection enabled</li>
              <li>• LayoutSwitcher with sidebar/header ready</li>
              <li>• TBWA theme preserved</li>
              <li>• Server stability confirmed</li>
            </ul>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-purple-800 mb-3">
              🤖 Groq StockBot Integration
            </h3>
            <ul className="text-purple-700 space-y-1">
              <li>✅ Groq AI (Llama 3.1 70B) integrated</li>
              <li>✅ Production-hardened retail tools</li>
              <li>✅ Philippine retail analytics ready</li>
              <li>✅ Chat panel available (bottom-right)</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              📊 Component Migration Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong className="text-blue-900">Phase 1:</strong>
                <ul className="text-blue-700 mt-1">
                  <li>✅ Sidebar layout</li>
                  <li>✅ Header navigation</li>
                  <li>✅ Layout toggle</li>
                  <li>✅ Groq StockBot</li>
                </ul>
              </div>
              <div>
                <strong className="text-blue-900">Phase 2:</strong>
                <ul className="text-gray-600 mt-1">
                  <li>⏳ Routes (one by one)</li>
                  <li>⏳ QueryProvider</li>
                  <li>⏳ Full dashboard</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        </LayoutSwitcher>
        
        {/* Groq StockBot Panel - Fixed positioned */}
        <StockBotPanel />
      </ErrorBoundary>
    </QueryClientProvider>
  );
}