import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface LiveIndicatorProps {
  isConnected: boolean;
  lastUpdate: Date | null;
  showUpdateNotification?: boolean;
  onDismissNotification?: () => void;
  onRefresh?: () => void;
  className?: string;
}

export function LiveIndicator({
  isConnected,
  lastUpdate,
  showUpdateNotification = false,
  onDismissNotification,
  onRefresh,
  className,
}: LiveIndicatorProps) {
  const [pulseAnimation, setPulseAnimation] = useState(false);

  useEffect(() => {
    if (showUpdateNotification) {
      setPulseAnimation(true);
      const timer = setTimeout(() => setPulseAnimation(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showUpdateNotification]);

  const formatLastUpdate = (date: Date | null) => {
    if (!date) return 'No updates yet';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Live Status Indicator */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <Wifi className="h-4 w-4 text-green-600" />
                  <div className="relative">
                    <div className={cn(
                      "h-2 w-2 rounded-full bg-green-600",
                      pulseAnimation && "animate-ping absolute"
                    )} />
                    <div className="h-2 w-2 rounded-full bg-green-600" />
                  </div>
                  <span className="text-sm font-medium text-green-600">Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-400">Offline</span>
                </>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              {isConnected 
                ? `Connected • Last update: ${formatLastUpdate(lastUpdate)}`
                : 'Not receiving real-time updates'
              }
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Update Notification */}
      {showUpdateNotification && onDismissNotification && (
        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-md text-sm animate-in slide-in-from-top-2">
          <RefreshCw className="h-3 w-3" />
          <span>New data available</span>
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onRefresh();
                onDismissNotification();
              }}
              className="h-auto p-0 ml-2 text-blue-700 hover:text-blue-800"
            >
              Refresh
            </Button>
          )}
          <button
            onClick={onDismissNotification}
            className="ml-2 text-blue-400 hover:text-blue-600"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}