import React, { useState } from 'react';
import { Bot, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import GroqStockBot from './GroqStockBot';

interface StockBotPanelProps {
  className?: string;
}

export function StockBotPanel({ className = '' }: StockBotPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button - positioned fixed on screen */}
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              size="lg"
              className="rounded-full w-14 h-14 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-2 border-white"
            >
              <div className="relative">
                <Bot className="h-6 w-6 text-white" />
                {/* Pulse indicator */}
                <div className="absolute -top-1 -right-1">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </div>
            </Button>
          </SheetTrigger>

          <SheetContent 
            side="right" 
            className="w-full sm:w-[500px] p-0 border-l-2 border-blue-200"
          >
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bot className="h-6 w-6" />
                    <div>
                      <h2 className="font-semibold">StockBot Analytics</h2>
                      <p className="text-sm text-blue-100">Philippine Retail AI Assistant</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Live
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="text-white hover:bg-white/20"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Chat Interface */}
              <div className="flex-1 bg-white">
                <GroqStockBot 
                  isOpen={true} 
                  onClose={() => setIsOpen(false)}
                />
              </div>

              {/* Footer */}
              <div className="border-t bg-gray-50 p-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Connected to Supabase</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-3 w-3" />
                    <span>Powered by Groq AI</span>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Toast notification for first-time users */}
      {!isOpen && (
        <div className="fixed bottom-24 right-6 z-40 animate-bounce">
          <div className="bg-white rounded-lg shadow-lg border p-3 max-w-[200px]">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Try StockBot!</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Ask about TBWA performance, regional insights, or market anomalies
            </p>
            <div className="absolute -bottom-2 right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white"></div>
          </div>
        </div>
      )}
    </>
  );
}

export default StockBotPanel;